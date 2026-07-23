<?php

namespace App\Adapters\Contracts;

use App\DTOs\NormalizedResponseDTO;
use App\DTOs\ProxyRequestDTO;
use App\DTOs\WebhookEventDTO;
use App\Models\Service;
use Illuminate\Http\Request;

interface ServiceAdapterInterface
{
    public static function getName(): string;
    public static function getCredentialSchema(): array;
    public static function getSubscriptionCredentialSchema(): array;

    public static function getSubscriptionValidationRules(): array;

    public function setSubscription(\App\Models\ClientApiKey $apiKey): self;

    public function setService(Service $service): self;

    public function send(ProxyRequestDTO $request): NormalizedResponseDTO;

    public static function getSupportedWebhookEvents(): array;

    public function verifyWebhookSignature(Request $request): bool;

    public function handleWebhook(WebhookEventDTO $event): array;

    public function transformWebhookForClient(WebhookEventDTO $event): array;
    public static function getSupportedWebhookUrls(string $serviceUuid): array;

    public  function mapWebhookEventToAdapterCredentials(): array;
}
