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
        $url = rtrim($baseUrl, '/').'/'.ltrim($request->path, '/');

        $queryParams = $this->resolveQueryParams($request->queryParams);
        if (! empty($queryParams)) {
            $connector = str_contains($url, '?') ? '&' : '?';
            $url .= $connector.http_build_query($queryParams);
        }

        $rawBody = in_array(strtoupper($request->method), ['GET', 'DELETE'], true)
            ? ''
            : json_encode($this->resolvedPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $this->outgoingHeaders = $this->generateHeaders($rawBody);

        $client = Http::withHeaders($this->outgoingHeaders)
            ->withoutVerifying()
            ->timeout($this->service->timeout ?? 30);

        if (($this->service->max_retries ?? 0) > 0) {
            $client = $client->retry($this->service->max_retries, 100);
        }

        try {
            $method = strtoupper($request->method);

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
        $tenantCode = $credentials['tenant_code'] ?? '';
        $secret = $credentials['secret'] ?? '';
        $timestamp = Carbon::now()->timestamp;

        return [
            'Content-Type' => 'application/json',
            self::HEADER_TENANT_CODE => $tenantCode,
            self::HEADER_TIMESTAMP => (string) $timestamp,
            self::HEADER_SIGNATURE => $this->generateSignature($timestamp, $rawBody, $secret),
        ];
    }

    protected function generateSignature(int $timestamp, string $rawBody, string $secret): string
    {
        dd($rawBody);
        $rawBody == '' ? '[]' : $rawBody;
        $sigPayload = $timestamp.'.'.$rawBody;

        return 'sha256='.hash_hmac('sha256', $sigPayload, $secret);
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
        $secret = $credentials['secret'] ?? '';

        if (empty($secret)) {
            // No secret configured — skip verification (sandbox convenience)
            return true;
        }

        // 1. Validate timestamp
        $timestamp = (int) $request->header(self::HEADER_TIMESTAMP, 0);

        if (! $this->isTimestampValid($timestamp)) {
            return false;
        }

        // 2. Read inbound signature
        $inboundSignature = $request->header(self::HEADER_SIGNATURE, '');

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
