// ===== FUNÇÃO DE LOGOUT =====
// Limpa todos os dados da sessão e redireciona para a tela de login

function fazerLogout() {
    // Confirmação antes de fazer logout
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        // Limpa todo o sessionStorage
        sessionStorage.clear();
        
        // Limpa também o localStorage (caso tenha algum dado relacionado)
        // Mantém o tema, então não limpa o localStorage
        
        // Redireciona para a tela de login
        // Usa caminho relativo que funciona a partir de qualquer página HTML
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        
        if (isInHtmlFolder) {
            window.location.href = 'login.html';
        } else {
            window.location.href = './login.html';
        }
    }
}

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
// Função disponível para uso opcional, mas não executa automaticamente
// Use esta função manualmente se quiser verificar autenticação em páginas específicas

function verificarAutenticacao() {
    const autenticado = sessionStorage.getItem('AUTENTICADO');
    const idUsuario = sessionStorage.getItem('ID_USUARIO');
    
    // Se não estiver autenticado ou não tiver ID de usuário, redireciona para login
    if (!autenticado || autenticado === 'false' || !idUsuario) {
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        
        if (isInHtmlFolder) {
            window.location.href = 'login.html';
        } else {
            window.location.href = './html/login.html';
        }
    }
}

// NÃO executa verificação automática - permite acesso livre às páginas
// A verificação pode ser chamada manualmente se necessário em páginas específicas

// Torna a função fazerLogout disponível globalmente
window.fazerLogout = fazerLogout;

