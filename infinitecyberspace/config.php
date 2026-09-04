<?php
// config.php

define('PESAPAL_CONSUMER_KEY',    'W4rjzKMcEps1swJ4ZEmrwQOnXkgauQr7');      // ← put your real key
define('PESAPAL_CONSUMER_SECRET', '5a/g0/IMJsOgI1PRre+uf7tf4TE=');  // ← put your real secret

// false = live payments, true = sandbox/testing
define('PESAPAL_SANDBOX', false);

define('PESAPAL_BASE_URL', PESAPAL_SANDBOX
    ? 'https://cybqa.pesapal.com/pesapalv3'
    : 'https://pay.pesapal.com/v3'
);

// Your live InfinityFree website
define('FRONTEND_URL', 'https://infinitecyberspace.great-site.net');

// Leave empty the first time. After first successful IPN registration, paste the ID here
define('PESAPAL_IPN_ID', '');

// Same as your website URL
define('API_BASE_URL', 'https://infinitecyberspace.great-site.net');