<?php

namespace App\Repositories\Eloquent;

use App\Models\Service;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ServiceRepository implements ServiceRepositoryInterface
{
    public function all(): Collection
    {
        return Service::all();
    }

    public function find(int $id): ?Service
    {
        return Service::find($id);
    }

    public function findBySlug(string $slug): ?Service
    {
        return Service::where('slug', $slug)->first();
    }

    public function findByUuid(string $slug): ?Service
    {
        return Service::where('uuid', $slug)->first();
    }

    public function create(array $data): Service
    {
        return Service::create($data);
    }

    public function update(int $id, array $data): bool
    {
        $service = $this->find($id);

        return $service ? $service->update($data) : false;
    }

    public function delete(int $id): bool
    {
        $service = $this->find($id);

        return $service ? $service->delete() : false;
    }
}
