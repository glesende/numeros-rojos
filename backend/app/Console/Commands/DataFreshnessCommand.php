<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Imprime un número para el monitoreo de la oficina (una línea, sin texto extra):
 * días desde el último dato cargado o editado en la sección (max(updated_at) de su tabla principal).
 * Tabla vacía -> 0 (nunca hubo datos: no hay nada que envejecer). Umbrales en docs/operacion.md.
 */
class DataFreshnessCommand extends Command
{
    protected $signature   = 'data:freshness {section : balances | contracts | economy | market | rumors}';
    protected $description = 'Días desde el último dato cargado en una sección (métrica de datos desactualizados)';

    public const SECTIONS = [
        'balances'  => 'balances',
        'contracts' => 'contracts',
        'economy'   => 'economy_records',
        'market'    => 'markets',
        'rumors'    => 'rumors',
    ];

    public function handle(): int
    {
        $table = self::SECTIONS[$this->argument('section')] ?? null;
        if ($table === null) {
            $this->error('Sección desconocida: usar ' . implode(' | ', array_keys(self::SECTIONS)));
            return 1;
        }

        $last = DB::table($table)->max('updated_at');
        $this->line((string) ($last === null ? 0 : (int) Carbon::parse($last)->diffInDays(now())));
        return 0;
    }
}
