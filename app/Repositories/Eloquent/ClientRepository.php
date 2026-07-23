<?php

namespace App\Repositories\Eloquent;

use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ClientRepository implements ClientRepositoryInterface
{
    public function all(): Collection
    {
        return Client::all();
    }

    public function find(int $id): ?Client
    {
        return Client::find($id);
    }

    public function findByEmail(string $email): ?Client
    {
        return Client::where('contact_email', $email)->first();
    }

    public function create(array $data): Client
    {
        return Client::create($data);
    }

    public function update(int $id, array $data): bool
    {
        $client = $this->find($id);

        return $client ? $client->update($data) : false;
    }

    public function delete(int $id): bool
    {
        $client = $this->find($id);

        return $client ? $client->delete() : false;
    }
}
