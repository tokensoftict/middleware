<?php

namespace App\Repositories\Contracts;

use App\Models\Service;
use Illuminate\Database\Eloquent\Collection;

interface ServiceRepositoryInterface
{
    public function all(): Collection;

    public function find(int $id): ?Service;

    public function findBySlug(string $slug): ?Service;

    public function findByUuid(string $uuid): ?Service;

    public function create(array $data): Service;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;
}
