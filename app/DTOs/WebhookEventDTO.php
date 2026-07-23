<?php

namespace App\DTOs;

use Illuminate\Http\Request;

class WebhookEventDTO
{
    public function __construct(
        public readonly string $serviceSlug,
        public readonly string $eventType,
        public readonly array  $headers,
        public readonly array  $payload,
        public readonly string $sourceIp,
        public readonly string $inboundUrlPath,
    ) {}

    public static function fromRequest(
        Request $request,
        string $serviceSlug,
        ?string $eventTypeFromPath = null,
        string $payloadEventKey = 'event',
    ): self {
        $payload = $request->all();

        $eventType = $eventTypeFromPath
            ?? $payload[$payloadEventKey]
            ?? $payload['event_type']
            ?? $payload['type']
            ?? 'unknown';

        return new self(
            serviceSlug:    $serviceSlug,
            eventType:      (string) $eventType,
            headers:        collect($request->headers->all())->map(fn ($v) => $v[0] ?? '')->toArray(),
            payload:        $payload,
            sourceIp:       $request->ip() ?? '',
            inboundUrlPath: $request->path(),
        );
    }
}
