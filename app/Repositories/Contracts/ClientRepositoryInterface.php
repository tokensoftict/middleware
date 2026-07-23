<?php

namespace App\Repositories\Contracts;

use App\Models\Client;
use Illuminate\Database\Eloquent\Collection;

interface ClientRepositoryInterface
{
    public function all(): Collection;

    public function find(int $id): ?Client;

    public function findByEmail(string $email): ?Client;

    public function create(array $data): Client;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;
}
