import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM - Elementos del Nav
    const userDisplay = document.getElementById('user-display');
    const btnLoginModal = document.getElementById('btn-login-modal');
    const btnLogout = document.getElementById('btn-logout');

    // Referencias DOM - Elementos de la Modal
    const authModal = document.getElementById('auth-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const btnSubmitAuth = document.getElementById('btn-submit-auth');
    const authError = document.getElementById('auth-error');

    // Elementos de Toggle (Login/Registro)
    const btnToggleAuth = document.getElementById('btn-toggle-auth');
    const authToggleText = document.getElementById('auth-toggle-text');

    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');

    // Estado local: true = Login, false = Registro
    let isLoginMode = true;

    // --- MANEJO DE LA INTERFAZ DE USUARIO ---

    // Cambiar texto de modales dependiendo del modo
    function toggleAuthMode() {
        isLoginMode = !isLoginMode;
        authError.textContent = ''; // Limpiar errores previos

        if (isLoginMode) {
            authTitle.textContent = 'Iniciar Sesión';
            btnSubmitAuth.textContent = 'Entrar';
            authToggleText.textContent = '¿No tienes cuenta?';
            btnToggleAuth.textContent = 'Regístrate';
        } else {
            authTitle.textContent = 'Crear Cuenta Nueva';
            btnSubmitAuth.textContent = 'Registrarse';
            authToggleText.textContent = '¿Ya tienes cuenta?';
            btnToggleAuth.textContent = 'Inicia Sesión';
        }
    }

    // Mostrar/Ocultar Modal
    function openModal() {
        authModal.style.display = 'flex';
        // Reseteamos al modo login y borramos campos
        isLoginMode = true;
        authForm.reset();
        authError.textContent = '';
        authTitle.textContent = 'Iniciar Sesión';
        btnSubmitAuth.textContent = 'Entrar';
        authToggleText.textContent = '¿No tienes cuenta?';
        btnToggleAuth.textContent = 'Regístrate';
    }

    function closeModal() {
        authModal.style.display = 'none';
    }

    // Escuchadores de interfaz
    btnLoginModal?.addEventListener('click', openModal);
    btnCloseModal?.addEventListener('click', closeModal);
    btnToggleAuth?.addEventListener('click', toggleAuthMode);

    // Cerrar modal cliqueando fuera del contenido
    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeModal();
        }
    });

    // --- LÓGICA DE FIREBASE AUTH ---

    // Observador de Estado: se dispara automáticamente si el usuario hace login/logout
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario está logueado
            if (userDisplay) {
                userDisplay.textContent = user.email;
                userDisplay.style.display = 'inline-block';
            }
            if (btnLoginModal) btnLoginModal.style.display = 'none';
            if (btnLogout) btnLogout.style.display = 'inline-block';

            // Cerrar modal automáticamente si estaba abierta
            closeModal();
        } else {
            // No hay usuario
            if (userDisplay) userDisplay.style.display = 'none';
            if (btnLoginModal) btnLoginModal.style.display = 'inline-block';
            if (btnLogout) btnLogout.style.display = 'none';
        }
    });

    // Enviar Formulario (Login o Registro)
    authForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Animaciones UX (Loading state)
        btnSubmitAuth.textContent = 'Procesando...';
        btnSubmitAuth.disabled = true;
        authError.textContent = '';

        if (isLoginMode) {
            // INICIO DE SESIÓN
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // El login fue exitoso (onAuthStateChanged atrapará esto)
                    btnSubmitAuth.disabled = false;
                })
                .catch((error) => {
                    handleAuthError(error.code);
                    btnSubmitAuth.disabled = false;
                    btnSubmitAuth.textContent = 'Entrar';
                });
        } else {
            // REGISTRO
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Registro exitoso
                    btnSubmitAuth.disabled = false;
                })
                .catch((error) => {
                    handleAuthError(error.code);
                    btnSubmitAuth.disabled = false;
                    btnSubmitAuth.textContent = 'Registrarse';
                });
        }
    });

    // Cierre de Sesión
    btnLogout?.addEventListener('click', () => {
        signOut(auth).catch((error) => {
            console.error("Error signing out: ", error);
        });
    });

    // --- TRADUCCIÓN DE ERRORES ---
    function handleAuthError(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email':
                authError.textContent = 'El formato del correo es inválido.';
                break;
            case 'auth/user-disabled':
                authError.textContent = 'Esta cuenta ha sido deshabilitada.';
                break;
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                authError.textContent = 'Correo o contraseña incorrectos.';
                break;
            case 'auth/email-already-in-use':
                authError.textContent = 'Ya existe una cuenta con este correo.';
                break;
            case 'auth/weak-password':
                authError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                break;
            default:
                authError.textContent = 'Ocurrió un error. Inténtalo de nuevo.';
                console.error("Firebase Auth Error:", errorCode);
        }
    }
});
