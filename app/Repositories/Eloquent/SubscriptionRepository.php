<?php

namespace App\Repositories\Eloquent;

use App\Models\ClientApiKey;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SubscriptionRepository implements SubscriptionRepositoryInterface
{
    public function findByKey(string $apiKey): ?ClientApiKey
    {
        return ClientApiKey::where('api_key', $apiKey)
            ->with(['client', 'service'])
            ->first();
    }

    public function getClientSubscriptions(int $clientId): Collection
    {
        return ClientApiKey::where('client_id', $clientId)
            ->whereNotNull('service_id')
            ->with('service')
            ->get();
    }

    public function createSubscription(int $clientId, int $serviceId, array $data): ClientApiKey
    {
        return ClientApiKey::create(array_merge($data, [
            'client_id' => $clientId,
            'service_id' => $serviceId,
        ]));
    }

    public function getSubscription(int $clientId, int $serviceId): ?ClientApiKey
    {
        return ClientApiKey::where('client_id', $clientId)
            ->where('service_id', $serviceId)
            ->first();
    }
}
