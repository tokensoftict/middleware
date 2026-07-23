<?php

namespace App\Repositories\Contracts;

use App\Models\WebhookDelivery;
use Illuminate\Database\Eloquent\Collection;

interface WebhookDeliveryRepositoryInterface
{
    public function store(array $data): WebhookDelivery;

    public function updateDelivery(int $id, array $data): void;

    /**
     * Find deliveries that are still pending/failed and due for retry.
     */
    public function findDueForRetry(): Collection;
}
