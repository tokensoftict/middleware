<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Client::updateOrCreate(
            ['contact_email' => 'tech-partner@acme.org'],
            [
                'name' => 'Acme Corporation',
                'contact_name' => 'John Acme',
                'phone' => '+1 (555) 019-2834',
                'description' => 'Primary enterprise tenant client.',
                'status' => 'active',
                'rate_limit' => 100,
            ]
        );
    }
}
