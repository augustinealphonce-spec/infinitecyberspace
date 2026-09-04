<?php
// ipn.php

header('Content-Type: application/json');

require_once __DIR__ . '/Pesapal.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || empty($input)) {
        $input = $_REQUEST;
    }

    $orderTrackingId      = $input['OrderTrackingId'] ?? $input['orderTrackingId'] ?? null;
    $orderMerchantReference = $input['OrderMerchantReference'] ?? $input['orderMerchantReference'] ?? null;

    if (!$orderTrackingId) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing OrderTrackingId']);
        exit;
    }

    $statusData = Pesapal::getTransactionStatus($orderTrackingId);

    // status_code: 0=INVALID, 1=COMPLETED, 2=FAILED, 3=REVERSED
    error_log(sprintf(
        'IPN: tracking=%s ref=%s status=%s amount=%s',
        $orderTrackingId,
        $orderMerchantReference,
        $statusData['payment_status_description'] ?? 'unknown',
        $statusData['amount'] ?? ''
    ));

    // TODO: mark order paid in your database when status_code == 1

    // Exact response Pesapal expects
    echo json_encode([
        'orderNotificationType'   => 'IPNCHANGE',
        'orderTrackingId'         => $orderTrackingId,
        'orderMerchantReference'  => $orderMerchantReference,
        'status'                  => 200,
    ]);
} catch (Throwable $e) {
    error_log('IPN error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
