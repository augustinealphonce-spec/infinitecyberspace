<?php
// Pesapal.php

require_once __DIR__ . '/config.php';

class Pesapal
{
    private static $token = null;
    private static $tokenExpiry = 0;

    public static function getToken(): string
    {
        if (self::$token && time() < self::$tokenExpiry - 30) {
            return self::$token;
        }

        $response = self::request('POST', '/api/Auth/RequestToken', [
            'consumer_key'    => PESAPAL_CONSUMER_KEY,
            'consumer_secret' => PESAPAL_CONSUMER_SECRET,
        ], false);

        if (empty($response['token'])) {
            throw new Exception($response['message'] ?? 'Failed to get Pesapal token');
        }

        self::$token = $response['token'];
        self::$tokenExpiry = time() + 4 * 60; // ~4 minutes
        return self::$token;
    }

    public static function registerIpnIfNeeded(): string
    {
        if (PESAPAL_IPN_ID !== '') {
            return PESAPAL_IPN_ID;
        }

        $token = self::getToken();
        $ipnUrl = rtrim(API_BASE_URL, '/') . '/ipn.php';

        $response = self::request('POST', '/api/URLSetup/RegisterIPN', [
            'url'                   => $ipnUrl,
            'ipn_notification_type' => 'POST',
        ], true, $token);

        if (!empty($response['ipn_id'])) {
            // Log this and add to env as PESAPAL_IPN_ID
            error_log('Registered Pesapal IPN ID: ' . $response['ipn_id']);
            return $response['ipn_id'];
        }

        // Try existing list
        $list = self::request('GET', '/api/URLSetup/GetIpnList', null, true, $token);
        if (is_array($list) && !empty($list[0]['ipn_id'])) {
            return $list[0]['ipn_id'];
        }

        throw new Exception('Could not register or find IPN ID: ' . json_encode($response));
    }

    public static function submitOrder(array $payload): array
    {
        $token = self::getToken();
        return self::request('POST', '/api/Transactions/SubmitOrderRequest', $payload, true, $token);
    }

    public static function getTransactionStatus(string $orderTrackingId): array
    {
        $token = self::getToken();
        $path = '/api/Transactions/GetTransactionStatus?orderTrackingId=' . urlencode($orderTrackingId);
        return self::request('GET', $path, null, true, $token);
    }

    private static function request(
        string $method,
        string $path,
        ?array $body = null,
        bool $auth = false,
        ?string $token = null
    ): array {
        $url = rtrim(PESAPAL_BASE_URL, '/') . $path;

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json',
        ];
        if ($auth && $token) {
            $headers[] = 'Authorization: Bearer ' . $token;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
        ]);

        if ($body !== null && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $raw = curl_exec($ch);
        $err = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            throw new Exception('cURL error: ' . $err);
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new Exception('Invalid JSON from Pesapal (HTTP ' . $code . '): ' . $raw);
        }

        return $data;
    }
}
