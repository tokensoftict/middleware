import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Search,
    User,
    Cloud,
    History,
    Activity,
    Clock,
    CheckCircle2,
    Info,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Client {
    id: number;
    name: string;
    contact_email: string;
    status: string;
}

interface Service {
    id: number;
    name: string;
    slug: string;
    sandbox_base_url: string;
    is_active: boolean;
}

interface LogEntry {
    id: number;
    endpoint_called: string;
    request_method: string;
    http_status_code: number;
    execution_time_ms: number;
    created_at: string;
    client?: { name: string };
    service?: { name: string };
    request_headers: any;
    request_payload: any;
    response_payload: any;
}

interface IndexProps {
    clients: Client[];
    services: Service[];
    logs: LogEntry[];
    query: string;
}

export default function SearchIndex({
    clients = [],
    services = [],
    logs = [],
    query = '',
}: IndexProps) {
    const [searchQuery, setSearchQuery] = useState(query);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/search', { q: searchQuery }, { preserveState: true });
    };

    const getStatusColor = (code: number) => {
        if (code >= 200 && code < 300)
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400';
        if (code >= 400 && code < 500)
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400';
    };

    return (
        <div className="mx-auto flex h-full min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-1 flex-col items-stretch space-y-6 p-6">
            <Head title="Unified Search" />

            <div>
                <h1 className="font-sans text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    Unified Search
                </h1>
                <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                    Lookup client profiles, provider configurations, or specific
                    gateway transaction logs.
                </p>
            </div>

            {/* Search Input Box */}
            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearchSubmit} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by client name, email, service slug, or gateway endpoint..."
                                className="h-10 w-full pl-9"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            className="h-10 bg-primary text-primary-foreground"
                        >
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Results Grid - Stretch to fill remaining space */}
            {query === '' ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-16 dark:border-neutral-700 dark:bg-neutral-900/10">
                    <Search className="mb-3 h-12 w-12 stroke-1 text-neutral-400" />
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        Ready to Search
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                        Enter a keyword above to find entries across the
                        middleware platform.
                    </p>
                </div>
            ) : (
                <div className="grid flex-1 grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
                    {/* Column 1: Clients */}
                    <Card className="flex min-h-[300px] flex-col border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="border-b pb-3 dark:border-neutral-800">
                            <CardTitle className="flex items-center justify-between text-sm font-bold">
                                <span className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Clients
                                </span>
                                <Badge variant="secondary">
                                    {clients.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3 overflow-y-auto p-4">
                            {clients.length === 0 ? (
                                <p className="py-6 text-center text-xs text-neutral-500">
                                    No matching clients found.
                                </p>
                            ) : (
                                clients.map((c) => (
                                    <div
                                        key={c.id}
                                        className="space-y-1.5 rounded-lg border border-neutral-100 bg-neutral-50/30 p-3 dark:border-neutral-900 dark:bg-neutral-950/20"
                                    >
                                        <div className="flex items-start justify-between">
                                            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                {c.name}
                                            </p>
                                            <Badge
                                                className="text-[10px]"
                                                variant={
                                                    c.status === 'active'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {c.status}
                                            </Badge>
                                        </div>
                                        <p className="truncate text-xs text-neutral-500">
                                            {c.contact_email}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Column 2: Services */}
                    <Card className="flex min-h-[300px] flex-col border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="border-b pb-3 dark:border-neutral-800">
                            <CardTitle className="flex items-center justify-between text-sm font-bold">
                                <span className="flex items-center gap-2">
                                    <Cloud className="h-4 w-4 text-primary" />
                                    Services
                                </span>
                                <Badge variant="secondary">
                                    {services.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3 overflow-y-auto p-4">
                            {services.length === 0 ? (
                                <p className="py-6 text-center text-xs text-neutral-500">
                                    No matching services found.
                                </p>
                            ) : (
                                services.map((s) => (
                                    <div
                                        key={s.id}
                                        className="space-y-1.5 rounded-lg border border-neutral-100 bg-neutral-50/30 p-3 dark:border-neutral-900 dark:bg-neutral-950/20"
                                    >
                                        <div className="flex items-start justify-between">
                                            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                {s.name}
                                            </p>
                                            <Badge
                                                className="text-[10px]"
                                                variant={
                                                    s.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {s.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <code className="font-mono text-[10px] text-primary">
                                            {s.slug}
                                        </code>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Column 3: Gateway Logs */}
                    <Card className="flex min-h-[300px] flex-col border border-neutral-200 shadow-sm dark:border-neutral-800">
                        <CardHeader className="border-b pb-3 dark:border-neutral-800">
                            <CardTitle className="flex items-center justify-between text-sm font-bold">
                                <span className="flex items-center gap-2">
                                    <History className="h-4 w-4 text-primary" />
                                    Transaction Logs
                                </span>
                                <Badge variant="secondary">{logs.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3 overflow-y-auto p-4">
                            {logs.length === 0 ? (
                                <p className="py-6 text-center text-xs text-neutral-500">
                                    No matching logs found.
                                </p>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/30 p-3 dark:border-neutral-900 dark:bg-neutral-950/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <code className="truncate font-mono text-xs font-bold">
                                                {log.request_method}{' '}
                                                {log.endpoint_called}
                                            </code>
                                            <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getStatusColor(log.http_status_code)}`}
                                            >
                                                {log.http_status_code}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-neutral-500">
                                            <span>
                                                {log.client?.name || 'Client'}
                                            </span>
                                            <span>
                                                {log.execution_time_ms} ms
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-1 flex h-7 w-full items-center justify-center gap-1 border border-transparent text-[10px] text-primary hover:border-neutral-200 dark:hover:border-neutral-800"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <Info className="h-3 w-3" />
                                            Inspect Trace
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Log Detail Inspector Modal */}
            <Dialog
                open={!!selectedLog}
                onOpenChange={(open) => !open && setSelectedLog(null)}
            >
                <DialogContent className="max-h-[85vh] max-w-[700px] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            Log Trace Details #{selectedLog?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Payload audit data for key validation tracking.
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
