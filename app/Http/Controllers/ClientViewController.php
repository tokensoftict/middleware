<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Service;
use Inertia\Inertia;
use Inertia\Response;

class ClientViewController extends Controller
{

    public function index(): Response
    {
        return Inertia::render('clients/index', [
            'clients' => Client::with('client_api_keys.service')->get(),
            'services' => Service::all(),
        ]);
    }
}
