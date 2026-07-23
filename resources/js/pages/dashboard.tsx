import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import {
    Users,
    Server,
    Activity,
    Clock,
    CheckCircle2,
    TrendingUp,
    ArrowUpRight,
    Zap,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatItem {
    total_clients: number;
    total_services: number;
    total_requests: number;
    avg_latency_ms: number;
    success_rate: number;
}

interface TopService {
    name: string;
    count: number;
}

interface DailyTrend {
    date: string;
    count: number;
}

interface RecentLog {
    id: number;
    endpoint_called: string;
    request_method: string;
    http_status_code: number;
    execution_time_ms: number;
    created_at: string;
    client?: {
        name: string;
    };
    service?: {
        name: string;
    };
}

interface DashboardProps {
    stats: StatItem;
    top_services: TopService[];
    recent_logs: RecentLog[];
    daily_trends: DailyTrend[];
}

export default function Dashboard({
    stats,
    top_services = [],
    recent_logs = [],
    daily_trends = [],
}: DashboardProps) {
    const getStatusColor = (code: number) => {
        if (code >= 200 && code < 300)
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400';
        if (code >= 300 && code < 400)
            return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400';
        if (code >= 400 && code < 500)
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400';
    };

    // Calculate max count for daily trends chart scaling
    const maxTrendCount =
        daily_trends.length > 0
            ? Math.max(...daily_trends.map((t) => t.count))
            : 10;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div>
                    <h1 className="font-sans text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        API Gateway Dashboard
                    </h1>
                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                        Real-time status overview, API telemetry, and active
                        integrations.
                    </p>
                </div>

                {/* Stats Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="font-mono text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                Clients Accounted
                            </CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_clients}
                            </div>
                            <p className="mt-0.5 text-[10px] text-neutral-500">
                                Active tenants connected
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="font-mono text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                Service Adapters
                            </CardTitle>
                            <Server className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_services}
                            </div>
                            <p className="mt-0.5 text-[10px] text-neutral-500">
                                Registered API adapters
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="font-mono text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                Total API Requests
                            </CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_requests.toLocaleString()}
                            </div>
                            <p className="mt-0.5 text-[10px] text-neutral-500">
                                Proxy logs successfully processed
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="font-mono text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                Success Rate
                            </CardTitle>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                                    {stats.success_rate}%
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.avg_latency_ms}{' '}
                                <span className="text-xs font-normal text-neutral-500">
                                    ms
                                </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-neutral-500">
                                Average roundtrip latency
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Details Section */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* 7-Day Request Volume Bar Chart */}
                    <Card className="border border-neutral-200 shadow-sm lg:col-span-2 dark:border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-md flex items-center gap-2 font-bold">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                7-Day Request Volume Trend
                            </CardTitle>
                            <CardDescription>
                                Daily request counts processed by the gateway
                                middleware.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {daily_trends.length === 0 ? (
                                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-neutral-200 text-xs text-neutral-400 dark:border-neutral-800">
                                    No data available. Send request traffic to
                                    generate charts.
                                </div>
                            ) : (
                                <div className="flex h-[200px] items-end justify-between gap-4 px-4 pt-6">
                                    {daily_trends.map((day, idx) => {
                                        const percentageHeight =
                                            maxTrendCount > 0
                                                ? (day.count / maxTrendCount) *
                                                  100
                                                : 0;
                                        return (
                                            <div
                                                key={idx}
                                                className="group relative flex flex-1 flex-col items-center gap-2"
                                            >
                                                {/* Tooltip */}
                                                <div className="pointer-events-none absolute bottom-full mb-1 rounded bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                                                    {day.count} reqs
                                                </div>
                                                {/* Bar */}
                                                <div
                                                    className="w-full rounded-t-sm bg-primary/20 transition-all duration-300 hover:bg-primary/40 dark:bg-primary/10 dark:hover:bg-primary/30"
                                                    style={{
                                                        height: `${Math.max(percentageHeight, 5)}%`,
                                                    }}
                                                ></div>
                                                {/* Label */}
                                                <span className="font-mono text-[10px] whitespace-nowrap text-neutral-400">
                                                    {day.date}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Services */}
                    <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-md flex items-center gap-2 font-bold">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Top Routed Service Providers
                            </CardTitle>
                            <CardDescription>
                                Service requests volume distribution.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {top_services.length === 0 ? (
                                <div className="py-12 text-center text-xs text-neutral-400">
                                    No services routed yet.
                                </div>
                            ) : (
                                top_services.map((item, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="truncate pr-2 font-semibold text-neutral-800 dark:text-neutral-200">
                                                {item.name}
                                            </span>
                                            <span className="font-mono text-neutral-500">
                                                {item.count} reqs
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-900">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width: `${Math.min((item.count / (stats.total_requests || 1)) * 100, 100)}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Logs List */}
                <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-md font-bold">
                                Recent Request Traces
                            </CardTitle>
                            <CardDescription>
                                Last 5 requests processed by the aggregation
                                layer.
                            </CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="flex items-center gap-1 border-neutral-300 font-mono text-[10px] font-bold tracking-wider uppercase"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                            Gateway Active
                        </Badge>
                    </CardHeader>
                    <CardContent className="border-t border-neutral-100 p-0 dark:border-neutral-800">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-neutral-500 dark:text-neutral-400">
                                <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs text-neutral-700 uppercase dark:border-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300">
                                    <tr>
                                        <th className="px-6 py-3">Client</th>
                                        <th className="px-6 py-3">Service</th>
                                        <th className="px-6 py-3">Route</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Latency</th>
                                        <th className="px-6 py-3 text-right">
                                            Timestamp
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80">
                                    {recent_logs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-8 text-center text-xs text-neutral-400"
                                            >
                                                No request traffic has been
                                                processed yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_logs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-neutral-50/30 dark:hover:bg-neutral-900/10"
                                            >
                                                <td className="px-6 py-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                                    {log.client?.name ||
                                                        'Unknown'}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <Badge className="border-none bg-primary/10 text-primary">
                                                        {log.service?.name ||
                                                            'Unknown'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-3 font-mono text-xs">
                                                    <span className="mr-1 font-bold text-primary">
                                                        {log.request_method}
                                                    </span>
                                                    <span>
                                                        {log.endpoint_called}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span
                                                        className={`rounded px-2 py-0.5 text-[11px] font-bold ${getStatusColor(log.http_status_code)}`}
                                                    >
                                                        {log.http_status_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-xs">
                                                    {log.execution_time_ms} ms
                                                </td>
                                                <td className="px-6 py-3 text-right text-xs whitespace-nowrap">
                                                    {new Date(
                                                        log.created_at,
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
