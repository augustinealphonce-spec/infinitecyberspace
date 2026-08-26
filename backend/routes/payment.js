const { stkPush } = require('./services/mpesa');
const db = require('./db');

// Initiate STK Push
app.post('/api/payments/mpesa/stk', async (req, res) => {
  try {
    const { phone, packageCode, userId = null } = req.body;

    if (!phone || !packageCode) {
      return res.status(400).json({ success: false, message: 'Phone and package are required' });
    }

    const pkg = db.prepare('SELECT * FROM packages WHERE code = ? AND is_active = 1').get(packageCode);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const accountRef = `ICH-${packageCode.toUpperCase()}`;
    const result = await stkPush({
      phone,
      amount: pkg.price_kes,
      accountReference: accountRef,
      transactionDesc: pkg.name.substring(0, 13)
    });

    if (result.ResponseCode !== '0') {
      return res.status(400).json({
        success: false,
        message: result.ResponseDescription || 'Failed to initiate payment'
      });
    }

    // Save pending payment
    db.prepare(`
      INSERT INTO payments 
        (checkout_request_id, merchant_request_id, phone, amount, package_code, user_id, account_reference, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      result.CheckoutRequestID,
      result.MerchantRequestID,
      phone,
      pkg.price_kes,
      packageCode,
      userId,
      accountRef
    );

    res.json({
      success: true,
      message: 'STK Push sent. Check your phone.',
      checkoutRequestId: result.CheckoutRequestID
    });
  } catch (err) {
    console.error('STK Error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Could not initiate M-Pesa payment'
    });
  }
});

// Daraja Callback (must be public HTTPS)
app.post('/api/payments/mpesa/callback', (req, res) => {
  // Always respond 200 quickly so Safaricom doesn’t retry endlessly
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const body = req.body;
    const callback = body?.Body?.stkCallback;
    if (!callback) return;

    const checkoutId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    const payment = db.prepare('SELECT * FROM payments WHERE checkout_request_id = ?').get(checkoutId);
    if (!payment || payment.status !== 'pending') return;

    if (resultCode === 0) {
      // Success
      const metadata = callback.CallbackMetadata?.Item || [];
      const get = (name) => metadata.find(i => i.Name === name)?.Value;

      const receipt = get('MpesaReceiptNumber');
      const amount = get('Amount');
      const phone = get('PhoneNumber');

      db.prepare(`
        UPDATE payments SET
          status = 'success',
          mpesa_receipt = ?,
          result_code = ?,
          result_desc = ?,
          raw_callback = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
      `).run(receipt, resultCode, resultDesc, JSON.stringify(body), checkoutId);

      // Activate subscription
      const pkg = db.prepare('SELECT * FROM packages WHERE code = ?').get(payment.package_code);
      if (pkg) {
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + 1);

        // If we have a user_id, create subscription. Otherwise create a pending client later.
        if (payment.user_id) {
          db.prepare(`
            INSERT INTO subscriptions (user_id, package_id, status, start_date, end_date, amount_paid, payment_ref)
            VALUES (?, ?, 'active', ?, ?, ?, ?)
          `).run(
            payment.user_id,
            pkg.id,
            start.toISOString().slice(0, 10),
            end.toISOString().slice(0, 10),
            amount,
            receipt
          );
        }
      }

      console.log(`✅ Payment success: ${receipt} - ${payment.package_code}`);
      // TODO: send email / WhatsApp / create client account automatically
    } else {
      // Failed or cancelled
      db.prepare(`
        UPDATE payments SET
          status = 'failed',
          result_code = ?,
          result_desc = ?,
          raw_callback = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
      `).run(resultCode, resultDesc, JSON.stringify(body), checkoutId);

      console.log(`❌ Payment failed: ${resultDesc}`);
    }
  } catch (err) {
    console.error('Callback processing error:', err);
  }
});

// Poll status (frontend can call this while waiting)
app.get('/api/payments/status/:checkoutRequestId', (req, res) => {
  const payment = db.prepare(
    'SELECT status, mpesa_receipt, result_desc, package_code, amount FROM payments WHERE checkout_request_id = ?'
  ).get(req.params.checkoutRequestId);

  if (!payment) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, payment });
});
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://YOUR-BACKEND-URL';   // ← change after deployment

async function payWithMpesa(packageCode, amount) {
  const phoneInput = document.getElementById(`phone-${packageCode}`);
  const statusEl = document.getElementById(`status-${packageCode}`);
  const phone = phoneInput?.value?.trim();

  if (!phone) {
    alert('Please enter your M-Pesa phone number');
    return;
  }

  statusEl.classList.remove('hidden');
  statusEl.textContent = 'Sending payment prompt to your phone...';
  statusEl.className = 'text-xs text-cyan-400 mt-3 text-center';

  try {
    const res = await fetch(`${API_BASE}/api/payments/mpesa/stk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, packageCode })
    });

    const data = await res.json();

    if (!data.success) {
      statusEl.textContent = data.message || 'Failed to start payment';
      statusEl.className = 'text-xs text-red-400 mt-3 text-center';
      return;
    }

    statusEl.textContent = 'Check your phone and enter M-Pesa PIN...';
    
    // Poll for result
    const checkoutId = data.checkoutRequestId;
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > 40) { // ~2 minutes
        clearInterval(poll);
        statusEl.textContent = 'Timed out. If you paid, contact us with the M-Pesa message.';
        return;
      }

      const statusRes = await fetch(`${API_BASE}/api/payments/status/${checkoutId}`);
      const statusData = await statusRes.json();

      if (statusData.payment?.status === 'success') {
        clearInterval(poll);
        statusEl.textContent = `Payment successful! Receipt: ${statusData.payment.mpesa_receipt}`;
        statusEl.className = 'text-xs text-green-400 mt-3 text-center';
        // Optional: redirect to portal or success page
        // window.location.href = 'portal.html?paid=1';
      } else if (statusData.payment?.status === 'failed') {
        clearInterval(poll);
        statusEl.textContent = statusData.payment.result_desc || 'Payment failed or cancelled';
        statusEl.className = 'text-xs text-red-400 mt-3 text-center';
      }
    }, 3000);

  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Network error. Please try again.';
    statusEl.className = 'text-xs text-red-400 mt-3 text-center';
  }
}