/* ============================================
   SENTINEL IA — Guarda de Autenticação & Bloqueio
   ============================================ */

(function () {
  'use strict';

  const AUTH_KEY = 'sentinel_logged_in';
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isLoginPage = currentPage.toLowerCase() === 'login.html';

  // Verificar se o usuário está autenticado (sessionStorage ou localStorage)
  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
  }

  // Se não estiver logado e tentar acessar qualquer página que não seja o login.html -> Redireciona na hora
  if (!isAuthenticated() && !isLoginPage) {
    window.location.href = 'login.html';
    return;
  }

  // Se já estiver logado e tentar acessar o login.html -> Redireciona para o Dashboard
  if (isAuthenticated() && isLoginPage) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Função Global de Login
  window.sentinelLogin = function (username, password, remember = false) {
    if (!username || !password) {
      return { success: false, message: 'Por favor, preencha o usuário e a senha.' };
    }

    // Aceita qualquer usuário/senha no ambiente de demonstração ou credencial admin
    if (username.length >= 3 && password.length >= 3) {
      if (remember) {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem('sentinel_user', username);
      } else {
        sessionStorage.setItem(AUTH_KEY, 'true');
        sessionStorage.setItem('sentinel_user', username);
      }
      return { success: true };
    }

    return { success: false, message: 'Usuário ou senha inválidos. (Mínimo de 3 caracteres).' };
  };

  // Função Global de Logout (Sair e Bloquear)
  window.sentinelLogout = function () {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('sentinel_user');
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('sentinel_user');
    window.location.href = 'login.html';
  };

})();
