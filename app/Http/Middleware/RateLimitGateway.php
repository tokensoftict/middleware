<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class RateLimitGateway
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $clientApiKey = $request->attributes->get('client_api_key');

        if (! $clientApiKey) {
            return $next($request);
        }

        // Key by the client API key ID
        $key = 'gateway_limiter:'.$clientApiKey->id;
        $maxAttempts = $clientApiKey->rate_limit ?? 60;

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'error' => 'Too Many Requests.',
                'retry_after' => $seconds,
            ], 429)->withHeaders(['Retry-After' => $seconds, 'X-RateLimit-Limit' => $maxAttempts, 'X-RateLimit-Remaining' => 0,]);
        }

        RateLimiter::hit($key, 60);

        $response = $next($request);

        $remaining = RateLimiter::remaining($key, $maxAttempts);
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $remaining,
        ]);

        return $response;
    }
}
