<?php

namespace App\Actions;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
class WebhookProxyController
{
    public static function forward(Request $request, string $target)
    {

        if ($request->getQueryString()) {
            $target .= '?' . $request->getQueryString();
        }

        $response = Http::withHeaders(
            collect($request->headers->all())
                ->except(['host', 'content-length'])
                ->map(fn ($value) => is_array($value) ? implode(', ', $value) : $value)
                ->toArray()
        )
            ->withBody(
                $request->getContent(),
                $request->header('Content-Type', 'application/octet-stream')
            )
            ->send($request->method(), $target);

        return response($response->body(), $response->status())
            ->withHeaders(
                collect($response->headers())
                    ->map(fn ($value) => is_array($value) ? implode(', ', $value) : $value)
                    ->toArray()
            );
    }
}
