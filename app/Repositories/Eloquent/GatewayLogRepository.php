<?php

namespace App\Repositories\Eloquent;

use App\Models\ApiGatewayLog;
use App\Repositories\Contracts\GatewayLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GatewayLogRepository implements GatewayLogRepositoryInterface
{
    public function log(array $data): ApiGatewayLog
    {
        return ApiGatewayLog::create($data);
    }

    public function search(?int $clientId, ?int $serviceId, int $perPage = 15): LengthAwarePaginator
    {
        $query = ApiGatewayLog::query()->orderBy('created_at', 'desc');

        if ($clientId) {
            $query->where('client_id', $clientId);
        }

        if ($serviceId) {
            $query->where('service_id', $serviceId);
        }

        return $query->paginate($perPage);
    }
}
