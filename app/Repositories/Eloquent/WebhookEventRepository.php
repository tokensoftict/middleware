<?php

namespace App\Repositories\Eloquent;

use App\Models\WebhookEvent;
use App\Repositories\Contracts\WebhookEventRepositoryInterface;

class WebhookEventRepository implements WebhookEventRepositoryInterface
{
    public function store(array $data): WebhookEvent
    {
        return WebhookEvent::create($data);
    }

    public function updateStatus(int $id, string $status, ?array $webhookResponse = null): void
    {
        $update = ['status' => $status];

        if ($webhookResponse !== null) {
            $update['webhook_response'] = $webhookResponse;
        }

        WebhookEvent::where('id', $id)->update($update);
    }
}
