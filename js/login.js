 // ===== LOGIN - AUTENTICAÇÃO NOVO BACKEND =====
// Suporta login por E-MAIL ou CPF + SENHA, enviando para POST /autenticar
// Espera receber um UsuarioResponse (ex.: id, nome, email, cpf, autenticado, nivel, empresa, etc.)

async function fazerLogin() {
  console.log("entrei")
  // =========================
  // 1) COLETA DE CAMPOS
  // =========================
  const valorIdentificador = document.getElementById("email")?.value?.trim() || ""; // pode ser e-mail OU CPF
  const valorSenhaLogin = document.getElementById("password")?.value || "";
  // (Opcional) Se houver um campo específico de CPF no form, descomente:
  // const valorCpfCampo = document.getElementById("cpf")?.value?.replace(/\D/g, "") || "";

  // =========================
  // 2) VALIDAÇÕES BÁSICAS
  // =========================
  if (!valorIdentificador) {
    Swal.fire({ icon: "error", title: "Erro no login", text: "Informe seu e-mail ou CPF." });
    return;
  }
  if (!valorSenhaLogin) {
    Swal.fire({ icon: "error", title: "Erro no login", text: "O campo senha é obrigatório." });
    return;
  }

  // Detecta se o identificador é e-mail (tem @) ou tratar como CPF
  const ehEmail = valorIdentificador.includes("@");
  let email = "";
  let cpf = "";

  if (ehEmail) {
    // Validação simples de e-mail
    const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!padraoEmail.test(valorIdentificador)) {
      Swal.fire({ icon: "error", title: "Erro no login", text: "O e-mail informado é inválido." });
      return;
    }
    email = valorIdentificador;
  } else {

    cpf = valorIdentificador.replace(/\D/g, "");
    if (cpf.length < 11) {
      Swal.fire({ icon: "error", title: "Erro no login", text: "CPF inválido. Use 11 dígitos (apenas números)." });
      return;
    }
  }

  const loginForm = {
    email: email || "",
    cpf: cpf || "",
    senha: valorSenhaLogin
  };

  try {

    const resposta = await fetch("vaction/usuarios/autenticar", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(loginForm)
    });


    if (resposta.status === 201 || resposta.status === 200) {
      const json = await resposta.json();

      // Guarda dados principais do usuário
      sessionStorage.setItem("ID_USUARIO", String(json.id ?? json.id_usuario ?? ""));
      sessionStorage.setItem("NOME_USUARIO", json.nome ?? "");
      sessionStorage.setItem("EMAIL_USUARIO", json.email ?? "");
      sessionStorage.setItem("CPF_USUARIO", json.cpf ?? "");
      sessionStorage.setItem("AUTENTICADO", String(json.autenticado ?? true));

      // Nivel de acesso, pega de onde existir
      const nivelAcessoObj = json.nivelAcesso || json.nivel || json.nivel_acesso;
      let nivelAcessoValue = 'COLABORADOR';

      if (nivelAcessoObj) {
        // Tenta pegar o nome do enum
        nivelAcessoValue = nivelAcessoObj.nome || nivelAcessoObj.descricao || 'COLABORADOR';
        // Garante que está em string e maiúsculas
        nivelAcessoValue = String(nivelAcessoValue).toUpperCase().trim();
      } else if (json.nivel) {
        nivelAcessoValue = String(json.nivel).toUpperCase().trim();
      }

      sessionStorage.setItem("NIVEL_ACESSO", nivelAcessoValue);
      console.log('NIVEL_ACESSO salvo:', nivelAcessoValue);

      // Empresa, se existir no response
      if (json.empresa) {
        if (json.empresa.cnpj) {
          sessionStorage.setItem("cnpj_empresa", json.empresa.cnpj);
        }
        if (json.empresa.id) {
          sessionStorage.setItem("id_empresa", String(json.empresa.id));
        }
        if (json.empresa.nome) {
          sessionStorage.setItem("EMPRESA_NOME", json.empresa.nome);
        }
      }

      // Campos opcionais
      if (json.cargo) {
        sessionStorage.setItem("CARGO_USUARIO", json.cargo);
      }
      if (json.area) {
        sessionStorage.setItem("AREA_USUARIO", json.area);
      }
      const dataAdmissao = json.dataAdmissao ?? json.data_admissao;
      if (dataAdmissao) {
        sessionStorage.setItem("DATA_ADMISSAO", dataAdmissao);
      }

      Swal.fire({
        icon: "success",
        title: "Autenticado!",
        text: "Redirecionando...",
        showConfirmButton: false,
        timer: 1200
      }).then(() => {
        // Usa o nivelAcessoValue calculado acima
        if (nivelAcessoValue === "GESTOR" || nivelAcessoValue === "RH") {
          window.location.href = "./inicio.html";
        } else {
        window.location.href = "./inicio.html";
        }
      });

    } else {
      // =========================
      // 7) ERROS DE AUTENTICAÇÃO
      // =========================
      let mensagemErro;
      switch (resposta.status) {
        case 403:
          mensagemErro = "Credenciais inválidas. Verifique seu e-mail/CPF e senha.";
          break;
        case 404:
          mensagemErro = "Rota não encontrada. Verifique a URL do backend.";
          break;
        default:
          mensagemErro = `Erro inesperado: ${resposta.status}`;
      }
      Swal.fire({ icon: "error", title: "Erro no login", text: mensagemErro });
    }
  } catch (error) {
    // =========================
    // 8) FALHA DE REDE / CORS
    // =========================
    Swal.fire({
      icon: "error",
      title: "Erro no login",
      text: "Não foi possível conectar ao servidor. Verifique se a API está ativa e o CORS liberado."
    });
  }
}
