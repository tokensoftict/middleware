<?php

namespace App\Services\Webhook;

use App\Adapters\Registry\ServiceAdapterRegistry;
use App\DTOs\WebhookEventDTO;
use App\Jobs\ProcessWebhookDeliveryJob;
use App\Models\WebhookEvent;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\WebhookDeliveryRepositoryInterface;
use App\Repositories\Contracts\WebhookEventRepositoryInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function __construct(
        protected ServiceAdapterRegistry $adapterRegistry,
        protected ServiceRepositoryInterface $serviceRepo,
        protected WebhookEventRepositoryInterface $eventRepo,
        protected WebhookDeliveryRepositoryInterface $deliveryRepo,
    ) {}

    /**
     * @throws Exception
     */
    public function receive(Request $request, string $serviceSlug, string $service_uuid, ?string $eventType = null): void
    {
        // 1. Resolve the service
        $service = $this->serviceRepo->findByUuid($service_uuid);

        if (! $service) {
            throw new Exception("Service [{$serviceSlug}] not found", 404);
        }

        if (! $service->is_active) {
            throw new Exception("Service [{$serviceSlug}] is inactive", 503);
        }

        if ($service->slug !== $serviceSlug) {
            throw new Exception('Service slug miss-matched', 503);
        }

        $adapter = $this->adapterRegistry->resolve($service);

        if (! $adapter->verifyWebhookSignature($request)) {
            throw new Exception('Webhook signature verification failed', 400);
        }

        $dto = WebhookEventDTO::fromRequest($request, $serviceSlug, $eventType);

        $supported = $adapter::getSupportedWebhookEvents();
        $isIgnored = ! empty($supported) && ! in_array($dto->eventType, $supported, true);

        $apiLog = $adapter->getOriginalClientApiGateWayLog($dto->payload);
        if ($isIgnored and is_null($apiLog)) {
            $isIgnored = false;
        }

        $webhookEvent = $this->eventRepo->store([
            'service_id' => $service->id,
            'event_type' => $dto->eventType,
            'inbound_url_path' => $dto->inboundUrlPath,
            'source_ip' => $dto->sourceIp,
            'raw_headers' => $dto->headers,
            'raw_payload' => $dto->payload,
            'status' => $isIgnored ? 'ignored' : 'received',
            'client_api_key_id' => $apiLog->client_api_key_id ?? null,
        ]);

        if (! $apiLog) {
            Log::info('Webhook event ignored (unable to get original apiLog)', [
                'webhook_id' => $webhookEvent->id,
                'service' => $serviceSlug,
                'event_type' => $dto->eventType,
            ]);

            return;
        }

        if ($isIgnored) {
            Log::info('Webhook event ignored (unsupported type)', [
                'webhook_id' => $webhookEvent->id,
                'service' => $serviceSlug,
                'event_type' => $dto->eventType,
            ]);

            return;
        }

        try {
            $processingResult = $adapter->handleWebhook($dto);
            $this->eventRepo->updateStatus($webhookEvent->id, 'processed', $processingResult);
        } catch (\Throwable $e) {
            $this->eventRepo->updateStatus($webhookEvent->id, 'failed', [
                'error' => $e->getMessage(),
            ]);

            Log::error('Webhook adapter handleWebhook() failed', [
                'service' => $serviceSlug,
                'event_type' => $dto->eventType,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        // coming back to this let see how to handle webhook for each client subscription
        $this->fanOutToClients($adapter, $dto, $webhookEvent);
    }

    protected function fanOutToClients($adapter, WebhookEventDTO $dto, WebhookEvent $webhookEvent): void
    {
        // Load all active subscriptions for this service that have a webhook URL
        $subscription = $webhookEvent->clientApiKey()->first();
        $eventMapper = $adapter->mapWebhookEventToAdapterCredentials();

        if(!isset($subscription->credentials['subscription'][$eventMapper[$webhookEvent->event_type]])) {
            Log::info('Webhook event trigger error, no webhook url', [
                'webhook_id' => $webhookEvent->id,
                'event_type' => $dto->eventType,
            ]);
            return ;
        }

        $webhookURL = $subscription->credentials['subscription'][$eventMapper[$webhookEvent->event_type]];
        $clientPayload = $adapter->transformWebhookForClient($dto);

        if(empty($webhookURL)) {
            Log::info('Webhook event trigger error, no webhook url', [
                'webhook_id' => $webhookEvent->id,
                'event_type' => $dto->eventType,
            ]);
        }

        // Persist delivery record (pending)
        $delivery = $this->deliveryRepo->store([
            'webhook_event_id' => $webhookEvent->id,
            'client_api_key_id' => $subscription->id,
            'client_webhook_url' => $webhookURL,
            'delivery_payload' => ['headers' => $dto->headers, 'payload' => $clientPayload],
            'status' => 'pending',
            'attempts' => $subscription->credentials['subscription']['webhook_retries_per_day'],
        ]);

        // Dispatch queued job for HTTP delivery
        ProcessWebhookDeliveryJob::dispatch(
            $delivery,
            $clientPayload,
            $delivery->client_webhook_url,
        );
    }
}
