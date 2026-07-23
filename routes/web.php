<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClientViewController;
use App\Http\Controllers\ServiceViewController;
use App\Http\Controllers\GatewayLogViewController;

use App\Http\Controllers\DashboardController;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('clients', [ClientViewController::class, 'index'])->name('clients.index');
    Route::get('services-config', [ServiceViewController::class, 'index'])->name('services.index');
    Route::get('gateway-logs', [GatewayLogViewController::class, 'index'])->name('logs.index');
});

require __DIR__.'/settings.php';
