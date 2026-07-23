<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Service;
use App\Models\ApiGatewayLog;
use Inertia\Inertia;
use Inertia\Response;

class GatewayLogViewController extends Controller
{
    /**
     * Display the gateway logs administration page.
     */
    public function index(): Response
    {
        $clientId = request('client_id');
        $serviceId = request('service_id');
        $dateFilter = request('date_filter');
        $fromDate = request('from_date');
        $toDate = request('to_date');

        $logsQuery = ApiGatewayLog::with(['client', 'service'])->orderBy('created_at', 'desc');

        if ($clientId) {
            $logsQuery->where('client_id', $clientId);
        }

        if ($serviceId) {
            $logsQuery->where('service_id', $serviceId);
        }

        if ($dateFilter) {
            if ($dateFilter === 'today') {
                $logsQuery->whereDate('created_at', today());
            } elseif ($dateFilter === 'this_week') {
                $logsQuery->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            } elseif ($dateFilter === 'this_month') {
                $logsQuery->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
            } elseif ($dateFilter === 'custom' && $fromDate) {
                if ($toDate) {
                    $logsQuery->whereBetween('created_at', [
                        \Carbon\Carbon::parse($fromDate)->startOfDay(),
                        \Carbon\Carbon::parse($toDate)->endOfDay(),
                    ]);
                } else {
                    $logsQuery->where('created_at', '>=', \Carbon\Carbon::parse($fromDate)->startOfDay());
                }
            }
        }

        return Inertia::render('logs/index', [
            'logs' => $logsQuery->paginate(20)->withQueryString(),
            'clients' => Client::all(),
            'services' => Service::all(),
            'filters' => [
                'client_id' => $clientId,
                'service_id' => $serviceId,
                'date_filter' => $dateFilter,
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }
}
