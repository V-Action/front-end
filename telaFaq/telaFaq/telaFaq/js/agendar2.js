function preencherCamposDoUsuario() {
  const nome = sessionStorage.getItem("NOME_USUARIO");
  const area = sessionStorage.getItem("AREA_USUARIO");
  const cargo = sessionStorage.getItem("CARGO_USUARIO");

  const inputNome = document.getElementById("name");
  const selArea = document.getElementById("department");
  const selCargo = document.getElementById("role");

  if (inputNome && nome) inputNome.value = nome;
  if (selArea && area) selArea.value = area;
  if (selCargo && cargo) selCargo.value = cargo;
}
function coletarDadosFormulario() {
  return {
    nome: (document.getElementById("name")?.value || "").trim(),
    area: document.getElementById("department")?.value || "",
    cargo: document.getElementById("role")?.value || "",
    dataInicio: document.getElementById("startDate")?.value || "",
    dataFim: document.getElementById("endDate")?.value || "",
    usuarioId: sessionStorage.getItem("ID_USUARIO")
  };
}
function validarPeriodo(dataInicioStr, dataFimStr) {
  if (!dataInicioStr || !dataFimStr) {
    throw new Error("Selecione a data inicial e a data final.");
  }
  const di = parseISODate(dataInicioStr);
  const df = parseISODate(dataFimStr);
  if (isNaN(di) || isNaN(df)) {
    throw new Error("Datas inválidas.");
  }
  if (df < di) {
    throw new Error("A data final não pode ser anterior à data inicial.");
  }
  // Opcional: impedir períodos de 0 dia
  if (diasEntre(di, df) < 15) {
    throw new Error("O período deve ter pelo menos 15 dia.");
  }
}
