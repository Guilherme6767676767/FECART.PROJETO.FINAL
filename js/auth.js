/* ============================================
   SENTINEL IA — Guarda de Autenticação, Registro & Bloqueio
   ============================================ */

(function () {
  'use strict';

  const AUTH_KEY = 'sentinel_logged_in';
  const USERS_KEY = 'sentinel_registered_users';
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isLoginPage = currentPage.toLowerCase() === 'login.html';

  // Buscar usuários cadastrados no localStorage
  function getRegisteredUsers() {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Verificar se o usuário está autenticado (sessionStorage ou localStorage)
  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
  }

  // Se não estiver logado e tentar acessar qualquer página que não seja login.html -> Redireciona
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

    const cleanUser = username.trim().toLowerCase();
    const registered = getRegisteredUsers();
    const userMatch = registered.find(u => u.email.toLowerCase() === cleanUser || u.username.toLowerCase() === cleanUser);

    if (userMatch) {
      if (userMatch.password !== password) {
        return { success: false, message: 'Senha incorreta para esta conta cadastrada.' };
      }
    }

    if (username.length >= 3 && password.length >= 3) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(AUTH_KEY, 'true');
      storage.setItem('sentinel_user', userMatch ? userMatch.name : username);
      storage.setItem('sentinel_user_role', userMatch ? userMatch.role : 'Operador Urbano');
      return { success: true };
    }

    return { success: false, message: 'Usuário ou senha inválidos. (Mínimo de 3 caracteres).' };
  };

  // Função Global de Registro / Criar Conta
  window.sentinelRegister = function (name, role, email, password, confirmPassword) {
    if (!name || !email || !password || !confirmPassword) {
      return { success: false, message: 'Por favor, preencha todos os campos obrigatórios.' };
    }

    if (password.length < 4) {
      return { success: false, message: 'A senha deve ter no mínimo 4 caracteres.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'As senhas digitadas não coincidem.' };
    }

    const registered = getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    
    if (registered.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Este e-mail/usuário já está cadastrado. Faça login.' };
    }

    const newUser = {
      id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      role: role || 'Operador Urbano',
      email: cleanEmail,
      username: cleanEmail.split('@')[0],
      password: password,
      createdAt: new Date().toISOString()
    };

    registered.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(registered));

    // Efetua login automático do novo usuário
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem('sentinel_user', newUser.name);
    localStorage.setItem('sentinel_user_role', newUser.role);

    return { success: true, message: 'Conta criada com sucesso! Redirecionando...' };
  };

  // Função Global de Logout (Sair e Bloquear)
  window.sentinelLogout = function () {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem('sentinel_user');
    sessionStorage.removeItem('sentinel_user_role');
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('sentinel_user');
    localStorage.removeItem('sentinel_user_role');
    window.location.href = 'login.html';
  };

  // Atualizar dados do usuário no DOM ao carregar qualquer página
  document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('sentinel_user') || sessionStorage.getItem('sentinel_user');
    const role = localStorage.getItem('sentinel_user_role') || sessionStorage.getItem('sentinel_user_role');
    
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    
    if (nameEl && user) nameEl.textContent = user;
    if (roleEl && role) roleEl.textContent = role;
  });

})();
