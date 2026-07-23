<?php

namespace App\Services\Subscription;

use App\Models\Client;
use App\Models\ClientApiKey;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Exception;
use Ramsey\Uuid\Uuid;

class SubscriptionService
{
    public function __construct(
        protected SubscriptionRepositoryInterface $subscriptionRepo,
        protected ClientRepositoryInterface $clientRepo,
        protected ServiceRepositoryInterface $serviceRepo
    ) {}

    /**
     * Subscribe a client to a service.
     */
    public function subscribe(int $clientId, int $serviceId, array $data = []): array
    {
        $client = $this->clientRepo->find($clientId);
        if (! $client) {
            throw new Exception('Client not found');
        }

        $service = $this->serviceRepo->find($serviceId);
        if (! $service) {
            throw new Exception('Service not found');
        }

        // Check if subscription already exists
        $existing = $this->subscriptionRepo->getSubscription($clientId, $serviceId);
        if ($existing) {
            throw new Exception('Client is already subscribed to this service');
        }

        // Generate credentials using user-provided logic
        $appKey = strtoupper(Uuid::uuid4()->toString());
        $secretKey = strtoupper(Uuid::uuid4()->toString());

        $subscriptionData = [
            'service_id'  => $serviceId,
            'name'        => $data['name'] ?? "{$client->name} - {$service->name} Subscription Key",
            'api_key'     => $appKey,
            'api_secret'  => bcrypt($secretKey),
            'permissions' => $data['permissions'] ?? ['*'],
            'expires_at'  => now()->addYears(2),
            'rate_limit'  => $data['rate_limit'] ?? 60,
            'status'      => 'active',
            'environment' => $data['environment'] ?? 'sandbox',
            'credentials' => $data['credentials'] ?? null,
            // Mixed-level adapters: store the webhook delivery URL on its own column
            'webhook_url' => $data['webhook_url'] ?? null,
        ];

        // Save using relationship
        $apiKeys = new ClientApiKey($subscriptionData);
        $client->client_api_keys()->save($apiKeys);

        // Return the plain credentials once
        return [
            'api_key' => $appKey,
            'api_secret' => $secretKey,
            'expires_at' => $subscriptionData['expires_at'],
        ];
    }
}
