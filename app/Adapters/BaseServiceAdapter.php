<?php

namespace App\Adapters;

use App\Adapters\Contracts\ServiceAdapterInterface;
use App\DTOs\NormalizedResponseDTO;
use App\DTOs\ProxyRequestDTO;
use App\DTOs\WebhookEventDTO;
use App\Models\ClientApiKey;
use App\Models\Service;
use Exception;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

abstract class BaseServiceAdapter implements ServiceAdapterInterface
{
    protected Service $service;

    protected ClientApiKey $clientApiKey;

    protected ?ProxyRequestDTO $currentRequest = null;

    protected array $resolvedPayload = [];

    protected array $outgoingHeaders = [];

    public static string $slug;

    public function setService(Service $service): self
    {
        $this->service = $service;

        return $this;
    }

    final public function setSubscription(ClientApiKey $apiKey): self
    {
        $this->clientApiKey = $apiKey;

        return $this;
    }

    protected function getBaseUrl(): string
    {
        $mode = $this->clientApiKey->environment ?? 'sandbox';

        return ($mode === 'production') ? $this->service->production_base_url : $this->service->sandbox_base_url;
    }

    public function send(ProxyRequestDTO $request): NormalizedResponseDTO
    {
        $this->currentRequest = $request;
        $this->resolvedPayload = $this->resolvePayload($request->payload);
        $baseUrl = $this->getBaseUrl();
        $url = rtrim($baseUrl, '/').'/'.ltrim($request->path, '/');

        // Apply service-specific authentication/headers
        $this->outgoingHeaders = $this->resolveHeaders($request->headers);
        $headers = $this->outgoingHeaders;

        // Append query parameters
        $queryParams = $this->resolveQueryParams($request->queryParams);
        if (! empty($queryParams)) {
            $connector = str_contains($url, '?') ? '&' : '?';
            $url .= $connector.http_build_query($queryParams);
        }

        $client = Http::withHeaders($headers)
            ->withoutVerifying()
            ->timeout($this->service->timeout ?? 30);

        if (($this->service->max_retries ?? 0) > 0) {
            $client = $client->retry($this->service->max_retries, 100);
        }

        try {
            $method = strtoupper($request->method);
            $response = match ($method) {
                'GET' => $client->get($url),
                'POST' => $client->post($url, $this->resolvedPayload),
                'PUT' => $client->put($url, $this->resolvedPayload),
                'PATCH' => $client->patch($url, $this->resolvedPayload),
                'DELETE' => $client->delete($url, $this->resolvedPayload),
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

    public function getOutgoingHeaders(): array
    {
        return $this->outgoingHeaders;
    }

    public static function credentialsLevel(): string
    {
        return 'service';
    }

    protected function getCredentials(): array
    {
        $mode = $this->clientApiKey->environment ?? 'sandbox';

        if (static::credentialsLevel() === 'subscription') {
            $creds = $this->clientApiKey->credentials ?? [];

            return $creds[$mode] ?? ($creds['sandbox'] ?? $creds);
        }

        // 'service' and 'mixed' both read from service.credentials
        return $this->service->credentials[$mode] ?? ($this->service->credentials['sandbox'] ?? $this->service->credentials);
    }

    protected function getSubscriptionCredentials(): array
    {
        $mode = $this->clientApiKey->environment ?? 'sandbox';

        // Pull encrypted per-subscription credentials
        $creds = $this->clientApiKey->credentials ?? [];
        $envCreds = $creds[$mode] ?? ($creds['sandbox'] ?? $creds);

        // Merge first-class column values so the caller has one flat array
        return array_merge(
            is_array($envCreds) ? $envCreds : [],
            array_filter([
                'webhook_url' => $this->clientApiKey->webhook_url ?? null,
            ])
        );
    }

    public static function getSubscriptionCredentialSchema(): array
    {
        return [];
    }

    public static function getSubscriptionValidationRules(): array
    {
        return array_map(
            static fn () => 'nullable|string',
            static::getSubscriptionCredentialSchema()
        );
    }

    abstract protected function resolveHeaders(array $incomingHeaders): array;

    protected function resolveQueryParams(array $incomingParams): array
    {
        return $incomingParams;
    }

    protected function resolvePayload(array $payload): array
    {
        return $payload;
    }

    abstract protected function normalizeResponse(Response $response): NormalizedResponseDTO;

    abstract public static function getName(): string;

    protected function handleException(RequestException $e): NormalizedResponseDTO
    {
        return new NormalizedResponseDTO(
            statusCode: $e->response?->status() ?? 500,
            content: $e->response?->json() ?? $e->response?->body() ?? ['message' => 'Service error'],
            error: $e->getMessage()
        );
    }

    public static function getSupportedWebhookEvents(): array
    {
        return [];
    }

    public function verifyWebhookSignature(Request $request): bool
    {
        return true;
    }

    public function handleWebhook(WebhookEventDTO $event): array
    {
        return [
            'status' => 'received',
            'event_type' => $event->eventType,
            'service' => $event->serviceSlug,
        ];
    }

    public function transformWebhookForClient(WebhookEventDTO $event): array
    {
        return [
            'event_type' => $event->eventType,
            'service' => $event->serviceSlug,
            'data' => $event->payload,
        ];
    }

    public static function getSupportedWebhookUrls(string $serviceUuid): array
    {
        $urls = [];
        foreach (static::getSupportedWebhookEvents() as $event) {
            $urls[$event] = route('webhook.handle.typed', ['serviceSlug' => static::$slug, 'service_uuid' => $serviceUuid, 'eventType' => $event]);
        }

        return $urls;
    }

    public function mapWebhookEventToAdapterCredentials(): array
    {
        return [];
    }
}
