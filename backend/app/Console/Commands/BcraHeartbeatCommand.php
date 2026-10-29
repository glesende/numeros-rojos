<?php

namespace App\Console\Commands;

use App\Models\ScheduledJobRun;
use Illuminate\Console\Command;

/**
 * Imprime un número para el monitoreo de la oficina (una línea, sin texto extra).
 *   failed      -> cuántos comandos bcra:sync-* tienen una última ejecución fallida (alerta si > 0)
 *   stale-days  -> días desde la última ejecución exitosa más vieja entre bcra:sync-debts y bcra:sync-checks
 *                  (corren el día 1; alerta si > 33). Sin ninguna ejecución registrada todavía, 0.
 */
class BcraHeartbeatCommand extends Command
{
    protected $signature   = 'bcra:heartbeat {metric : failed | stale-days}';
    protected $description = 'Métrica del latido de las sincronizaciones BCRA (ver scheduled_job_runs)';

    private const MONTHLY = ['bcra:sync-debts', 'bcra:sync-checks'];

    public function handle(): int
    {
        return match ($this->argument('metric')) {
            'failed'     => $this->printValue($this->failedCount()),
            'stale-days' => $this->printValue($this->staleDays()),
            default      => $this->unknownMetric(),
        };
    }

    private function unknownMetric(): int
    {
        $this->error('Métrica desconocida: usar failed o stale-days');
        return 1;
    }

    private function printValue(int $value): int
    {
        $this->line((string) $value);
        return 0;
    }

    private function failedCount(): int
    {
        $failed = 0;
        $commands = ScheduledJobRun::where('command', 'like', 'bcra:sync-%')->distinct()->pluck('command');
        foreach ($commands as $command) {
            // Una ejecución en curso no cuenta: se mira la última ya terminada.
            $last = ScheduledJobRun::where('command', $command)->where('status', '!=', 'running')->orderByDesc('started_at')->first();
            if ($last && $last->status === 'failed') {
                $failed++;
            }
        }
        return $failed;
    }

    private function staleDays(): int
    {
        $baseline = ScheduledJobRun::min('created_at');
        if ($baseline === null) {
            return 0;
        }

        $days = 0;
        foreach (self::MONTHLY as $command) {
            $lastOk = ScheduledJobRun::where('command', $command)->where('status', 'success')->max('finished_at');
            $since  = \Carbon\Carbon::parse($lastOk ?? $baseline);
            $days   = max($days, (int) $since->diffInDays(now()));
        }
        return $days;
    }
}
