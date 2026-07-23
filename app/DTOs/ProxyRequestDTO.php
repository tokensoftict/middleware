<?php

namespace App\DTOs;

use Illuminate\Http\Request;

class ProxyRequestDTO
{
    public function __construct(
        public string $path,
        public string $method,
        public array $payload = [],
        public array $queryParams = [],
        public array $headers = []
    ) {}


    public static function fromRequest(Request $request, string $subPath): self
    {
        return new self(
            path: $subPath,
            method: $request->method(),
            payload: $request->all(),
            queryParams: $request->query(),
            headers: collect($request->headers->all())->map(fn ($v) => $v[0] ?? '')->toArray()
        );
    }
}
