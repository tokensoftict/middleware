<?php

declare(strict_types=1);

namespace App\Adapters\Mock;

use App\Adapters\BaseServiceAdapter;
use App\DTOs\NormalizedResponseDTO;
use App\DTOs\ProxyRequestDTO;
use App\DTOs\WebhookEventDTO;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CorvynAdapter extends BaseServiceAdapter
{
    private const TIMESTAMP_TOLERANCE_SECONDS = 300;

    private const HEADER_TENANT_CODE = 'x-tenant-code';

    private const HEADER_TIMESTAMP = 'x-corvyn-timestamp';

    private const HEADER_SIGNATURE = 'x-webhook-signature';

    public static string $slug = 'corvyn-ai';

    public static function getName(): string
    {
        return 'Corvyn AI Sentinel Service';
    }

    public static function credentialsLevel(): string
    {
        return 'mixed';
    }

    /**
     * @return string[]
     */
    public static function getCredentialSchema(): array
    {
        return [
            'tenant_code' => 'Corvyn Tenant Code (x-tenant-code header)',
            'secret' => 'Corvyn Signing Secret (HMAC-SHA256)',
        ];
    }

    /**
     * @return string[]
     */
    public static function getSubscriptionCredentialSchema(): array
    {
        return [
            'webhook_success_url' => 'Webhook Success URL (where success events will be delivered)',
            'webhook_failure_url' => 'Webhook Failure URL (where failed events will be delivered)',
            'webhook_retries_per_day' => 'Max delivery retries per day',
            'webhook_retry_days' => 'Number of days to retry failed deliveries',
        ];
    }

    /**
     * @return string[]
     */
    public static function getSubscriptionValidationRules(): array
    {
        return [
            'webhook_success_url' => 'nullable|url|max:255',
            'webhook_failure_url' => 'nullable|url|max:255',
            'webhook_retries_per_day' => 'nullable|integer|min:0',
            'webhook_retry_days' => 'nullable|integer|min:0',
        ];
    }

    public function send(ProxyRequestDTO $request): NormalizedResponseDTO
    {
        $this->currentRequest = $request;
        $this->resolvedPayload = $this->resolvePayload($request->payload);

        $baseUrl = $this->getBaseUrl();
        $url = rtrim($baseUrl, '/') . '/' . ltrim($request->path, '/');

        $queryParams = $this->resolveQueryParams($request->queryParams);
        if (!empty($queryParams)) {
            $connector = str_contains($url, '?') ? '&' : '?';
            $url .= $connector . http_build_query($queryParams);
        }

        $rawBody = in_array(strtoupper($request->method), ['GET', 'DELETE'], true)
            ? ''
            : json_encode($this->resolvedPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // =========================================================
        // DEBUG STEP 1 — Verify the signed body equals the sent body
        // =========================================================
        $reEncoded = json_encode(
            json_decode((string) $rawBody, true),
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        Log::channel('single')->debug('[CorvynDebug][Step1] Body Integrity', [
            'rawBody' => $rawBody,
            'rawBodyLength' => strlen((string) $rawBody),
            'rawBodySHA256' => hash('sha256', (string) $rawBody),
            'reEncodedHash' => hash('sha256', (string) $reEncoded),
            'bodiesAreEqual' => ($rawBody === $reEncoded),
            'jsonEncodeFlags' => JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
            'resolvedPayload' => $this->resolvedPayload,
        ]);
        unset($reEncoded);
        // =========================================================

        $this->outgoingHeaders = $this->generateHeaders($rawBody);

        $client = Http::withHeaders($this->outgoingHeaders)
            ->withoutVerifying()
            ->timeout($this->service->timeout ?? 30);

        if (($this->service->max_retries ?? 0) > 0) {
            $client = $client->retry($this->service->max_retries, 100);
        }

        try {
            $method = strtoupper($request->method);

            // =========================================================
            // DEBUG STEP 8 — Full outgoing request dump before dispatch
            // =========================================================
            $_dbgSecret = trim($this->getCredentials()['secret'] ?? '');
            $_dbgTs = (int) ($this->outgoingHeaders['x-corvyn-timestamp'] ?? 0);
            $_dbgBody = (string) $rawBody;
            $_expectedSig = 'sha256=' . hash_hmac(
                'sha256',
                trim((string) $_dbgTs) . '.' . trim($_dbgBody === '' ? '[]' : $_dbgBody),
                $_dbgSecret
            );
            Log::channel('single')->debug('[CorvynDebug][Step8] Outgoing Request', [
                'url' => $url,
                'method' => $method,
                'rawBody' => $_dbgBody,
                'rawBodyLength' => strlen($_dbgBody),
                'rawBodySHA256' => hash('sha256', $_dbgBody),
                'signatureInHeader' => $this->outgoingHeaders['x-webhook-signature'] ?? 'MISSING',
                'expectedSignature' => $_expectedSig,
                'signaturesMatch' => (
                    ($this->outgoingHeaders['x-webhook-signature'] ?? '') === $_expectedSig
                ),
                'timestampInHeader' => $this->outgoingHeaders['x-corvyn-timestamp'] ?? 'MISSING',
                'tenantInHeader' => $this->outgoingHeaders['x-tenant-code'] ?? 'MISSING',
                'allHeaders' => $this->outgoingHeaders,
            ]);
            unset($_dbgSecret, $_dbgTs, $_dbgBody, $_expectedSig);
            // =========================================================

            // =========================================================
            // DEBUG STEP 9 — Proxy environment check
            // Checks if cPanel has a system-level outgoing proxy that could
            // modify the request body or headers before reaching Corvyn.
            // =========================================================
            Log::channel('single')->debug('[CorvynDebug][Step9] Proxy Environment', [
                'env_http_proxy' => getenv('http_proxy') ?: 'NOT_SET',
                'env_https_proxy' => getenv('https_proxy') ?: 'NOT_SET',
                'env_HTTPS_PROXY' => getenv('HTTPS_PROXY') ?: 'NOT_SET',
                'env_ALL_PROXY' => getenv('ALL_PROXY') ?: 'NOT_SET',
                'curl_version' => curl_version()['version'] ?? 'unknown',
                'curl_ssl_version' => curl_version()['ssl_version'] ?? 'unknown',
                'curl_host' => curl_version()['host'] ?? 'unknown',
                'php_ini_file' => php_ini_loaded_file(),
                'server_addr' => $_SERVER['SERVER_ADDR'] ?? 'CLI',
                'curlopt_proxy_in_ini' => ini_get('curl.cainfo'),
            ]);
            // =========================================================

            // =========================================================
            // DEBUG STEP 10 — Mirror to webhook.site (REMOVE AFTER USE)
            // Replace YOUR_WEBHOOK_SITE_ID with your actual webhook.site token.
            // This sends an IDENTICAL request to webhook.site so you can
            // see exactly what headers and body are transmitted by production.
            // Compare what webhook.site shows against our Step 8 log.
            // =========================================================
            $_webhookSiteUrl = 'https://webhook.site/699edc8c-bf0e-4d77-a360-7cfcd9aee966';
            try {
                $_mirrorResponse = Http::withHeaders($this->outgoingHeaders)
                    ->withoutVerifying()
                    ->timeout(10)
                    ->withBody($rawBody, 'application/json')
                    ->post($_webhookSiteUrl);
                Log::channel('single')->debug('[CorvynDebug][Step10] webhook.site Mirror', [
                    'mirror_url' => $_webhookSiteUrl,
                    'mirror_status' => $_mirrorResponse->status(),
                    'mirror_sent_body_hash' => hash('sha256', $rawBody),
                    'note' => 'Now check webhook.site to see the exact headers/body received',
                ]);
            } catch (\Throwable $_mirrorEx) {
                Log::channel('single')->warning('[CorvynDebug][Step10] Mirror failed', [
                    'error' => $_mirrorEx->getMessage(),
                ]);
            }
            unset($_webhookSiteUrl, $_mirrorResponse, $_mirrorEx);
            // =========================================================

            $response = match ($method) {
                'GET' => $client->get($url),
                'DELETE' => $client->delete($url),
                'POST', 'PUT', 'PATCH' => $client
                        ->withBody($rawBody, 'application/json')
                ->{strtolower($method)}($url),
                default => throw new Exception("Unsupported HTTP method: {$method}"),
            };

            return $this->normalizeResponse($response);
        } catch (RequestException $e) {
            return $this->handleException($e);
        } catch (Exception $e) {
            return new NormalizedResponseDTO(
                statusCode: 500,
                content: ['message' => 'Gateway request failed.'],
                error: $e->getMessage()
            );
        }
    }

    protected function generateHeaders(string $rawBody): array
    {
        $credentials = $this->getCredentials();
        $tenantCode = trim($credentials['tenant_code'] ?? '');
        $secret = trim($credentials['secret'] ?? '');
        $timestamp = Carbon::now()->timestamp;

        // =========================================================
        // DEBUG STEP 5 — PHP / extension environment
        // =========================================================
        Log::channel('single')->debug('[CorvynDebug][Step5] Environment', [
            'phpVersion' => PHP_VERSION,
            'phpVersionId' => PHP_VERSION_ID,
            'laravelVersion' => app()->version(),
            'openSSLVersion' => OPENSSL_VERSION_TEXT,
            'sha256Available' => in_array('sha256', hash_algos()),
            'mbstringLoaded' => extension_loaded('mbstring'),
            'mbFuncOverload' => ini_get('mbstring.func_overload'), // MUST be "0" or ""
            'defaultCharset' => ini_get('default_charset'),
            'internalEncoding' => mb_internal_encoding(),
            'jsonLoaded' => extension_loaded('json'),
            'opensslLoaded' => extension_loaded('openssl'),
        ]);
        // =========================================================

        // =========================================================
        // DEBUG STEP 6 — Credential loading & decryption check
        // =========================================================
        $_rawCreds = null;
        try {
            $_rawCreds = $this->service->credentials;
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            Log::channel('single')->error('[CorvynDebug][Step6] DECRYPT FAILED — APP_KEY mismatch!', [
                'error' => $e->getMessage(),
                'appKeyHash' => hash('sha256', config('app.key')),
                'FATAL' => 'Credentials cannot be decrypted. Check APP_KEY matches the key used when credentials were stored.',
            ]);
        }
        Log::channel('single')->debug('[CorvynDebug][Step6] Credentials', [
            'mode' => $this->clientApiKey->environment ?? 'sandbox',
            'rawCredsType' => gettype($_rawCreds),
            'rawCredsIsNull' => is_null($_rawCreds),
            'rawCredsKeys' => is_array($_rawCreds) ? array_keys($_rawCreds) : 'NOT_ARRAY',
            'hasSecretKey' => is_array($_rawCreds) && array_key_exists('secret', $_rawCreds),
            'appKeyLength' => strlen(config('app.key')),
            'appKeyHash' => hash('sha256', config('app.key')),  // fingerprint — safe to log
            'configCacheFile' => file_exists(base_path('bootstrap/cache/config.php')) ? 'EXISTS (may be stale)' : 'none',
            'envFileExists' => file_exists(base_path('.env')),
        ]);
        unset($_rawCreds);
        // =========================================================

        // =========================================================
        // DEBUG STEP 2 — Secret fingerprint (never logs raw secret)
        // =========================================================
        $_rawSecret = $credentials['secret'] ?? null;
        $_trimmedSecret = trim($_rawSecret ?? '');
        Log::channel('single')->debug('[CorvynDebug][Step2] Secret', [
            'isNull' => is_null($_rawSecret),
            'rawLength' => is_string($_rawSecret) ? strlen($_rawSecret) : 'NOT_STRING',
            'trimmedLength' => strlen($_trimmedSecret),
            'secretSHA256' => hash('sha256', $_trimmedSecret),  // fingerprint — safe to log
            'hasTrailingSpace' => is_string($_rawSecret) && $_rawSecret !== $_trimmedSecret,
            'hasNewline' => is_string($_rawSecret) && str_contains($_rawSecret, "\n"),
            'hasCarriageReturn' => is_string($_rawSecret) && str_contains($_rawSecret, "\r"),
            'hasNullByte' => is_string($_rawSecret) && str_contains($_rawSecret, "\0"),
            'hexFirst10Bytes' => bin2hex(substr($_trimmedSecret, 0, 10)),
            'hexLast10Bytes' => bin2hex(substr($_trimmedSecret, -10)),
            'mbEncoding' => mb_detect_encoding($_trimmedSecret, null, true),
        ]);
        Log::channel('single')->debug('[CorvynDebug][Step2b] Tenant Code', [
            'tenantCode' => $tenantCode,  // not sensitive
            'tenantLength' => strlen($tenantCode),
        ]);
        unset($_rawSecret, $_trimmedSecret);
        // =========================================================

        // =========================================================
        // DEBUG STEP 3 — Timestamp & clock drift
        // =========================================================
        $_carbonNow = Carbon::now();
        Log::channel('single')->debug('[CorvynDebug][Step3] Timestamp & Clock', [
            'generatedTimestamp' => $timestamp,
            'phpTime' => time(),
            'carbonNow' => $_carbonNow->toIso8601String(),
            'carbonUtcNow' => Carbon::now('UTC')->toIso8601String(),
            'carbonTimezone' => $_carbonNow->timezoneName,
            'phpDefaultTimezone' => date_default_timezone_get(),
            'iniDateTimezone' => ini_get('date.timezone'),
            'laravelAppTimezone' => config('app.timezone'),
            'diffCarbonVsPhp' => abs($timestamp - time()),    // should be 0
            'driftFromNow' => abs(time() - $timestamp),    // must be < 300
            'withinTolerance' => abs(time() - $timestamp) <= self::TIMESTAMP_TOLERANCE_SECONDS,
        ]);
        unset($_carbonNow);
        // =========================================================

        return [
            'Content-Type' => 'application/json',
            self::HEADER_TENANT_CODE => $tenantCode,
            self::HEADER_TIMESTAMP => (string) $timestamp,
            self::HEADER_SIGNATURE => $this->generateSignature($timestamp, $rawBody, $secret),
        ];
    }

    protected function generateSignature(int $timestamp, string $rawBody, string $secret): string
    {
        // Trim all components to prevent whitespace-induced mismatches (e.g. cPanel stored credentials)
        $secret = trim($secret);
        $rawBody = trim($rawBody === '' ? '[]' : $rawBody);
        $sigPayload = trim((string) $timestamp) . '.' . $rawBody;

        $signature = 'sha256=' . hash_hmac('sha256', $sigPayload, $secret);

        // =========================================================
        // DEBUG STEP 1b + STEP 7 — Signature construction audit
        // =========================================================
        Log::channel('single')->debug('[CorvynDebug][Step1b+7] Signature Construction', [
            'timestamp' => $timestamp,
            'rawBodyAfterTrim' => $rawBody,
            'rawBodyLength' => strlen($rawBody),
            'rawBodySHA256' => hash('sha256', $rawBody),
            'sigPayload' => $sigPayload,
            'sigPayloadSHA256' => hash('sha256', $sigPayload),
            'secretLength' => strlen($secret),
            'secretSHA256' => hash('sha256', $secret),   // fingerprint — safe to log
            'generatedSig' => $signature,
            // Fixed test vector — must match on ALL environments:
            // timestamp=1753370000, body={"hello":"world"}, secret=my-secret
            'testVector' => 'sha256=' . hash_hmac(
                'sha256',
                '1753370000.' . '{"hello":"world"}',
                'my-secret'
            ),
        ]);
        // =========================================================

        return $signature;
    }

    protected function normalizeResponse(Response $response): NormalizedResponseDTO
    {
        $body = $response->json() ?? ['body' => $response->body()];

        return new NormalizedResponseDTO(
            statusCode: $response->status(),
            content: [
                'success' => $response->successful(),
                'provider' => self::getName(),
                'data' => $body,
            ],
        );
    }

    protected function resolveHeaders(array $incomingHeaders): array
    {
        return $incomingHeaders;
    }

    public static function getSupportedWebhookEvents(): array
    {
        return [
            'success',
            'failed',
        ];
    }

    public function verifyWebhookSignature(Request $request): bool
    {
        $credentials = $this->getCredentials();
        $secret = trim($credentials['secret'] ?? '');

        if (empty($secret)) {
            // No secret configured — skip verification (sandbox convenience)
            return true;
        }

        // 1. Validate timestamp
        $timestamp = (int) trim((string) $request->header(self::HEADER_TIMESTAMP, 0));

        if (!$this->isTimestampValid($timestamp)) {
            return false;
        }

        // 2. Read inbound signature (trim to strip any stray whitespace from header value)
        $inboundSignature = trim((string) $request->header(self::HEADER_SIGNATURE, ''));

        if (empty($inboundSignature)) {
            return false;
        }

        // 3. Recompute and compare
        $rawBody = $request->getContent();
        $expected = $this->generateSignature($timestamp, $rawBody, $secret);

        return hash_equals($expected, $inboundSignature);
    }

    public function handleWebhook(WebhookEventDTO $event): array
    {
        $payload = $event->payload;

        return [
            'status' => 'processed',
            'event_type' => $event->eventType,
            'transaction_id' => $payload['transaction_id'] ?? $payload['reference'] ?? null,
            'amount' => $payload['amount'] ?? null,
            'currency' => $payload['currency'] ?? null,
            'tenant_code' => $payload['tenant_code'] ?? null,
            'processed_at' => now()->toIso8601String(),
        ];
    }

    public function transformWebhookForClient(WebhookEventDTO $event): array
    {
        $payload = $event->payload;

        return [
            'event' => $event->eventType,
            'service' => self::getName(),
            'transaction_id' => $payload['transaction_id'] ?? $payload['reference'] ?? null,
            'amount' => $payload['amount'] ?? null,
            'currency' => $payload['currency'] ?? null,
            'status' => $payload['status'] ?? null,
            'metadata' => $payload['metadata'] ?? [],
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function isTimestampValid(int $timestamp): bool
    {
        if ($timestamp === 0) {
            return false;
        }

        return abs(time() - $timestamp) <= self::TIMESTAMP_TOLERANCE_SECONDS;
    }

    public function mapWebhookEventToAdapterCredentials(): array
    {
        return [
            'success' => 'webhook_success_url',
            'failed' => 'webhook_failed_url',
        ];
    }
}
