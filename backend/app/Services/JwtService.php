<?php

namespace App\Services;

class JwtService
{
    /**
     * Secret key for signing tokens
     */
    protected static function getSecret(): string
    {
        return config('app.jwt_secret') ?? env('JWT_SECRET', 'ultrablue_jwt_master_secret_key_2026_odisha');
    }

    /**
     * Base64Url encode helper
     */
    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64Url decode helper
     */
    public static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Generate standard RFC 7519 JWT Token
     *
     * @param array $payload
     * @param int $ttlSeconds (Default: 24 hours)
     * @return string
     */
    public static function generateToken(array $payload, int $ttlSeconds = 86400): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT'
        ];

        $now = time();
        $payload['iat'] = $payload['iat'] ?? $now;
        $payload['exp'] = $payload['exp'] ?? ($now + $ttlSeconds);

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", self::getSecret(), true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return "{$headerEncoded}.{$payloadEncoded}.{$signatureEncoded}";
    }

    /**
     * Validate and decode token
     *
     * @param string $token
     * @return array|null Returns payload array or null if invalid/expired
     */
    public static function validateToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        // Verify signature
        $expectedSignature = hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", self::getSecret(), true);
        $expectedSignatureEncoded = self::base64UrlEncode($expectedSignature);

        if (!hash_equals($expectedSignatureEncoded, $signatureEncoded)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!$payload || !isset($payload['exp'])) {
            return null;
        }

        // Check expiration
        if ($payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Decode payload without verifying signature (for inspection)
     */
    public static function decodeToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        return json_decode(self::base64UrlDecode($parts[1]), true);
    }
}
