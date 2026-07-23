<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(
        protected ClientRepositoryInterface $clientRepo
    ) {}

    public function index(): JsonResponse
    {
        return response()->json($this->clientRepo->all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'required|email|unique:clients,contact_email',
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:150',
            'rate_limit' => 'integer|min:1',
            'status' => 'string|in:active,suspended,blocked',
        ]);

        $client = $this->clientRepo->create($validated);

        return response()->json($client, 201);
    }

    public function show(int $id): JsonResponse
    {
        $client = $this->clientRepo->find($id);
        if (! $client) {
            return response()->json(['error' => 'Client not found'], 404);
        }

        return response()->json($client);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'sometimes|email|unique:clients,contact_email,'.$id,
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:150',
            'rate_limit' => 'integer|min:1',
            'status' => 'string|in:active,suspended,blocked',
        ]);

        $updated = $this->clientRepo->update($id, $validated);
        if (! $updated) {
            return response()->json(['error' => 'Client not found or update failed'], 404);
        }

        return response()->json($this->clientRepo->find($id));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->clientRepo->delete($id);
        if (! $deleted) {
            return response()->json(['error' => 'Client not found'], 404);
        }

        return response()->json(['message' => 'Client deleted successfully']);
    }
}
