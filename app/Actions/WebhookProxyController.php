<?php

namespace App\Actions;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
class WebhookProxyController
{
    public static function forward(Request $request)
    {
        $target = 'https://webhook.site/148c9953-376c-4253-9ed2-1e6506f963ab';

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
