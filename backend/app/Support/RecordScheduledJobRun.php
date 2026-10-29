<?php

namespace App\Support;

use App\Models\ScheduledJobRun;
use Illuminate\Console\Events\CommandFinished;
use Illuminate\Console\Events\CommandStarting;

/**
 * Registra en scheduled_job_runs cada ejecución de los comandos `bcra:sync-*` (inicio, fin y código de salida).
 * Es el latido que `updated_at` de las tablas de datos no da: una sync sin datos nuevos igual deja constancia.
 * Vive fuera de app/Listeners a propósito: Laravel descubre esa carpeta solo y el listener quedaría registrado dos veces.
 * Un fallo al registrar nunca debe romper el comando que se está midiendo.
 */
class RecordScheduledJobRun
{
    private const PREFIX = 'bcra:sync-';

    /** @var array<string,int> id de la fila abierta por comando, dentro de este proceso */
    private static array $open = [];

    public function handle(CommandStarting|CommandFinished $event): void
    {
        $command = $event->command;
        if ($command === null || !str_starts_with($command, self::PREFIX)) {
            return;
        }

        try {
            if ($event instanceof CommandStarting) {
                self::$open[$command] = ScheduledJobRun::create([
                    'command'    => $command,
                    'status'     => 'running',
                    'started_at' => now(),
                ])->id;
                return;
            }

            $id = self::$open[$command] ?? null;
            unset(self::$open[$command]);
            if ($id === null) {
                return;
            }

            ScheduledJobRun::whereKey($id)->update([
                'status'      => $event->exitCode === 0 ? 'success' : 'failed',
                'finished_at' => now(),
                'exit_code'   => $event->exitCode,
            ]);
        } catch (\Throwable $e) {
            error_log('No se pudo registrar el latido de ' . $command . ': ' . $e->getMessage());
        }
    }
}
