<?php

namespace App\Repositories\Contracts;

use App\Models\WebhookEvent;

interface WebhookEventRepositoryInterface
{
    public function store(array $data): WebhookEvent;

    public function updateStatus(int $id, string $status, ?array $webhookResponse = null): void;
}
