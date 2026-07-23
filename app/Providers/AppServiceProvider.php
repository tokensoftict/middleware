<?php

namespace App\Providers;

use App\Adapters\Mock\CorvynAdapter;
use App\Adapters\Mock\UpperLinkNotificationAdapter;
use App\Adapters\Registry\ServiceAdapterRegistry;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\GatewayLogRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use App\Repositories\Contracts\WebhookDeliveryRepositoryInterface;
use App\Repositories\Contracts\WebhookEventRepositoryInterface;
use App\Repositories\Eloquent\ClientRepository;
use App\Repositories\Eloquent\GatewayLogRepository;
use App\Repositories\Eloquent\ServiceRepository;
use App\Repositories\Eloquent\SubscriptionRepository;
use App\Repositories\Eloquent\WebhookDeliveryRepository;
use App\Repositories\Eloquent\WebhookEventRepository;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            ClientRepositoryInterface::class,
            ClientRepository::class
        );
        $this->app->bind(
            ServiceRepositoryInterface::class,
            ServiceRepository::class
        );
        $this->app->bind(
            SubscriptionRepositoryInterface::class,
            SubscriptionRepository::class
        );
        $this->app->bind(
            GatewayLogRepositoryInterface::class,
            GatewayLogRepository::class
        );
        $this->app->bind(
            WebhookEventRepositoryInterface::class,
            WebhookEventRepository::class
        );
        $this->app->bind(
            WebhookDeliveryRepositoryInterface::class,
            WebhookDeliveryRepository::class
        );

        $this->app->singleton(ServiceAdapterRegistry::class, function ($app) {
            $registry = new ServiceAdapterRegistry($app);
            $registry->register(CorvynAdapter::$slug, CorvynAdapter::class);
            $registry->register(UpperLinkNotificationAdapter::$slug, UpperLinkNotificationAdapter::class);

            return $registry;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
