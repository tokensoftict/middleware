<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Inertia\Inertia;
use Inertia\Response;

class ServiceViewController extends Controller
{

    public function index(): Response
    {
        return Inertia::render('services/index', [
            'services' => Service::all(),
        ]);
    }
}
