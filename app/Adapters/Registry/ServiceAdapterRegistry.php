<?php

namespace App\Adapters\Registry;

use App\Adapters\Contracts\ServiceAdapterInterface;
use App\Models\Service;
use Exception;
use Illuminate\Contracts\Container\Container;

class ServiceAdapterRegistry
{
    protected array $registry = [];

    public function __construct(protected Container $container) {}

    /**
     * Register a service slug mapping to an adapter class.
     */
    public function register(string $slug, string $adapterClass): void
    {
        $this->registry[$slug] = $adapterClass;
    }

    /**
     * Resolve the adapter instance for a service.
     */
    public function resolve(Service $service): ServiceAdapterInterface
    {
        $slug = $service->slug;

        if (! isset($this->registry[$slug])) {
            throw new Exception("No adapter registered for service: {$slug}");
        }

        $adapterClass = $this->registry[$slug];
        $adapter = $this->container->make($adapterClass);

        if (! $adapter instanceof ServiceAdapterInterface) {
            throw new Exception("Adapter [{$adapterClass}] does not implement ServiceAdapterInterface");
        }

        return $adapter->setService($service);
    }

    /**
     * Get all registered service slugs and their adapter classes.
     */
    public function getRegistry(): array
    {
        return $this->registry;
    }
}

