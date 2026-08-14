// auth.js - Shared Authentication (connected to backend)

const API_URL = 'http://localhost:3000/api';   // Change this later when you deploy
const AUTH_KEY = 'ich_auth_token';
const USER_KEY = 'ich_user';

async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, message: data.message || 'Login failed' };
    }

    localStorage.setItem(AUTH_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return { success: true, user: data.user };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Cannot connect to server. Is the backend running?' };
  }
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'portal.html';
}

function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

function getCurrentUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!getToken() && !!getCurrentUser();
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

function requireAuth(allowedRoles = []) {
  if (!isLoggedIn()) {
    window.location.href = 'portal.html';
    return false;
  }

  const user = getCurrentUser();
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert('Access denied');
    logout();
    return false;
  }
  return true;
}

function requireAdmin() {
  return requireAuth(['admin']);
}

function requireClient() {
  return requireAuth(['client']);
}
