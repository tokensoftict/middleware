<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\GatewayLogRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function __construct(
        protected GatewayLogRepositoryInterface $logRepo
    ) {}

    public function index(Request $request): JsonResponse
    {
        $clientId = $request->query('client_id') ? (int) $request->query('client_id') : null;
        $serviceId = $request->query('service_id') ? (int) $request->query('service_id') : null;
        $perPage = $request->query('per_page') ? (int) $request->query('per_page') : 15;

        $logs = $this->logRepo->search($clientId, $serviceId, $perPage);

        return response()->json($logs);
    }
}
