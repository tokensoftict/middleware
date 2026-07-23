<?php

use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\GatewayController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Middleware\AuthenticateGateway;
use App\Http\Middleware\RateLimitGateway;
use Illuminate\Support\Facades\Route;

Route::apiResource('clients', ClientController::class);

Route::get('services/schemas', [ServiceController::class, 'schemas']);
Route::apiResource('services', ServiceController::class);

Route::post('clients/{client_id}/subscriptions', [SubscriptionController::class, 'store']);
Route::get('clients/{client_id}/subscriptions', [SubscriptionController::class, 'index']);
Route::patch('subscriptions/{id}', [SubscriptionController::class, 'update']);

Route::get('logs', [LogController::class, 'index']);

Route::match(['get', 'post'], 'webhook/{serviceSlug}/{service_uuid}', [WebhookController::class, 'handle'])->name('webhook.handle');
Route::match(['get', 'post'], 'webhook/{serviceSlug}/{service_uuid}/{eventType}', [WebhookController::class, 'handle'])->name('webhook.handle.typed');

// API Gateway Proxy routes
Route::any('gateway/{service_slug}/{subPath?}', [GatewayController::class, 'proxy'])->where('subPath', '.*')->middleware([AuthenticateGateway::class, RateLimitGateway::class]);
