<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ApiGatewayLog
 *
 * @property int $id
 * @property int|null $client_id
 * @property int|null $service_id
 * @property int|null $client_api_key_id
 * @property string $endpoint_called
 * @property string $request_method
 * @property array|null $request_payload
 * @property array|null $request_headers
 * @property array|null $service_headers
 * @property array|null $response_payload
 * @property int $http_status_code
 * @property int $execution_time_ms
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property ClientApiKey|null $client_api_key
 * @property Client|null $client
 * @property Service|null $service
 */
class ApiGatewayLog extends Model
{
    protected $table = 'api_gateway_logs';

    protected $casts = [
        'client_id' => 'int',
        'service_id' => 'int',
        'client_api_key_id' => 'int',
        'request_payload' => 'json',
        'request_headers' => 'json',
        'service_headers' => 'json',
        'response_payload' => 'json',
        'http_status_code' => 'int',
        'execution_time_ms' => 'int',
    ];

    protected $fillable = [
        'client_id',
        'service_id',
        'client_api_key_id',
        'endpoint_called',
        'request_method',
        'request_payload',
        'request_headers',
        'service_headers',
        'response_payload',
        'http_status_code',
        'execution_time_ms',
    ];

    public function client_api_key()
    {
        return $this->belongsTo(ClientApiKey::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
