// ===== CONTROLE DO MENU DE USUÁRIO (AVATAR + DROPDOWN) =====

document.addEventListener('DOMContentLoaded', function() {
    const avatarButton = document.getElementById('user-avatar-button');
    const dropdown = document.getElementById('user-dropdown');
    
    if (!avatarButton || !dropdown) return;
    
    // Toggle do dropdown ao clicar no avatar
    avatarButton.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Fecha o dropdown ao clicar fora dele
    document.addEventListener('click', function(e) {
        if (!avatarButton.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Fecha o dropdown ao clicar em um item
    const dropdownItems = dropdown.querySelectorAll('.user-dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            dropdown.classList.remove('show');
        });
    });
    
    // Carrega foto do usuário se disponível no sessionStorage ou localStorage
    const userPhoto = sessionStorage.getItem('USER_PHOTO') || localStorage.getItem('userPhoto');
    const avatarImg = avatarButton.querySelector('img');
    if (userPhoto && avatarImg) {
        avatarImg.src = userPhoto;
        avatarImg.style.display = 'block';
        // Esconde o ícone SVG se houver imagem
        const avatarIcon = avatarButton.querySelector('svg');
        if (avatarIcon) {
            avatarIcon.style.display = 'none';
        }
    }
});

