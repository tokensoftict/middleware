<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

#[Signature('app:process-jobs-in-the-queue')]
#[Description('Command description')]
class ProcessJobsInTheQueue extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        Artisan::call('queue:work', [
            '--stop-when-empty' => true,
            '--quiet' => true,
            '--timeout' => 0
        ]);
    }
}
