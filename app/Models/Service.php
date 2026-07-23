<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use App\Adapters\Registry\ServiceAdapterRegistry;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Service
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $uuid
 * @property string|null $description
 * @property string $sandbox_base_url
 * @property string $production_base_url
 * @property int $timeout
 * @property int $max_retries
 * @property bool $is_active
 * @property string|null $credentials
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Collection|ApiGatewayLog[] $api_gateway_logs
 * @property Collection|ClientApiKey[] $client_api_keys
 * @property Collection|ServiceEndpoint[] $service_endpoints
 */
class Service extends Model
{
    protected $table = 'services';

    protected $casts = [
        'timeout' => 'int',
        'max_retries' => 'int',
        'is_active' => 'bool',
        'credentials' => 'encrypted:array',
    ];

    protected $fillable = [
        'name',
        'uuid',
        'slug',
        'description',
        'sandbox_base_url',
        'production_base_url',
        'timeout',
        'max_retries',
        'is_active',
        'credentials',
    ];

    protected $appends = [
        'webhookUrls',
    ];

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($service) {
            $service->api_gateway_logs()->delete();
            $service->client_api_keys()->delete();
            $service->service_endpoints()->delete();
        });
    }

    public function api_gateway_logs()
    {
        return $this->hasMany(ApiGatewayLog::class);
    }

    public function client_api_keys()
    {
        return $this->hasMany(ClientApiKey::class);
    }


    public function webhook_events()
    {
        return $this->hasMany(WebhookEvent::class);
    }

    public function getWebhookUrlsAttribute(): array
    {
        try {
            $adapter = app(ServiceAdapterRegistry::class)->resolve($this);

            return $adapter->getSupportedWebhookUrls($this->uuid);
        } catch (\Throwable $e) {
            return [];
        }
    }
}
