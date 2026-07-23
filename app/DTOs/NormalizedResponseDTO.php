<?php

namespace App\DTOs;

class NormalizedResponseDTO
{
    public function __construct(
        public int $statusCode,
        public mixed $content,
        public array $headers = [],
        public ?string $error = null
    ) {}


    public function isSuccessful(): bool
    {
        return $this->statusCode >= 200 && $this->statusCode < 300;
    }
}
