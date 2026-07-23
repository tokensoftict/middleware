<?php

namespace App\Http\Controllers\Api;

use App\DTOs\ProxyRequestDTO;
use App\Http\Controllers\Controller;
use App\Services\Gateway\GatewayService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GatewayController extends Controller
{
    public function __construct(
        protected GatewayService $gatewayService
    ) {}


    public function proxy(Request $request, string $serviceSlug, ?string $subPath = '/'): JsonResponse
    {
        $clientApiKey = $request->attributes->get('client_api_key');

        if (! $clientApiKey) {
            return response()->json(['error' => 'Gateway authentication required'], 401);
        }

        // Construct DTO
        $proxyRequest = ProxyRequestDTO::fromRequest($request, $subPath ?? '/');

        try {
            $normalizedResponse = $this->gatewayService->proxy($clientApiKey, $serviceSlug, $proxyRequest);

            return response()->json($normalizedResponse->content, $normalizedResponse->statusCode, $normalizedResponse->headers);

        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;

            return response()->json(['error' => $e->getMessage()], $code);
        }
    }
}
