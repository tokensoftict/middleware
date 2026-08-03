<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:process-jobs-in-the-queue')->timezone('Africa/Lagos')->everyMinute()->withoutOverlapping();  // to run emails jobs
