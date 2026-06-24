// Gestión de Autenticación con Supabase

let currentUser = null;

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userEmailSpan = document.getElementById('user-email');
const btnLogout = document.getElementById('btn-logout');

// Inicializar Auth
async function initAuth() {
    // Escuchar cambios en el estado de autenticación
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            currentUser = session.user;
            showMainScreen();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showLoginScreen();
        }
    });

    // Revisar si ya hay una sesión activa
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        showMainScreen();
    } else {
        showLoginScreen();
    }
}

// Manejar login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ingresando...';
        loginError.textContent = '';
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error de login:', error.message);
        loginError.textContent = 'Credenciales inválidas. Por favor, intente nuevamente.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ingresar';
    }
});

// Manejar logout
btnLogout.addEventListener('click', async () => {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
    }
});

// Utilidades de UI para Auth
function showMainScreen() {
    loginScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    if (currentUser) {
        userEmailSpan.textContent = currentUser.email;
    }
    
    // Disparar evento para cargar datos
    document.dispatchEvent(new CustomEvent('auth-success'));
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// Inicializar autenticación cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});
