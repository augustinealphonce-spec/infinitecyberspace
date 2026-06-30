const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const shortcode = "222111"; // Your Paybill
const passkey = "YOUR_MPESA_PASSKEY"; 
const consumerKey = "YOUR_CONSUMER_KEY";
const consumerSecret = "YOUR_CONSUMER_SECRET";
const accountNumber = "028000057218"; // Your bank account

// Get OAuth token
async function getToken() {
  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { auth: { username: consumerKey, password: consumerSecret } }
  );
  return res.data.access_token;
}

app.post("/stkpush", async (req, res) => {
  const { phone, amount } = req.body;
  const token = await getToken();

  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0,14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

  const response = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: "https://yourdomain.com/callback",
      AccountReference: accountNumber,
      TransactionDesc: "Package Payment"
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  res.json({ message: "Payment prompt sent to your phone" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
