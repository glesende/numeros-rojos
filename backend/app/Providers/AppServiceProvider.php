<?php

namespace App\Providers;

use App\Support\RecordScheduledJobRun;
use Illuminate\Console\Events\CommandFinished;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\BeSoccerService::class, function ($app) {
            return new \App\Services\BeSoccerService();
        });
    }

    public function boot(): void
    {
        Event::listen([CommandStarting::class, CommandFinished::class], RecordScheduledJobRun::class);
    }
}
