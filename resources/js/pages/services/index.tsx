import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Plus,
    Cloud,
    Settings,
    Link as LinkIcon,
    Shield,
    Power,
    Clock,
    RotateCcw,
    Edit2,
    Trash2,
    Copy,
    Check,
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

interface Service {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sandbox_base_url: string;
    production_base_url: string;
    timeout: number;
    max_retries: number;
    is_active: boolean;
    credentials?: Record<string, any> | null;
    webhookUrls : string[]
}

interface IndexProps {
    services: Service[];
}

export default function ServicesIndex({ services = [] }: IndexProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrl(text);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    // Schemas state loaded on mount
    const [schemas, setSchemas] = useState<
        Record<
            string,
            {
                name: string;
                fields: Record<string, string>;
                level: string;
                webhookUrls?: Record<string, string>;
            }
        >
    >({});

    React.useEffect(() => {
        fetch('/api/services/schemas')
            .then((res) => res.json())
            .then((data) => setSchemas(data))
            .catch((err) => console.error('Error fetching schemas:', err));
    }, []);

    // Form fields
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [sandboxUrl, setSandboxUrl] = useState('');
    const [productionUrl, setProductionUrl] = useState('');
    const [timeout, setTimeoutVal] = useState('30');
    const [maxRetries, setMaxRetries] = useState('3');
    const [isActive, setIsActive] = useState(true);
    const [sandboxCredentials, setSandboxCredentials] = useState<
        Record<string, string>
    >({});
    const [productionCredentials, setProductionCredentials] = useState<
        Record<string, string>
    >({});

    const openCreateModal = () => {
        setName('');
        setSlug('');
        setDescription('');
        setSandboxUrl('');
        setProductionUrl('');
        setTimeoutVal('30');
        setMaxRetries('3');
        setIsActive(true);
        setSandboxCredentials({});
        setProductionCredentials({});
        setIsCreateOpen(true);
    };

    const openEditModal = (service: Service) => {
        setEditingService(service);
        setName(service.name);
        setSlug(service.slug);
        setDescription(service.description || '');
        setSandboxUrl(service.sandbox_base_url);
        setProductionUrl(service.production_base_url);
        setTimeoutVal(service.timeout.toString());
        setMaxRetries(service.max_retries.toString());
        setIsActive(service.is_active);
        setSandboxCredentials(service.credentials?.sandbox || {});
        setProductionCredentials(service.credentials?.production || {});
        setIsEditOpen(true);
    };

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name,
                    slug,
                    description,
                    sandbox_base_url: sandboxUrl,
                    production_base_url: productionUrl,
                    timeout: parseInt(timeout),
                    max_retries: parseInt(maxRetries),
                    is_active: isActive,
                    credentials: {
                        sandbox: sandboxCredentials,
                        production: productionCredentials,
                    },
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create service');
            }

            toast.success('Service configured successfully');
            setIsCreateOpen(false);
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingService) return;
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/services/${editingService.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name,
                    slug,
                    description,
                    sandbox_base_url: sandboxUrl,
                    production_base_url: productionUrl,
                    timeout: parseInt(timeout),
                    max_retries: parseInt(maxRetries),
                    is_active: isActive,
                    credentials: {
                        sandbox: sandboxCredentials,
                        production: productionCredentials,
                    },
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update service');
            }

            toast.success('Service configuration updated');
            setIsEditOpen(false);
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteService = async (id: number) => {
        if (
            !confirm(
                'Are you sure you want to delete this service configuration? All subscriptions and logs will remain, but clients will not be able to routing API calls.',
            )
        ) {
            return;
        }

        try {
            const response = await fetch(`/api/services/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete service');
            }

            toast.success('Service removed successfully');
            router.reload();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const currentSchema = schemas[slug];

    return (
        <div className="space-y-6 p-6">
            <Head title="Services Configuration" />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        API Service Providers
                    </h1>
                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                        Configure timeouts, retries, sandbox, and production
                        endpoints for external APIs.
                    </p>
                </div>
                <Button
                    onClick={openCreateModal}
                    className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground md:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    Configure Service
                </Button>
            </div>

            {services.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-20 text-center dark:border-neutral-700 dark:bg-neutral-900/10">
                    <Cloud className="mx-auto mb-3 h-12 w-12 stroke-1 text-neutral-400" />
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                        No Services Configured
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                        Add your first external service integration to start
                        using the API gateway.
                    </p>
                    <Button
                        onClick={openCreateModal}
                        className="mt-4"
                        variant="outline"
                    >
                        Add First Service
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {services.map((service) => (
                        <Card
                            key={service.id}
                            className="border border-neutral-200 shadow-sm transition-all duration-200 hover:shadow-md dark:border-neutral-800"
                        >
                            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg font-bold">
                                            {service.name}
                                        </CardTitle>
                                        <Badge
                                            variant={
                                                service.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {service.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-1 font-mono text-xs text-primary">
                                        Slug: {service.slug}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditModal(service)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                        onClick={() =>
                                            handleDeleteService(service.id)
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {service.description ||
                                        'No description provided.'}
                                </p>

                                <div className="space-y-2.5 border-t border-neutral-100 pt-3 text-xs dark:border-neutral-800">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                            <span className="w-16 shrink-0 text-neutral-500 dark:text-neutral-400">
                                                Sandbox:
                                            </span>
                                            <code
                                                className="truncate font-mono text-neutral-800 dark:text-neutral-300"
                                                title={service.sandbox_base_url}
                                            >
                                                {service.sandbox_base_url}
                                            </code>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            onClick={() =>
                                                handleCopy(
                                                    service.sandbox_base_url,
                                                )
                                            }
                                        >
                                            {copiedUrl ===
                                            service.sandbox_base_url ? (
                                                <Check className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <Copy className="h-3 w-3 text-neutral-400" />
                                            )}
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                            <span className="w-16 shrink-0 text-neutral-500 dark:text-neutral-400">
                                                Prod:
                                            </span>
                                            <code
                                                className="truncate font-mono text-neutral-800 dark:text-neutral-300"
                                                title={
                                                    service.production_base_url
                                                }
                                            >
                                                {service.production_base_url}
                                            </code>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            onClick={() =>
                                                handleCopy(
                                                    service.production_base_url,
                                                )
                                            }
                                        >
                                            {copiedUrl ===
                                            service.production_base_url ? (
                                                <Check className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <Copy className="h-3 w-3 text-neutral-400" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Webhook URLs */}
                                    {service.webhookUrls &&
                                        Object.keys(service.webhookUrls!)
                                            .length > 0 && (
                                            <div className="space-y-1.5 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
                                                <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                    Webhook Endpoints:
                                                </div>
                                                {Object.entries(
                                                    service.webhookUrls!,
                                                ).map(([event, url]) => (
                                                    <div
                                                        key={event}
                                                        className="flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <span
                                                                className="shrink-0 font-medium text-neutral-500 dark:text-neutral-400"
                                                                title={event}
                                                            >
                                                                {event}:
                                                            </span>
                                                            <code
                                                                className="truncate font-mono text-neutral-800 dark:text-neutral-300"
                                                                title={url}
                                                            >
                                                                {url}
                                                            </code>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 shrink-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                            onClick={() =>
                                                                handleCopy(url)
                                                            }
                                                        >
                                                            {copiedUrl ===
                                                            url ? (
                                                                <Check className="h-3 w-3 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-3 w-3 text-neutral-400" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                            <span>
                                                Timeout: {service.timeout}s
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RotateCcw className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                            <span>
                                                Retries: {service.max_retries}{' '}
                                                attempts
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal: Create Service */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleCreateService}>
                        <DialogHeader>
                            <DialogTitle>Configure API Service</DialogTitle>
                            <DialogDescription>
                                Add a new API provider integration to the
                                platform.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-1 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="name">Service Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="e.g. Weather Service"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="slug">Service Type</Label>
                                    <select
                                        id="slug"
                                        value={slug}
                                        onChange={(e) => {
                                            setSlug(e.target.value);
                                            setSandboxCredentials({});
                                            setProductionCredentials({});
                                        }}
                                        className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                                        required
                                    >
                                        <option value="">
                                            Select Service Type...
                                        </option>
                                        {Object.entries(schemas).map(
                                            ([s, schemaData]) => (
                                                <option key={s} value={s}>
                                                    {schemaData.name}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Brief description of the service APIs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sandbox">
                                    Sandbox Base URL
                                </Label>
                                <Input
                                    id="sandbox"
                                    value={sandboxUrl}
                                    onChange={(e) =>
                                        setSandboxUrl(e.target.value)
                                    }
                                    placeholder="https://sandbox.api.example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="production">
                                    Production Base URL
                                </Label>
                                <Input
                                    id="production"
                                    value={productionUrl}
                                    onChange={(e) =>
                                        setProductionUrl(e.target.value)
                                    }
                                    placeholder="https://api.example.com"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="timeout">
                                        Timeout (seconds)
                                    </Label>
                                    <Input
                                        id="timeout"
                                        type="number"
                                        value={timeout}
                                        onChange={(e) =>
                                            setTimeoutVal(e.target.value)
                                        }
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="retries">Max Retries</Label>
                                    <Input
                                        id="retries"
                                        type="number"
                                        value={maxRetries}
                                        onChange={(e) =>
                                            setMaxRetries(e.target.value)
                                        }
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col justify-end space-y-1 pb-1">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="is_active"
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={(e) =>
                                                setIsActive(e.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label
                                            htmlFor="is_active"
                                            className="cursor-pointer"
                                        >
                                            Active
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Credentials Fields */}
                            {currentSchema &&
                                currentSchema.level !== 'subscription' &&
                                Object.keys(currentSchema.fields).length >
                                    0 && (
                                    <div className="space-y-4 pt-2">
                                        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                            <h4 className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-500">
                                                <Shield className="h-3.5 w-3.5" />
                                                Sandbox Credentials Setup
                                            </h4>
                                            {Object.entries(
                                                currentSchema.fields,
                                            ).map(([fieldKey, label]) => (
                                                <div
                                                    key={fieldKey}
                                                    className="space-y-1"
                                                >
                                                    <Label
                                                        htmlFor={`sandbox-cred-${fieldKey}`}
                                                    >
                                                        {label}
                                                    </Label>
                                                    <Input
                                                        id={`sandbox-cred-${fieldKey}`}
                                                        type="password"
                                                        value={
                                                            sandboxCredentials[
                                                                fieldKey
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            setSandboxCredentials(
                                                                {
                                                                    ...sandboxCredentials,
                                                                    [fieldKey]:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder={`Enter Sandbox ${label}`}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                            <h4 className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-500">
                                                <Shield className="h-3.5 w-3.5" />
                                                Production Credentials Setup
                                            </h4>
                                            {Object.entries(
                                                currentSchema.fields,
                                            ).map(([fieldKey, label]) => (
                                                <div
                                                    key={fieldKey}
                                                    className="space-y-1"
                                                >
                                                    <Label
                                                        htmlFor={`prod-cred-${fieldKey}`}
                                                    >
                                                        {label}
                                                    </Label>
                                                    <Input
                                                        id={`prod-cred-${fieldKey}`}
                                                        type="password"
                                                        value={
                                                            productionCredentials[
                                                                fieldKey
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            setProductionCredentials(
                                                                {
                                                                    ...productionCredentials,
                                                                    [fieldKey]:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder={`Enter Production ${label}`}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Configuring...'
                                    : 'Configure Service'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Service */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleEditService}>
                        <DialogHeader>
                            <DialogTitle>
                                Edit Service Configuration
                            </DialogTitle>
                            <DialogDescription>
                                Modify settings for this service provider.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-1 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="edit-name">
                                        Service Name
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-slug">
                                        Slug (Registry Key)
                                    </Label>
                                    <Input
                                        id="edit-slug"
                                        value={slug}
                                        disabled
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-description">
                                    Description
                                </Label>
                                <Input
                                    id="edit-description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-sandbox">
                                    Sandbox Base URL
                                </Label>
                                <Input
                                    id="edit-sandbox"
                                    value={sandboxUrl}
                                    onChange={(e) =>
                                        setSandboxUrl(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-production">
                                    Production Base URL
                                </Label>
                                <Input
                                    id="edit-production"
                                    value={productionUrl}
                                    onChange={(e) =>
                                        setProductionUrl(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="edit-timeout">
                                        Timeout (seconds)
                                    </Label>
                                    <Input
                                        id="edit-timeout"
                                        type="number"
                                        value={timeout}
                                        onChange={(e) =>
                                            setTimeoutVal(e.target.value)
                                        }
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-retries">
                                        Max Retries
                                    </Label>
                                    <Input
                                        id="edit-retries"
                                        type="number"
                                        value={maxRetries}
                                        onChange={(e) =>
                                            setMaxRetries(e.target.value)
                                        }
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col justify-end space-y-1 pb-1">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="edit-is_active"
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={(e) =>
                                                setIsActive(e.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label
                                            htmlFor="edit-is_active"
                                            className="cursor-pointer"
                                        >
                                            Active
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Credentials Fields */}
                            {currentSchema &&
                                currentSchema.level !== 'subscription' &&
                                Object.keys(currentSchema.fields).length >
                                    0 && (
                                    <div className="space-y-4 pt-2">
                                        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                            <h4 className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-500">
                                                <Shield className="h-3.5 w-3.5" />
                                                Update Sandbox Credentials
                                            </h4>
                                            {Object.entries(
                                                currentSchema.fields,
                                            ).map(([fieldKey, label]) => (
                                                <div
                                                    key={fieldKey}
                                                    className="space-y-1"
                                                >
                                                    <Label
                                                        htmlFor={`edit-sandbox-cred-${fieldKey}`}
                                                    >
                                                        {label}
                                                    </Label>
                                                    <Input
                                                        id={`edit-sandbox-cred-${fieldKey}`}
                                                        type="password"
                                                        value={
                                                            sandboxCredentials[
                                                                fieldKey
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            setSandboxCredentials(
                                                                {
                                                                    ...sandboxCredentials,
                                                                    [fieldKey]:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder={`Enter new Sandbox ${label}`}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                            <h4 className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-500">
                                                <Shield className="h-3.5 w-3.5" />
                                                Update Production Credentials
                                            </h4>
                                            {Object.entries(
                                                currentSchema.fields,
                                            ).map(([fieldKey, label]) => (
                                                <div
                                                    key={fieldKey}
                                                    className="space-y-1"
                                                >
                                                    <Label
                                                        htmlFor={`edit-prod-cred-${fieldKey}`}
                                                    >
                                                        {label}
                                                    </Label>
                                                    <Input
                                                        id={`edit-prod-cred-${fieldKey}`}
                                                        type="password"
                                                        value={
                                                            productionCredentials[
                                                                fieldKey
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            setProductionCredentials(
                                                                {
                                                                    ...productionCredentials,
                                                                    [fieldKey]:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder={`Enter new Production ${label}`}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Saving...'
                                    : 'Save Configuration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
