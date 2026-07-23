<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = [
        'name',
        'contact_name',
        'contact_email',
        'phone',
        'description',
        'logo',
        'status',
        'rate_limit',
        'has_webhook',
        'webhook_retries_per_day',
        'webhook_retry_days',
    ];

    protected $casts = [
        'has_webhook'              => 'bool',
        'webhook_retries_per_day'  => 'integer',
        'webhook_retry_days'       => 'integer',
    ];

    /**
     * Whether this client has webhook forwarding enabled.
     */
    public function hasWebhook(): bool
    {
        return (bool) $this->has_webhook;
    }

    /**
     * Get the API keys associated with the client.
     */
    public function client_api_keys(): HasMany
    {
        return $this->hasMany(ClientApiKey::class);
    }

    /**
     * Get the gateway logs associated with the client.
     */
    public function gatewayLogs(): HasMany
    {
        return $this->hasMany(ApiGatewayLog::class);
    }

    protected static function booted(): void
    {
        static::deleting(function (Client $client) {
            $client->gatewayLogs()->delete();
        });
    }
}
