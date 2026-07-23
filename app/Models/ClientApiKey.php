<?php
/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ClientApiKey
 *
 * @property int $id
 * @property string $name
 * @property int $client_id
 * @property int|null $service_id
 * @property string $api_key
 * @property string $api_secret
 * @property string $permissions
 * @property int $rate_limit
 * @property string $status
 * @property string $environment
 * @property string|null $credentials
 * @property Carbon|null $last_used_at
 * @property Carbon|null $expires_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Client $client
 * @property Service|null $service
 * @property Collection|ApiGatewayLog[] $api_gateway_logs
 * @property Collection|WebhookDelivery[] $webhook_deliveries
 * @property Collection|WebhookEvent[] $webhook_events
 */
class ClientApiKey extends Model
{
    protected $table = 'client_api_keys';

    protected $casts = [
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'rate_limit' => 'integer',
        'permissions' => 'array',
        'credentials' => 'encrypted:array',
    ];


    protected $fillable = [
        'name',
        'client_id',
        'service_id',
        'api_key',
        'api_secret',
        'permissions',
        'rate_limit',
        'status',
        'environment',
        'credentials',
        'last_used_at',
        'expires_at',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function api_gateway_logs()
    {
        return $this->hasMany(ApiGatewayLog::class);
    }

    public function webhook_deliveries()
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    public function webhook_events()
    {
        return $this->hasMany(WebhookEvent::class);
    }
}
