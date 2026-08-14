// auth.js - Shared Authentication for Infinite Cyberspace Hub

const AUTH_KEY = 'ich_auth_token';
const USER_KEY = 'ich_user';

// Temporary users (we will move these to the database in Step 2)
const USERS = [
  {
    id: 1,
    email: 'admin@infinitecyberspace.com',
    password: 'admin123',          // Will be hashed later
    name: 'Augustine Ouma',
    role: 'admin',
    company: 'Infinite Cyberspace Hub'
  },
  {
    id: 2,
    email: 'demo@client.com',
    password: 'demo123',
    name: 'John Odhiambo',
    role: 'client',
    company: 'Acme Solutions Ltd'
  }
  // Protect the portal
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn() && getCurrentUser().role === 'client') {
    showPortal();
  }
});
];

// Simple token generator (we will replace with real JWT in backend)
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload)); // Base64 for now
}

function parseToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch (e) {
    return null;
  }
}

// ========== PUBLIC FUNCTIONS ==========

function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const result = login(email, password); // from auth.js

  if (result.success) {
    if (result.user.role === 'client') {
      showPortal();
    } else if (result.user.role === 'admin') {
      window.location.href = 'admin.html';
    }
  } else {
    document.getElementById('login-error').textContent = result.message;
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'portal.html'; // or create a shared login page later
}

function getCurrentUser() {
  const token = localStorage.getItem(AUTH_KEY);
  if (!token) return null;

  const payload = parseToken(token);
  if (!payload || payload.exp < Date.now()) {
    logout();
    return null;
  }

  return JSON.parse(localStorage.getItem(USER_KEY));
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  
  if (!user) {
    // Redirect to login
    window.location.href = 'portal.html'; // temporary - we can make a dedicated login later
    return false;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert('Access denied. You do not have permission.');
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
