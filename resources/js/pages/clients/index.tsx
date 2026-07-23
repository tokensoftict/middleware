import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Plus,
    User,
    Mail,
    Phone,
    Key,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    Zap,
    Clock,
    Shield,
    UserPlus,
    X,
    Activity,
    Search,
    Edit2,
    Trash2,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ClientApiKey {
    id: number;
    name: string;
    api_key: string;
    status: string;
    rate_limit: number;
    expires_at: string;
    environment: string;
    last_used_at: string | null;
    service?: {
        id: number;
        name: string;
        slug: string;
    };
}

interface Client {
    id: number;
    name: string;
    contact_name: string | null;
    contact_email: string;
    phone: string | null;
    description: string | null;
    status: string;
    rate_limit: number;
    client_api_keys: ClientApiKey[];
}

interface Service {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}

interface IndexProps {
    clients: Client[];
    services: Service[];
}

export default function ClientsIndex({
    clients = [],
    services = [],
}: IndexProps) {
    const [selectedClientId, setSelectedClientId] = useState<number | null>(
        clients[0]?.id || null,
    );
    const selectedClient =
        clients.find((c) => c.id === selectedClientId) || clients[0] || null;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contact_email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Create Client Modal State
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    const [clientName, setClientName] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');

    // Edit Client Modal State
    const [isEditClientOpen, setIsEditClientOpen] = useState(false);
    const [editClientName, setEditClientName] = useState('');
    const [editContactName, setEditContactName] = useState('');
    const [editContactEmail, setEditContactEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Create Subscription Modal State
    const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [customRateLimit, setCustomRateLimit] = useState('60');
    const [subscriptionEnv, setSubscriptionEnv] = useState('sandbox');
    const [schemas, setSchemas] = useState<
        Record<
            string,
            {
                name: string;
                level: string;
                fields: Record<string, string>;
                subscription_fields: Record<string, string>;
            }
        >
    >({});
    const [subscriptionCredentials, setSubscriptionCredentials] = useState<
        Record<string, any>
    >({ sandbox: {}, production: {} });
    // Flat values for subscription-level fields (webhook_url, retries, etc.)
    const [subscriptionFields, setSubscriptionFields] = useState<
        Record<string, string>
    >({});

    React.useEffect(() => {
        fetch('/api/services/schemas')
            .then((res) => res.json())
            .then((data) => setSchemas(data))
            .catch((err) => console.error('Error fetching schemas:', err));
    }, []);

    const selectedService = services.find(
        (s) => s.id === parseInt(selectedServiceId),
    );
    const serviceSlug = selectedService?.slug || '';
    const currentServiceSchema = serviceSlug ? schemas[serviceSlug] : null;
    // Show per-subscription credential inputs for 'subscription' AND 'mixed' adapters
    const isSubscriptionLevel = currentServiceSchema?.level === 'subscription';
    const isMixedLevel = currentServiceSchema?.level === 'mixed';
    const hasSubscriptionFields =
        (isSubscriptionLevel || isMixedLevel) &&
        currentServiceSchema &&
        Object.keys(
            isSubscriptionLevel
                ? currentServiceSchema.fields
                : (currentServiceSchema.subscription_fields ?? {}),
        ).length > 0;

    // Credentials Modal State
    const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState<{
        api_key: string;
        api_secret: string;
    } | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    // Form submission processing
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name: clientName,
                    contact_name: contactName,
                    contact_email: contactEmail,
                    phone: phone,
                    description: description,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create client');
            }

            const newClient = await response.json();
            toast.success('Client created successfully');

            // Reset state
            setClientName('');
            setContactName('');
            setContactEmail('');
            setPhone('');
            setDescription('');
            setIsCreateClientOpen(false);

            // Reload page data
            router.reload({
                onSuccess: () => {
                    setSelectedClientId(newClient.id);
                },
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (client: Client) => {
        setEditClientName(client.name);
        setEditContactName(client.contact_name || '');
        setEditContactEmail(client.contact_email);
        setEditPhone(client.phone || '');
        setEditDescription(client.description || '');
        setIsEditClientOpen(true);
    };

    const handleEditClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/clients/${selectedClient.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name: editClientName,
                    contact_name: editContactName,
                    contact_email: editContactEmail,
                    phone: editPhone,
                    description: editDescription,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update client');
            }

            toast.success('Client updated successfully');
            setIsEditClientOpen(false);
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = async (id: number) => {
        if (
            !confirm(
                'Are you sure you want to delete this client? All related subscriptions and logs will be permanently deleted.',
            )
        ) {
            return;
        }
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete client');
            }

            toast.success('Client deleted successfully');

            // Set selected client to null or first available client
            const remainingClients = clients.filter((c) => c.id !== id);
            setSelectedClientId(remainingClients[0]?.id || null);

            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(
                `/api/clients/${selectedClient.id}/subscriptions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        service_id: parseInt(selectedServiceId),
                        rate_limit: parseInt(customRateLimit),
                        environment: subscriptionEnv,
                        credentials: subscriptionCredentials,
                        ...(isMixedLevel ? subscriptionFields : {}),
                    }),
                },
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(
                    errData.error || errData.message || 'Subscription failed',
                );
            }

            const data = await response.json();

            // Open credentials modal
            setGeneratedCredentials({
                api_key: data.api_key,
                api_secret: data.api_secret,
            });
            setIsCredentialsOpen(true);

            // Reset state
            setSelectedServiceId('');
            setCustomRateLimit('60');
            setSubscriptionEnv('sandbox');
            setSubscriptionCredentials({ sandbox: {}, production: {} });
            setSubscriptionFields({});
            setIsSubscribeOpen(false);

            // Reload page data
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string, type: 'key' | 'secret') => {
        navigator.clipboard.writeText(text);
        if (type === 'key') {
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        } else {
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        }
        toast.success('Copied to clipboard');
    };

    const handleToggleStatus = async (keyId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            const response = await fetch(`/api/subscriptions/${keyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            toast.success(`Key status updated to ${newStatus}`);
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleToggleEnvironment = async (
        keyId: number,
        currentEnv: string,
    ) => {
        const newEnv = currentEnv === 'sandbox' ? 'production' : 'sandbox';
        try {
            const response = await fetch(`/api/subscriptions/${keyId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ environment: newEnv }),
            });

            if (!response.ok) {
                throw new Error('Failed to update environment');
            }

            toast.success(`Key environment set to ${newEnv}`);
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleToggleClientStatus = async (
        clientId: number,
        currentStatus: string,
    ) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            const response = await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update client status');
            }

            toast.success(
                `Client account is now ${newStatus === 'active' ? 'Enabled' : 'Disabled'}`,
            );
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <Head title="Clients & Subscriptions" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Clients & API Keys
                    </h1>
                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                        Manage tenant clients and provision per-service
                        credentials.
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateClientOpen(true)}
                    className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground md:w-auto"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Client
                </Button>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
                {/* Client List */}
                <Card className="border border-neutral-200 shadow-sm lg:col-span-1 dark:border-neutral-800">
                    <CardHeader className="space-y-3 pb-3">
                        <div>
                            <CardTitle className="text-lg font-semibold">
                                Clients
                            </CardTitle>
                            <CardDescription>
                                Select a client to view subscriptions
                            </CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 pl-8"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-[600px] space-y-2 overflow-y-auto">
                        {filteredClients.length === 0 ? (
                            <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                                <User className="mx-auto mb-2 h-8 w-8 stroke-1 opacity-55" />
                                <p className="text-sm">
                                    No clients match search.
                                </p>
                            </div>
                        ) : (
                            filteredClients.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedClientId(c.id)}
                                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all duration-200 ${
                                        selectedClient?.id === c.id
                                            ? 'border-neutral-300 bg-neutral-100 shadow-sm dark:border-neutral-700 dark:bg-neutral-800'
                                            : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                            {c.name
                                                .substring(0, 2)
                                                .toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                {c.name}
                                            </p>
                                            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                                {c.contact_email}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            c.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="ml-2 capitalize"
                                    >
                                        {c.status}
                                    </Badge>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Client Detail & Subscriptions */}
                <div className="space-y-6 lg:col-span-3">
                    {selectedClient ? (
                        <>
                            {/* Client Summary */}
                            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-xl font-bold">
                                                {selectedClient.name}
                                            </CardTitle>
                                            <Badge
                                                variant={
                                                    selectedClient.status ===
                                                    'active'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="capitalize"
                                            >
                                                {selectedClient.status}
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            {selectedClient.description ||
                                                'No description provided.'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                        <Button
                                            onClick={() =>
                                                handleToggleClientStatus(
                                                    selectedClient.id,
                                                    selectedClient.status,
                                                )
                                            }
                                            variant={
                                                selectedClient.status ===
                                                'active'
                                                    ? 'destructive'
                                                    : 'default'
                                            }
                                            className="flex w-full items-center justify-center gap-2 sm:w-auto"
                                        >
                                            <User className="h-4 w-4" />
                                            {selectedClient.status === 'active'
                                                ? 'Disable Client'
                                                : 'Enable Client'}
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                openEditModal(selectedClient)
                                            }
                                            variant="outline"
                                            className="flex w-full items-center justify-center gap-2 sm:w-auto"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Edit Client
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                handleDeleteClient(
                                                    selectedClient.id,
                                                )
                                            }
                                            variant="destructive"
                                            className="flex w-full items-center justify-center gap-2 sm:w-auto"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Client
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                setIsSubscribeOpen(true)
                                            }
                                            variant="outline"
                                            className="flex w-full items-center justify-center gap-2 sm:w-auto"
                                        >
                                            <Key className="h-4 w-4 text-primary" />
                                            New Subscription
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 border-t border-neutral-100 pt-6 md:grid-cols-2 dark:border-neutral-800">
                                    <div className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                                        <Mail className="h-4 w-4 text-neutral-400" />
                                        <span>
                                            {selectedClient.contact_email}
                                        </span>
                                    </div>
                                    {selectedClient.phone && (
                                        <div className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                                            <Phone className="h-4 w-4 text-neutral-400" />
                                            <span>{selectedClient.phone}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Active Subscriptions */}
                            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Active Service Keys & Subscriptions
                                    </CardTitle>
                                    <CardDescription>
                                        Authorized gateway keys generated for
                                        this client.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {selectedClient.client_api_keys.length ===
                                    0 ? (
                                        <div className="rounded-lg border border-dashed border-neutral-300 py-12 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                            <Key className="mx-auto mb-2 h-10 w-10 stroke-1 opacity-55" />
                                            <p className="text-sm font-medium">
                                                No active API subscriptions.
                                            </p>
                                            <p className="mt-1 text-xs">
                                                Subscribe this client to an API
                                                service to generate credentials.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedClient.client_api_keys.map(
                                                (key) => (
                                                    <div
                                                        key={key.id}
                                                        className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
                                                    >
                                                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="border-none bg-primary/10 text-primary">
                                                                    {key.service
                                                                        ?.name ||
                                                                        'Global'}
                                                                </Badge>
                                                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    {key.name}
                                                                </span>
                                                                <Badge
                                                                    className="text-[10px] capitalize"
                                                                    variant={
                                                                        key.environment ===
                                                                        'production'
                                                                            ? 'default'
                                                                            : 'secondary'
                                                                    }
                                                                >
                                                                    {
                                                                        key.environment
                                                                    }
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleToggleEnvironment(
                                                                            key.id,
                                                                            key.environment,
                                                                        )
                                                                    }
                                                                    className="h-6 px-2 text-[10px]"
                                                                >
                                                                    Use{' '}
                                                                    {key.environment ===
                                                                    'sandbox'
                                                                        ? 'Production'
                                                                        : 'Sandbox'}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={
                                                                        key.status ===
                                                                        'active'
                                                                            ? 'destructive'
                                                                            : 'default'
                                                                    }
                                                                    onClick={() =>
                                                                        handleToggleStatus(
                                                                            key.id,
                                                                            key.status,
                                                                        )
                                                                    }
                                                                    className="h-6 px-2 text-[10px]"
                                                                >
                                                                    {key.status ===
                                                                    'active'
                                                                        ? 'Disable'
                                                                        : 'Enable'}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 text-xs text-neutral-600 md:grid-cols-2 dark:text-neutral-400">
                                                            <div className="flex items-center gap-2 truncate overflow-hidden rounded border border-neutral-100 bg-white p-2 font-mono select-all dark:border-neutral-900 dark:bg-neutral-950">
                                                                <span className="text-neutral-400">
                                                                    Key:
                                                                </span>
                                                                <span className="truncate">
                                                                    {
                                                                        key.api_key
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Zap className="h-3.5 w-3.5 text-neutral-400" />
                                                                <span>
                                                                    Rate Limit:{' '}
                                                                    {
                                                                        key.rate_limit
                                                                    }{' '}
                                                                    req/min
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                                                                <span>
                                                                    Expires:{' '}
                                                                    {new Date(
                                                                        key.expires_at,
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Activity className="h-3.5 w-3.5 text-neutral-400" />
                                                                <span>
                                                                    Last Used:{' '}
                                                                    {key.last_used_at
                                                                        ? new Date(
                                                                              key.last_used_at,
                                                                          ).toLocaleString()
                                                                        : 'Never'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-24 text-center dark:border-neutral-700 dark:bg-neutral-900/10">
                            <User className="mx-auto mb-3 h-12 w-12 stroke-1 text-neutral-400" />
                            <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                                No Client Selected
                            </h3>
                            <p className="mt-1 text-sm text-neutral-500">
                                Select an existing client or add a new one to
                                get started.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Create Client */}
            <Dialog
                open={isCreateClientOpen}
                onOpenChange={setIsCreateClientOpen}
            >
                <DialogContent className="sm:max-w-[450px]">
                    <form onSubmit={handleCreateClient}>
                        <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                            <DialogDescription>
                                Create a tenant client to begin managing their
                                integrations.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">
                                    Client / Company Name
                                </Label>
                                <Input
                                    id="name"
                                    value={clientName}
                                    onChange={(e) =>
                                        setClientName(e.target.value)
                                    }
                                    placeholder="e.g. Acme Corp"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="contact_name">
                                        Contact Person
                                    </Label>
                                    <Input
                                        id="contact_name"
                                        value={contactName}
                                        onChange={(e) =>
                                            setContactName(e.target.value)
                                        }
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        placeholder="+1 234 567"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) =>
                                        setContactEmail(e.target.value)
                                    }
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="desc">Short Description</Label>
                                <Input
                                    id="desc"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateClientOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Client'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Client */}
            <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <form onSubmit={handleEditClient}>
                        <DialogHeader>
                            <DialogTitle>Edit Client Details</DialogTitle>
                            <DialogDescription>
                                Update contact information and settings for this
                                client.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-1">
                                <Label htmlFor="edit-name">
                                    Client / Company Name
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={editClientName}
                                    onChange={(e) =>
                                        setEditClientName(e.target.value)
                                    }
                                    placeholder="e.g. Acme Corp"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="edit-contact_name">
                                        Contact Person
                                    </Label>
                                    <Input
                                        id="edit-contact_name"
                                        value={editContactName}
                                        onChange={(e) =>
                                            setEditContactName(e.target.value)
                                        }
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-phone">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="edit-phone"
                                        value={editPhone}
                                        onChange={(e) =>
                                            setEditPhone(e.target.value)
                                        }
                                        placeholder="+1 234 567"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-email">
                                    Contact Email
                                </Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editContactEmail}
                                    onChange={(e) =>
                                        setEditContactEmail(e.target.value)
                                    }
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-desc">
                                    Short Description
                                </Label>
                                <Input
                                    id="edit-desc"
                                    value={editDescription}
                                    onChange={(e) =>
                                        setEditDescription(e.target.value)
                                    }
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditClientOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Create Subscription */}
            <Dialog open={isSubscribeOpen} onOpenChange={setIsSubscribeOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <form onSubmit={handleCreateSubscription}>
                        <DialogHeader>
                            <DialogTitle>Subscribe to Service</DialogTitle>
                            <DialogDescription>
                                Choose an API service to provision new
                                credentials for{' '}
                                <strong className="text-neutral-900 dark:text-neutral-50">
                                    {selectedClient?.name}
                                </strong>
                                .
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-1">
                                <Label htmlFor="service">
                                    Select Service Provider
                                </Label>
                                <select
                                    id="service"
                                    value={selectedServiceId}
                                    onChange={(e) =>
                                        setSelectedServiceId(e.target.value)
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                    required
                                >
                                    <option value="" disabled>
                                        -- Select a Service --
                                    </option>
                                    {services.map((s) => (
                                        <option
                                            key={s.id}
                                            value={s.id}
                                            disabled={!s.is_active}
                                        >
                                            {s.name}{' '}
                                            {!s.is_active && '(Inactive)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="rate_limit">
                                    Rate Limit (req/min)
                                </Label>
                                <Input
                                    id="rate_limit"
                                    type="number"
                                    value={customRateLimit}
                                    onChange={(e) =>
                                        setCustomRateLimit(e.target.value)
                                    }
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sub_env">
                                    Gateway Routing Mode
                                </Label>
                                <select
                                    id="sub_env"
                                    value={subscriptionEnv}
                                    onChange={(e) =>
                                        setSubscriptionEnv(e.target.value)
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                                    required
                                >
                                    <option value="sandbox">
                                        Sandbox (Testing Base URL)
                                    </option>
                                    <option value="production">
                                        Production (Live Base URL)
                                    </option>
                                </select>
                            </div>

                            {/* Subscription-level credential fields */}
                            {hasSubscriptionFields && currentServiceSchema && (
                                <div className="mt-3 max-h-[350px] space-y-4 overflow-y-auto pr-1">
                                    {/* Mixed level: flat single-value fields (webhook_url, retries, etc.) */}
                                    {isMixedLevel && (
                                        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/20">
                                            <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 dark:border-neutral-800">
                                                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider text-primary uppercase">
                                                    <Shield className="h-3 w-3" />
                                                    Webhook & Delivery Settings
                                                </span>
                                            </div>
                                            {Object.entries(
                                                currentServiceSchema.subscription_fields ??
                                                    {},
                                            ).map(([fieldKey, label]) => (
                                                <div
                                                    key={fieldKey}
                                                    className="space-y-1"
                                                >
                                                    <Label
                                                        htmlFor={`sub-field-${fieldKey}`}
                                                        className="text-xs text-neutral-700 dark:text-neutral-300"
                                                    >
                                                        {label as string}
                                                    </Label>
                                                    <Input
                                                        id={`sub-field-${fieldKey}`}
                                                        type={
                                                            fieldKey.includes(
                                                                'retries',
                                                            ) ||
                                                            fieldKey.includes(
                                                                'days',
                                                            )
                                                                ? 'number'
                                                                : 'text'
                                                        }
                                                        min={
                                                            fieldKey.includes(
                                                                'retries',
                                                            ) ||
                                                            fieldKey.includes(
                                                                'days',
                                                            )
                                                                ? '0'
                                                                : undefined
                                                        }
                                                        value={
                                                            subscriptionFields[
                                                                fieldKey
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            setSubscriptionFields(
                                                                {
                                                                    ...subscriptionFields,
                                                                    [fieldKey]:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder={`Enter ${label}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Subscription level: sandbox + production credential split */}
                                    {isSubscriptionLevel && (
                                        <>
                                            <h4 className="font-mono text-xs font-semibold tracking-wider text-neutral-900 uppercase dark:text-neutral-100">
                                                Subscription Credentials
                                            </h4>

                                            {/* Sandbox Frame */}
                                            <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/20">
                                                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 dark:border-neutral-800">
                                                    <span className="font-mono text-[10px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-500">
                                                        Sandbox Configuration
                                                    </span>
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"></span>
                                                </div>
                                                {Object.entries(
                                                    currentServiceSchema.fields,
                                                ).map(([fieldKey, label]) => (
                                                    <div
                                                        key={`sandbox-${fieldKey}`}
                                                        className="space-y-1"
                                                    >
                                                        <Label
                                                            htmlFor={`sub-cred-sandbox-${fieldKey}`}
                                                            className="text-xs text-neutral-700 dark:text-neutral-300"
                                                        >
                                                            {label as string}
                                                        </Label>
                                                        <Input
                                                            id={`sub-cred-sandbox-${fieldKey}`}
                                                            type="text"
                                                            value={
                                                                subscriptionCredentials
                                                                    .sandbox?.[
                                                                    fieldKey
                                                                ] || ''
                                                            }
                                                            onChange={(e) =>
                                                                setSubscriptionCredentials(
                                                                    {
                                                                        ...subscriptionCredentials,
                                                                        sandbox:
                                                                            {
                                                                                ...(subscriptionCredentials.sandbox ||
                                                                                    {}),
                                                                                [fieldKey]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    },
                                                                )
                                                            }
                                                            placeholder={`Enter Sandbox ${label}`}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Production Frame */}
                                            <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/20">
                                                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 dark:border-neutral-800">
                                                    <span className="font-mono text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-500">
                                                        Production Configuration
                                                    </span>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                </div>
                                                {Object.entries(
                                                    currentServiceSchema.fields,
                                                ).map(([fieldKey, label]) => (
                                                    <div
                                                        key={`production-${fieldKey}`}
                                                        className="space-y-1"
                                                    >
                                                        <Label
                                                            htmlFor={`sub-cred-production-${fieldKey}`}
                                                            className="text-xs text-neutral-700 dark:text-neutral-300"
                                                        >
                                                            {label as string}
                                                        </Label>
                                                        <Input
                                                            id={`sub-cred-production-${fieldKey}`}
                                                            type="text"
                                                            value={
                                                                subscriptionCredentials
                                                                    .production?.[
                                                                    fieldKey
                                                                ] || ''
                                                            }
                                                            onChange={(e) =>
                                                                setSubscriptionCredentials(
                                                                    {
                                                                        ...subscriptionCredentials,
                                                                        production:
                                                                            {
                                                                                ...(subscriptionCredentials.production ||
                                                                                    {}),
                                                                                [fieldKey]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    },
                                                                )
                                                            }
                                                            placeholder={`Enter Production ${label}`}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsSubscribeOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Provisioning...'
                                    : 'Provision Key'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Display Generated Credentials */}
            <Dialog
                open={isCredentialsOpen}
                onOpenChange={setIsCredentialsOpen}
            >
                <DialogContent className="border-amber-500/20 sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                            Secure Subscription Credentials Created
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Store these credentials immediately. The Secret Key
                            will never be displayed again.
                        </DialogDescription>
                    </DialogHeader>

                    {generatedCredentials && (
                        <div className="space-y-4 py-3">
                            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>
                                    For security, we bcrypt hash this secret key
                                    on our servers. You must copy and save it
                                    now to perform API gateway requests.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">X-API-Key</Label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 truncate rounded border bg-neutral-100 p-2 font-mono text-xs select-all dark:border-neutral-800 dark:bg-neutral-900">
                                            {generatedCredentials.api_key}
                                        </code>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                copyToClipboard(
                                                    generatedCredentials.api_key,
                                                    'key',
                                                )
                                            }
                                        >
                                            {copiedKey ? (
                                                <Check className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        X-API-Secret
                                    </Label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 truncate rounded border bg-neutral-100 p-2 font-mono text-xs select-all dark:border-neutral-800 dark:bg-neutral-900">
                                            {generatedCredentials.api_secret}
                                        </code>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                copyToClipboard(
                                                    generatedCredentials.api_secret,
                                                    'secret',
                                                )
                                            }
                                        >
                                            {copiedSecret ? (
                                                <Check className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            className="w-full bg-amber-600 text-white hover:bg-amber-700"
                            onClick={() => setIsCredentialsOpen(false)}
                        >
                            I Have Safely Saved These Credentials
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
