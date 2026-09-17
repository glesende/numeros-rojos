<?php

namespace App\Console\Commands;

use App\Services\BcraQuoteSyncService;
use Illuminate\Console\Command;

class BcraSyncQuotesCommand extends Command
{
    protected $signature   = 'bcra:sync-quotes';
    protected $description = 'Sincroniza la cotización histórica del dólar contra el BCRA (desde la última guardada hasta hoy)';

    public function handle(): int
    {
        $this->info('Iniciando sincronización de cotizaciones USD (BCRA)...');

        try {
            $report = (new BcraQuoteSyncService())->run();

            if ($report['from'] === null) {
                $this->info('Ya está al día, no hay fechas nuevas para consultar.');
                return 0;
            }

            $this->info("Rango consultado: {$report['from']} a {$report['to']}");
            $this->info("Cotizaciones recibidas: {$report['fetched']}");
            $this->info("Nuevas: {$report['inserted']} · Actualizadas: {$report['updated']}");

            return 0;
        } catch (\Throwable $e) {
            $this->error('Error en la sincronización: ' . $e->getMessage());
            return 1;
        }
    }
}
