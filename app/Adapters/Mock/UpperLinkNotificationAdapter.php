<?php

namespace App\Adapters\Mock;

use App\Adapters\BaseServiceAdapter;
use App\DTOs\NormalizedResponseDTO;
use Illuminate\Http\Client\Response;

class UpperLinkNotificationAdapter extends BaseServiceAdapter
{

    public static string $slug = "notification-service";
    protected function resolveHeaders(array $incomingHeaders): array
    {
        $credentials = $this->getCredentials();

        return array_merge([], [
            'X-API-SECRET' => $credentials['X_API_SECRET'] ?? '',
            'Accept' => 'application/json',
        ]);
    }

    protected function resolveQueryParams(array $incomingParams): array
    {
        $credentials = $this->getCredentials();

        return [
            'API_KEY' => $credentials['API_KEY'] ?? '',
        ];
    }

    protected function normalizeResponse(Response $response): NormalizedResponseDTO
    {
        $body = $response->json();

        return new NormalizedResponseDTO(
            statusCode: $response->status(),
            content: [
                'success' => $response->successful(),
                'provider' => 'UpperLinkNotification',
                'data' => $body['data'],
            ],
            headers: $response->headers()
        );
    }

    public static function getName(): string
    {
        return 'UpperLink Email Notification';
    }

    public static function getCredentialSchema(): array
    {
        return [
            'API_KEY' => 'Api Key',
            'X_API_SECRET' => 'Api Secret',
        ];
    }
}
