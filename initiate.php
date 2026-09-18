<?php
// initiate.php
// POST /initiate.php  (or route as /api/payments/pesapal/initiate)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed. Use POST.']);
    exit;
}

require_once __DIR__ . '/Pesapal.php';

try {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $amount      = isset($input['amount']) ? (float) $input['amount'] : 0;
    $currency    = $input['currency'] ?? 'KES';
    $description = $input['description'] ?? ($input['packageName'] ?? 'Infinite Cyberspace Package');
    $packageName = $input['packageName'] ?? '';

    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid amount']);
        exit;
    }

    $notificationId = Pesapal::registerIpnIfNeeded();
    $merchantReference = 'ICH-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 8);

    $orderPayload = [
        'id'               => $merchantReference,
        'currency'         => $currency,
        'amount'           => $amount,
        'description'      => mb_substr($description, 0, 100),
        'callback_url'     => FRONTEND_URL . '/packages.html?payment=success',
        'cancellation_url' => FRONTEND_URL . '/packages.html?payment=cancelled',
        'notification_id'  => $notificationId,
        'billing_address'  => [
            'email_address' => $input['email'] ?? 'customer@example.com',
            'phone_number'  => $input['phone'] ?? '',
            'country_code'  => 'KE',
            'first_name'    => $input['first_name'] ?? 'Customer',
            'last_name'     => $input['last_name'] ?? '',
        ],
    ];

    $orderData = Pesapal::submitOrder($orderPayload);

    if (empty($orderData['redirect_url'])) {
        http_response_code(500);
        echo json_encode([
            'message' => $orderData['message'] ?? 'Failed to create Pesapal order',
            'details' => $orderData,
        ]);
        exit;
    }

    echo json_encode([
        'success'             => true,
        'redirect_url'        => $orderData['redirect_url'],
        'order_tracking_id'   => $orderData['order_tracking_id'] ?? null,
        'merchant_reference'  => $orderData['merchant_reference'] ?? $merchantReference,
    ]);
} catch (Throwable $e) {
    error_log('Pesapal initiate error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
