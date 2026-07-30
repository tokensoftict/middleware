<?php

namespace App\Http\Controllers\Api;

use App\Actions\WebhookProxyController;
use App\Http\Controllers\Controller;
use App\Services\Webhook\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        protected WebhookService $webhookService
    ) {}

    public function handle(Request $request, string $serviceSlug, string $service_uuid, ?string $eventType = null): JsonResponse
    {

        WebhookProxyController::forward($request, "https://webhook.site/a9ba3fc9-2be5-41b4-8306-51ac5f4bbf3a");

        return response()->json(['status' => 'ok'], 200);

        //        try {
        //            $this->webhookService->receive($request, $serviceSlug, $service_uuid, $eventType);
        //
        //            return response()->json(['status' => 'ok']);
        //        } catch (Exception $e) {
        //            $code = $e->getCode();
        //
        //            if ($code === 400) {
        //                return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 400);
        //            }
        //
        //            if (in_array($code, [404, 503], true)) {
        //                return response()->json(['status' => 'error', 'message' => $e->getMessage()], $code);
        //            }
        //
        //            Log::error('Webhook processing error', [
        //                'service' => $serviceSlug,
        //                'event_type' => $eventType,
        //                'error' => $e->getMessage(),
        //            ]);
        //
        //            return response()->json(['status' => 'ok']);
        //        }
    }
}
