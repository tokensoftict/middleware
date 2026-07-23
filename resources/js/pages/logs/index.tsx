import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    History,
    Search,
    Info,
    ChevronLeft,
    ChevronRight,
    CornerDownRight,
    Activity,
    Clock,
    Zap,
    X,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface LogEntry {
    id: number;
    client_id: number;
    service_id: number;
    endpoint_called: string;
    request_method: string;
    request_payload: any;
    request_headers: any;
    service_headers: any;
    response_payload: any;
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

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedLogs {
    data: LogEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLinks[];
}

interface Client {
    id: number;
    name: string;
}

interface Service {
    id: number;
    name: string;
}

interface IndexProps {
    logs: PaginatedLogs;
    clients: Client[];
    services: Service[];
    filters?: {
        client_id?: string;
        service_id?: string;
        date_filter?: string;
        from_date?: string;
        to_date?: string;
    };
}

export default function LogsIndex({
    logs,
    clients = [],
    services = [],
    filters = {},
}: IndexProps) {
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    // Filters
    const [filterClientId, setFilterClientId] = useState(
        filters.client_id || '',
    );
    const [filterServiceId, setFilterServiceId] = useState(
        filters.service_id || '',
    );
    const [dateFilter, setDateFilter] = useState(filters.date_filter || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/gateway-logs',
            {
                client_id: filterClientId,
                service_id: filterServiceId,
                date_filter: dateFilter,
                from_date: dateFilter === 'custom' ? fromDate : '',
                to_date: dateFilter === 'custom' ? toDate : '',
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleClearFilters = () => {
        setFilterClientId('');
        setFilterServiceId('');
        setDateFilter('');
        setFromDate('');
        setToDate('');
        router.get(
            '/gateway-logs',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const getStatusColor = (code: number) => {
        if (code >= 200 && code < 300)
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400';
        if (code >= 300 && code < 400)
            return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400';
        if (code >= 400 && code < 500)
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400';
    };

    return (
        <div className="space-y-6 p-6">
            <Head title="Gateway Logs" />

            <div>
                <h1 className="font-sans text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    Audit Logs
                </h1>
                <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                    Trace requests traversing the API gateway, investigate
                    errors, and review performance latency.
                </p>
            </div>

            {/* Filter Panel */}
            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-md flex items-center gap-2 font-bold">
                        <Filter className="h-4 w-4 text-primary" />
                        Search & Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleApplyFilters}
                        className="flex flex-col gap-4 md:flex-row md:items-end"
                    >
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="client-filter">Filter Client</Label>
                            <select
                                id="client-filter"
                                value={filterClientId}
                                onChange={(e) =>
                                    setFilterClientId(e.target.value)
                                }
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                            >
                                <option value="">-- All Clients --</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="service-filter">
                                Filter Service
                            </Label>
                            <select
                                id="service-filter"
                                value={filterServiceId}
                                onChange={(e) =>
                                    setFilterServiceId(e.target.value)
                                }
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                            >
                                <option value="">-- All Services --</option>
                                {services.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="date-filter">Date Range</Label>
                            <select
                                id="date-filter"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                            >
                                <option value="">-- All Time --</option>
                                <option value="today">Today</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        {dateFilter === 'custom' && (
                            <>
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="from-date">From</Label>
                                    <input
                                        id="from-date"
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) =>
                                            setFromDate(e.target.value)
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="to-date">To</Label>
                                    <input
                                        id="to-date"
                                        type="date"
                                        value={toDate}
                                        onChange={(e) =>
                                            setToDate(e.target.value)
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                    />
                                </div>
                            </>
                        )}
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                className="flex items-center gap-1.5 bg-primary text-primary-foreground"
                            >
                                <Search className="h-4 w-4" />
                                Apply
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-neutral-500 dark:text-neutral-400">
                            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-700 uppercase dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Service</th>
                                    <th className="px-6 py-4">Method & Path</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Latency</th>
                                    <th className="px-6 py-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-neutral-500 dark:text-neutral-400"
                                        >
                                            <History className="mx-auto mb-2 h-8 w-8 stroke-1 opacity-55" />
                                            <p className="text-sm font-medium">
                                                No logs matched your query.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="transition-all hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
                                        >
                                            <td className="px-6 py-4 text-xs whitespace-nowrap">
                                                {new Date(
                                                    log.created_at,
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                                                {log.client?.name ||
                                                    `Client #${log.client_id}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className="border-none bg-primary/10 text-primary">
                                                    {log.service?.name ||
                                                        `Service #${log.service_id}`}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                                                <span className="mr-2 font-bold text-primary">
                                                    {log.request_method}
                                                </span>
                                                <span>
                                                    {log.endpoint_called}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`rounded px-2 py-1 text-xs font-semibold ${getStatusColor(log.http_status_code)}`}
                                                >
                                                    {log.http_status_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs whitespace-nowrap">
                                                {log.execution_time_ms} ms
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setSelectedLog(log)
                                                    }
                                                    className="ml-auto flex items-center gap-1.5 text-primary"
                                                >
                                                    <Info className="h-3.5 w-3.5" />
                                                    Inspect
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
                            <span className="text-xs text-neutral-500">
                                Showing {logs.data.length} of {logs.total}{' '}
                                entries
                            </span>
                            <div className="flex gap-1">
                                {logs.links.map((link, idx) => {
                                    if (link.url === null) return null;
                                    const isPrev =
                                        link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');

                                    return (
                                        <Button
                                            key={idx}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                router.get(link.url!, {
                                                    client_id: filterClientId,
                                                    service_id: filterServiceId,
                                                    date_filter: dateFilter,
                                                    from_date:
                                                        dateFilter === 'custom'
                                                            ? fromDate
                                                            : '',
                                                    to_date:
                                                        dateFilter === 'custom'
                                                            ? toDate
                                                            : '',
                                                })
                                            }
                                            className="px-3"
                                        >
                                            {isPrev ? (
                                                <ChevronLeft className="h-4 w-4" />
                                            ) : isNext ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                link.label
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Log Detail Inspector Modal */}
            <Dialog
                open={!!selectedLog}
                onOpenChange={(open) => !open && setSelectedLog(null)}
            >
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            Log Trace #{selectedLog?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Complete metadata payload and HTTP header audit log.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 py-3">
                            <div className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-xs dark:border-neutral-900 dark:bg-neutral-950/20">
                                <div className="space-y-2">
                                    <p className="text-neutral-500">Client</p>
                                    <p className="font-bold text-neutral-900 dark:text-neutral-100">
                                        {selectedLog.client?.name}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-neutral-500">
                                        Service Provider
                                    </p>
                                    <p className="font-bold text-neutral-900 dark:text-neutral-100">
                                        {selectedLog.service?.name}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-neutral-500">
                                        Gateway Route
                                    </p>
                                    <p className="font-mono font-bold text-primary">
                                        {selectedLog.request_method}{' '}
                                        {selectedLog.endpoint_called}
                                    </p>
                                </div>
                                <div className="flex gap-4 space-y-2">
                                    <div>
                                        <p className="mb-1 text-neutral-500">
                                            Status Code
                                        </p>
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusColor(selectedLog.http_status_code)}`}
                                        >
                                            {selectedLog.http_status_code}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-neutral-500">
                                            Latency
                                        </p>
                                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                            {selectedLog.execution_time_ms} ms
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Request Headers */}
                            {selectedLog.request_headers && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Request Headers (Sent to Gateway)
                                    </Label>
                                    <pre className="max-h-[150px] overflow-y-auto rounded-lg border bg-neutral-100 p-3 font-mono text-xs select-all dark:border-neutral-800 dark:bg-neutral-900">
                                        {JSON.stringify(
                                            selectedLog.request_headers,
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                            )}

                            {/* Service Request Headers */}
                            {selectedLog.service_headers && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Service Request Headers (Sent to
                                        Provider)
                                    </Label>
                                    <pre className="max-h-[150px] overflow-y-auto rounded-lg border bg-neutral-100 p-3 font-mono text-xs select-all dark:border-neutral-800 dark:bg-neutral-900">
                                        {JSON.stringify(
                                            selectedLog.service_headers,
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                            )}

                            {/* Request Payload */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">
                                    Request Payload
                                </Label>
                                <pre className="max-h-[150px] overflow-y-auto rounded-lg border bg-neutral-100 p-3 font-mono text-xs select-all dark:border-neutral-800 dark:bg-neutral-900">
                                    {JSON.stringify(
                                        selectedLog.request_payload,
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>

                            {/* Response Payload */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">
                                    Response Payload
                                </Label>
                                <pre className="max-h-[200px] overflow-y-auto rounded-lg border bg-neutral-100 p-3 font-mono text-xs select-all dark:border-neutral-800 dark:bg-neutral-900">
                                    {JSON.stringify(
                                        selectedLog.response_payload,
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
