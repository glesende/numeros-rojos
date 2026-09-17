<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Laravel\Lumen\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        Commands\BcraSyncDebtsCommand::class,
        Commands\BcraSyncChecksCommand::class,
        Commands\BcraSyncQuotesCommand::class,
        Commands\ExportCsvCommand::class,
        Commands\MonitorXAccountsCommand::class,
        Commands\WarmCacheCommand::class,
    ];

    protected function schedule(Schedule $schedule): void
    {
        //$schedule->command('twitter:monitor --dry-run')
        //    ->dailyAt('08:10')
        //    ->appendOutputTo(storage_path('logs/twitter-monitor.log'));

        $schedule->command('bcra:sync-debts')
            ->monthlyOn(1, '03:00')
            ->appendOutputTo(storage_path('logs/bcra-debts.log'));

        $schedule->command('bcra:sync-checks')
            ->monthlyOn(1, '03:10')
            ->appendOutputTo(storage_path('logs/bcra-checks.log'));

        $schedule->command('bcra:sync-quotes')
            ->weeklyOn(1, '04:00')
            ->appendOutputTo(storage_path('logs/bcra-quotes.log'));
    }
}
