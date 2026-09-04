<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

echo json_encode([
    'status'  => 'ok',
    'service' => 'Infinite Cyberspace Payments (PHP)',
    'env'     => PESAPAL_SANDBOX ? 'sandbox' : 'live',
]);
