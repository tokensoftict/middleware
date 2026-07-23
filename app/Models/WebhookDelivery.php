<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    protected $table = 'webhook_deliveries';

    protected $fillable = [
        'webhook_event_id',
        'client_api_key_id',
        'client_webhook_url',
        'delivery_payload',
        'response_status',
        'response_body',
        'attempts',
        'next_retry_at',
        'delivered_at',
        'status',
    ];

    protected $casts = [
        'delivery_payload' => 'array',
        'response_body'    => 'array',
        'next_retry_at'    => 'datetime',
        'delivered_at'     => 'datetime',
        'attempts'         => 'integer',
        'response_status'  => 'integer',
    ];

    /**
     * The webhook event this delivery belongs to.
     */
    public function webhookEvent(): BelongsTo
    {
        return $this->belongsTo(WebhookEvent::class);
    }

    /**
     * The client API key/subscription this delivery targets.
     */
    public function clientApiKey(): BelongsTo
    {
        return $this->belongsTo(ClientApiKey::class);
    }
}
