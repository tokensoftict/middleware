<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Service;
use App\Models\ApiGatewayLog;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{

    public function index(): Response
    {
        $totalClients = Client::count();
        $totalServices = Service::count();
        $totalLogs = ApiGatewayLog::count();

        $avgResponseTime = round(ApiGatewayLog::avg('execution_time_ms') ?? 0);

        $successLogs = ApiGatewayLog::whereBetween('http_status_code', [200, 299])->count();
        $successRate = $totalLogs > 0 ? round(($successLogs / $totalLogs) * 100, 1) : 100;

        // Top Services by Request Volume
        $topServices = ApiGatewayLog::select('service_id', DB::raw('count(*) as count'))
            ->with('service:id,name')
            ->groupBy('service_id')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($log) => [
                'name' => $log->service?->name ?? 'Global/Unknown',
                'count' => $log->count
            ]);

        // Recent 5 Gateway Logs
        $recentLogs = ApiGatewayLog::with(['client:id,name', 'service:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 7-Day Request Volume Trend
        $dailyTrends = ApiGatewayLog::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(fn($item) => [
                'date' => date('M d', strtotime($item->date)),
                'count' => $item->count
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'total_clients' => $totalClients,
                'total_services' => $totalServices,
                'total_requests' => $totalLogs,
                'avg_latency_ms' => $avgResponseTime,
                'success_rate' => $successRate,
            ],
            'top_services' => $topServices,
            'recent_logs' => $recentLogs,
            'daily_trends' => $dailyTrends,
        ]);
    }
}
