<?php

namespace App\Repositories\Eloquent;

use App\Models\WebhookDelivery;
use App\Repositories\Contracts\WebhookDeliveryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class WebhookDeliveryRepository implements WebhookDeliveryRepositoryInterface
{
    public function store(array $data): WebhookDelivery
    {
        return WebhookDelivery::create($data);
    }

    public function updateDelivery(int $id, array $data): void
    {
        WebhookDelivery::where('id', $id)->update($data);
    }

    /**
     * Find all pending or failed deliveries whose next_retry_at is now or past.
     */
    public function findDueForRetry(): Collection
    {
        return WebhookDelivery::whereIn('status', ['pending', 'failed'])
            ->where('next_retry_at', '<=', now())
            ->with(['webhookEvent.service', 'clientApiKey.client'])
            ->get();
    }
}
