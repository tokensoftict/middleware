<?php

namespace App\Http\Controllers\Api;

use App\Adapters\Registry\ServiceAdapterRegistry;
use App\Http\Controllers\Controller;
use App\Models\ClientApiKey;
use App\Models\Service;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use App\Services\Subscription\SubscriptionService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService,
        protected SubscriptionRepositoryInterface $subscriptionRepo
    ) {}

    public function index(int $clientId): JsonResponse
    {
        return response()->json($this->subscriptionRepo->getClientSubscriptions($clientId));
    }

    public function store(Request $request, int $clientId): JsonResponse
    {

        $registry = app(ServiceAdapterRegistry::class);
        $service = Service::find($request->input('service_id'));
        $adapterClass = $service ? ($registry->getRegistry()[$service->slug] ?? null) : null;

        $baseRules = [
            'service_id' => 'required|integer|exists:services,id',
            'name' => 'nullable|string|max:255',
            'rate_limit' => 'nullable|integer|min:1',
            'permissions' => 'nullable|array',
            'environment' => 'nullable|string|in:sandbox,production',
            'credentials' => 'nullable|array',
        ];

        $adapterRules = $adapterClass ? $adapterClass::getSubscriptionValidationRules() : [];

        $validated = $request->validate(array_merge($baseRules, $adapterRules));

        if ($adapterClass) {
            $level = $adapterClass::credentialsLevel();

            if ($level === 'subscription') {
                $schema = $adapterClass::getCredentialSchema();
                $credentialRules = [];
                foreach (array_keys($schema) as $field) {
                    $credentialRules["sandbox.{$field}"] = 'required|string';
                    $credentialRules["production.{$field}"] = 'required|string';
                }
                $credValidator = validator($validated['credentials'] ?? [], $credentialRules);
                if ($credValidator->fails()) {
                    return response()->json([
                        'message' => 'The given data was invalid.',
                        'errors' => ['credentials' => $credValidator->errors()->all()],
                    ], 422);
                }
            }

            if ($level === 'mixed') {
                $subFields = array_intersect_key(
                    $validated,
                    $adapterClass::getSubscriptionValidationRules()
                );

                $extraCreds = array_filter(
                    $subFields,
                    static fn ($key) => $key !== 'webhook_url',
                    ARRAY_FILTER_USE_KEY
                );

                if (! empty($extraCreds)) {
                    $validated['credentials'] = array_merge(
                        $validated['credentials'] ?? [],
                        ['subscription' => $extraCreds]
                    );
                }
            }
        }

        try {
            $credentials = $this->subscriptionService->subscribe(
                clientId: $clientId,
                serviceId: $validated['service_id'],
                data: $validated
            );

            return response()->json([
                'message' => 'Successfully subscribed to service.',
                'api_key' => $credentials['api_key'],
                'api_secret' => $credentials['api_secret'],
                'expires_at' => $credentials['expires_at'],
            ], 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:active,suspended,blocked',
            'environment' => 'sometimes|string|in:sandbox,production',
            'rate_limit' => 'sometimes|integer|min:1',
        ]);

        $key = ClientApiKey::find($id);

        if (! $key) {
            return response()->json(['error' => 'Subscription credentials not found'], 404);
        }

        $key->update($validated);

        return response()->json($key);
    }
}
