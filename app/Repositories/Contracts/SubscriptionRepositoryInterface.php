<?php

namespace App\Repositories\Contracts;

use App\Models\ClientApiKey;
use Illuminate\Database\Eloquent\Collection;

interface SubscriptionRepositoryInterface
{
    public function findByKey(string $apiKey): ?ClientApiKey;

    public function getClientSubscriptions(int $clientId): Collection;

    public function createSubscription(int $clientId, int $serviceId, array $data): ClientApiKey;

    public function getSubscription(int $clientId, int $serviceId): ?ClientApiKey;
}
