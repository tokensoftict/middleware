<?php

namespace App\Jobs;

use App\Models\WebhookDelivery;
use App\Repositories\Contracts\WebhookDeliveryRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessWebhookDeliveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 60, 300];

    public function __construct(
        public readonly WebhookDelivery $delivery,
        public readonly array $payload,
        public readonly string $webhookUrl,
        public readonly int $timeoutSeconds = 15,
    ) {}


    public function handle(WebhookDeliveryRepositoryInterface $deliveryRepo): void
    {
        try {
            $response = Http::timeout($this->timeoutSeconds)
                ->retry(1, 500)
                ->withHeaders([
                    'Content-Type'     => 'application/json',
                    'X-Middleware-Event' => $this->payload['event'] ?? $this->payload['event_type'] ?? '',
                ])
                ->post($this->webhookUrl, $this->payload);

            $deliveryRepo->updateDelivery($this->delivery->id, [
                'response_status' => $response->status(),
                'response_body'   => is_array($response->json()) ? $response->json() : ['body' => $response->body()],
                'status'          => $response->successful() ? 'delivered' : 'failed',
                'delivered_at'    => $response->successful() ? now() : null,
                'attempts'        => $this->delivery->attempts + 1,
                'next_retry_at'   => $response->successful() ? null : $this->nextRetryAt(),
            ]);
        } catch (Throwable $e) {
            Log::error('Webhook delivery failed', [
                'delivery_id' => $this->delivery->id,
                'url'         => $this->webhookUrl,
                'error'       => $e->getMessage(),
            ]);

            $deliveryRepo->updateDelivery($this->delivery->id, [
                'status'        => 'failed',
                'attempts'      => $this->delivery->attempts + 1,
                'next_retry_at' => $this->nextRetryAt(),
            ]);

            throw $e;
        }
    }


    protected function nextRetryAt(): \Carbon\CarbonInterface
    {
        $attempt = $this->delivery->attempts;
        $delayMinutes = min(360, 5 * (2 ** max(0, $attempt - 1)));

        return now()->addMinutes($delayMinutes);
    }


    public function failed(Throwable $e): void
    {
        app(WebhookDeliveryRepositoryInterface::class)->updateDelivery($this->delivery->id, [
            'status' => 'failed',
        ]);

        Log::error('Webhook delivery permanently failed', [
            'delivery_id' => $this->delivery->id,
            'url'         => $this->webhookUrl,
            'error'       => $e->getMessage(),
        ]);
    }
}
