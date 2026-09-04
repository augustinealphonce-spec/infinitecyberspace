const API_ROOT = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000' : 'https://YOUR-BACKEND-URL';

async function apiGet(path) {
  const res = await fetch(API_ROOT + path, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('ich_auth_token') }
  });
  if (res.status === 401) { /* logout */ throw new Error('auth'); }
  return res.json();
}

async function loadPortalData() {
  const [sub, tickets, payments, reports] = await Promise.all([
    apiGet('/api/me/subscription'),
    apiGet('/api/me/tickets'),
    apiGet('/api/me/payments'),
    apiGet('/api/me/reports')
  ]);
  // bind into your existing DOM:
  // sub.subscription → Protection view
  // tickets.tickets → Support list
  // payments.payments → Billing
  // reports.reports → Documents
  window.__ICH = { sub, tickets, payments, reports };
  return window.__ICH;
}

async function createTicket({ subject, description, priority, category }) {
  const res = await fetch(API_ROOT + '/api/me/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('ich_auth_token')
    },
    body: JSON.stringify({ subject, description, priority, category })
  });
  return res.json();
}