<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebhookEvent extends Model
{
    protected $table = 'webhook_events';

    protected $fillable = [
        'service_id',
        'event_type',
        'inbound_url_path',
        'source_ip',
        'raw_headers',
        'raw_payload',
        'webhook_response',
        'status',
    ];

    protected $casts = [
        'raw_headers'      => 'array',
        'raw_payload'      => 'array',
        'webhook_response' => 'array',
    ];

    /**
     * The service that owns this webhook event.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * All delivery attempts made for this event.
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }
}
