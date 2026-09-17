<?php

namespace App\Console\Commands;

use App\Services\BcraDebtSyncService;
use Illuminate\Console\Command;

class BcraSyncDebtsCommand extends Command
{
    protected $signature   = 'bcra:sync-debts';
    protected $description = 'Sincroniza la deuda bancaria histórica del CUIT configurado contra el BCRA';

    public function handle(): int
    {
        $this->info('Iniciando sincronización de deudas bancarias (BCRA)...');

        try {
            $report = (new BcraDebtSyncService())->run();

            if ($report === null) {
                $this->warn('No hay CUIT configurado en Configuración → Banco Central. Nada para hacer.');
                return 0;
            }

            $this->info("CUIT consultado: {$report['identifier']}");
            $this->info("Períodos recibidos: {$report['periods']}");
            $this->info("Filas recibidas: {$report['rows_seen']}");
            $this->info("Filas nuevas: {$report['rows_inserted']}");
            $this->info('Sincronización finalizada. Se ha enviado el reporte por email.');

            return 0;
        } catch (\Throwable $e) {
            $this->error('Error en la sincronización: ' . $e->getMessage());
            return 1;
        }
    }
}
