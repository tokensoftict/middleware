<?php

namespace App\Http\Middleware;

use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateGateway
{
    public function __construct(
        protected SubscriptionRepositoryInterface $subscriptionRepo
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key');
        $apiSecret = $request->header('X-API-Secret');

        if (! $apiKey || ! $apiSecret) {
            return response()->json([
                'error' => 'Unauthorized. X-API-Key and X-API-Secret headers are required.',
            ], 401);
        }

        $clientApiKey = $this->subscriptionRepo->findByKey($apiKey);

        if (! $clientApiKey) {
            return response()->json([
                'error' => 'Unauthorized. Invalid API Key.',
            ], 401);
        }

        if ($clientApiKey->client && $clientApiKey->client->status !== 'active') {
            return response()->json([
                'error' => 'Unauthorized. Client account is '.$clientApiKey->client->status.'.',
            ], 401);
        }

        if ($clientApiKey->status !== 'active') {
            return response()->json([
                'error' => 'Unauthorized. API Key is '.$clientApiKey->status.'.',
            ], 401);
        }

        if ($clientApiKey->expires_at && $clientApiKey->expires_at->isPast()) {
            return response()->json([
                'error' => 'Unauthorized. API Key has expired.',
            ], 401);
        }

        if (! Hash::check($apiSecret, $clientApiKey->api_secret)) {
            return response()->json([
                'error' => 'Unauthorized. Invalid API Secret.',
            ], 401);
        }

        // Attach subscription/key metadata to the request attributes
        $request->attributes->set('client_api_key', $clientApiKey);

        // Update last used at timestamp asynchronously/after
        $clientApiKey->updateQuietly(['last_used_at' => now()]);

        return $next($request);
    }
}
