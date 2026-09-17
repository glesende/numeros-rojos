<?php

namespace App\Console\Commands;

use App\Services\BcraCheckSyncService;
use Illuminate\Console\Command;

class BcraSyncChecksCommand extends Command
{
    protected $signature   = 'bcra:sync-checks';
    protected $description = 'Sincroniza los cheques rechazados del CUIT configurado contra el BCRA';

    public function handle(): int
    {
        $this->info('Iniciando sincronización de cheques rechazados (BCRA)...');

        try {
            $report = (new BcraCheckSyncService())->run();

            if ($report === null) {
                $this->warn('No hay CUIT configurado en Configuración → Banco Central. Nada para hacer.');
                return 0;
            }

            $this->info("CUIT consultado: {$report['identifier']}");
            $this->info("Causales recibidas: {$report['causes']}");
            $this->info("Cheques recibidos: {$report['rows_seen']}");
            $this->info("Cheques nuevos: {$report['rows_inserted']}");
            $this->info('Sincronización finalizada. Se ha enviado el reporte por email.');

            return 0;
        } catch (\Throwable $e) {
            $this->error('Error en la sincronización: ' . $e->getMessage());
            return 1;
        }
    }
}
