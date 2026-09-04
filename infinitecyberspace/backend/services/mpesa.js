const axios = require('axios');

const isSandbox = (process.env.MPESA_ENV || 'sandbox') === 'sandbox';
const BASE = isSandbox
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const { data } = await axios.get(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (Number(data.expires_in || 3599) - 60) * 1000;
  return cachedToken;
}

function formatPhone(phone) {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) p = '254' + p;
  if (!p.startsWith('254') || p.length !== 12) {
    throw new Error('Invalid Kenyan phone. Use 07XXXXXXXX or 2547XXXXXXXX');
  }
  return p;
}

function timestamp() {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

async function stkPush({ phone, amount, accountReference, transactionDesc }) {
  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`
  ).toString('base64');

  const formattedPhone = formatPhone(phone);

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(Number(amount)),
    PartyA: formattedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: String(accountReference || 'ICH').slice(0, 12),
    TransactionDesc: String(transactionDesc || 'Package').slice(0, 13)
  };

  const { data } = await axios.post(
    `${BASE}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return data;
}

module.exports = { stkPush, formatPhone, getAccessToken };