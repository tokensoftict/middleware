<?php

namespace App\Http\Controllers\Api;

use App\Adapters\Registry\ServiceAdapterRegistry;
use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function __construct(
        protected ServiceRepositoryInterface $serviceRepo,
        protected ServiceAdapterRegistry $registry
    ) {}

    public function index(): JsonResponse
    {
        return response()->json($this->serviceRepo->all());
    }

    public function schemas(): JsonResponse
    {
        $schemas = [];
        foreach ($this->registry->getRegistry() as $slug => $adapterClass) {

            $schemas[$slug] = [
                'name' => $adapterClass::getName(),
                'level' => $adapterClass::credentialsLevel(),
                'fields' => $adapterClass::getCredentialSchema(),
                'subscription_fields' => $adapterClass::getSubscriptionCredentialSchema(),
                'webhookUrls' => []//$adapterClass::getSupportedWebhookUrls(),
            ];
        }

        return response()->json($schemas);
    }

    public function store(Request $request): JsonResponse
    {
        $registrySlugs = array_keys($this->registry->getRegistry());

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:services,slug|max:255|in:'.implode(',', $registrySlugs),
            'description' => 'nullable|string',
            'sandbox_base_url' => 'required|url',
            'production_base_url' => 'required|url',
            'timeout' => 'integer|min:1|max:300',
            'max_retries' => 'integer|min:0|max:10',
            'is_active' => 'boolean',
            'credentials' => 'nullable|array',
        ]);

        if (! empty($validated['slug'])) {
            $adapterClass = $this->registry->getRegistry()[$validated['slug']] ?? null;
            if ($adapterClass && $adapterClass::credentialsLevel() !== 'subscription' && isset($validated['credentials'])) {
                $schema = $adapterClass::getCredentialSchema();
                $credentialRules = [];
                foreach (array_keys($schema) as $field) {
                    $credentialRules["sandbox.{$field}"] = 'required|string';
                    $credentialRules["production.{$field}"] = 'required|string';
                }

                $validator = validator($validated['credentials'], $credentialRules);
                if ($validator->fails()) {
                    return response()->json([
                        'message' => 'The given data was invalid.',
                        'errors' => ['credentials' => $validator->errors()->all()],
                    ], 422);
                }
            }
        }

        $validated['uuid'] = Str::lower(Str::random(5));

        $service = $this->serviceRepo->create($validated);

        return response()->json($service, 201);
    }

    public function show(int $id): JsonResponse
    {
        $service = $this->serviceRepo->find($id);

        if (! $service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        return response()->json($service);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $service = $this->serviceRepo->find($id);
        if (! $service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $registrySlugs = array_keys($this->registry->getRegistry());

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:services,slug,'.$id.'|in:'.implode(',', $registrySlugs),
            'description' => 'nullable|string',
            'sandbox_base_url' => 'sometimes|url',
            'production_base_url' => 'sometimes|url',
            'timeout' => 'integer|min:1|max:300',
            'max_retries' => 'integer|min:0|max:10',
            'is_active' => 'boolean',
            'credentials' => 'nullable|array',
        ]);

        $slug = $validated['slug'] ?? $service->slug;
        if (isset($validated['credentials'])) {
            $adapterClass = $this->registry->getRegistry()[$slug] ?? null;
            if ($adapterClass && $adapterClass::credentialsLevel() !== 'subscription') {
                $schema = $adapterClass::getCredentialSchema();
                $credentialRules = [];
                foreach (array_keys($schema) as $field) {
                    $credentialRules["sandbox.{$field}"] = 'required|string';
                    $credentialRules["production.{$field}"] = 'required|string';
                }

                $validator = validator($validated['credentials'], $credentialRules);
                if ($validator->fails()) {
                    return response()->json([
                        'message' => 'The given data was invalid.',
                        'errors' => ['credentials' => $validator->errors()->all()],
                    ], 422);
                }
            }
        }

        $updated = $this->serviceRepo->update($id, $validated);

        if (! $updated) {
            return response()->json(['error' => 'Service failed to update'], 404);
        }

        return response()->json($this->serviceRepo->find($id));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->serviceRepo->delete($id);

        if (! $deleted) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        return response()->json(['message' => 'Service deleted successfully']);
    }
}
