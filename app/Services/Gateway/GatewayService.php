<?php

namespace App\Services\Gateway;

use App\Adapters\Registry\ServiceAdapterRegistry;
use App\DTOs\NormalizedResponseDTO;
use App\DTOs\ProxyRequestDTO;
use App\Models\ClientApiKey;
use App\Repositories\Contracts\GatewayLogRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Exception;

class GatewayService
{
    public function __construct(
        protected ServiceAdapterRegistry $adapterRegistry,
        protected ServiceRepositoryInterface $serviceRepo,
        protected GatewayLogRepositoryInterface $logRepo
    ) {}

    /**
     * Proxy request to external service.
     */
    public function proxy(ClientApiKey $apiKey, string $serviceSlug, ProxyRequestDTO $requestDto): NormalizedResponseDTO
    {
        $service = $this->serviceRepo->findBySlug($serviceSlug);
        if (! $service) {
            throw new Exception("Service [{$serviceSlug}] not found", 404);
        }

        if (! $service->is_active) {
            throw new Exception("Service [{$serviceSlug}] is inactive", 503);
        }

        // Validate client is subscribed to this service
        if ((int) $apiKey->service_id !== (int) $service->id) {
            throw new Exception('Unauthorized. API key is not valid for this service.', 403);
        }

        // Resolve adapter
        $adapter = $this->adapterRegistry->resolve($service);
        $adapter->setSubscription($apiKey);

        // Send and record performance
        $startTime = microtime(true);
        $responseDto = $adapter->send($requestDto);
        $endTime = microtime(true);

        $executionTimeMs = (int) (($endTime - $startTime) * 1000);

        // Log the request and response
        $this->logRepo->log([
            'client_id' => $apiKey->client_id,
            'service_id' => $service->id,
            'endpoint_called' => $requestDto->path,
            'request_method' => $requestDto->method,
            'request_payload' => $requestDto->payload,
            'request_headers' => $requestDto->headers,
            'service_headers' => $adapter->getOutgoingHeaders(),
            'response_payload' => is_array($responseDto->content) ? $responseDto->content : ['body' => $responseDto->content],
            'http_status_code' => $responseDto->statusCode,
            'execution_time_ms' => $executionTimeMs,
        ]);

        return $responseDto;
    }
}
