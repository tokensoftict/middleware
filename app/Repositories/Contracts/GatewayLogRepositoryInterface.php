<?php

namespace App\Repositories\Contracts;

use App\Models\ApiGatewayLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface GatewayLogRepositoryInterface
{
    public function log(array $data): ApiGatewayLog;

    public function search(?int $clientId, ?int $serviceId, int $perPage = 15): LengthAwarePaginator;
}
