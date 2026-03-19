<?php

namespace Database\Seeders;

use App\Models\EconomyRecord;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EconomyRecordSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Helper para obtener el primer día de un mes relativo al actual
        $month = fn(int $offset) => $now->copy()->startOfMonth()->addMonths($offset)->toDateString();
        // Helper para una fecha específica dentro de un mes relativo
        $date  = fn(int $offset, int $day) => $now->copy()->startOfMonth()->addMonths($offset)->setDay($day)->toDateString();

        $records = [
            // =====================================================================
            // PASADO (~2 años atrás hasta hoy)
            // =====================================================================

            // Hace ~24 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 280000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-24),
                'entity'            => 'Liga Profesional de Fútbol',
                'comments'          => 'Cuota correspondiente al Q3 2024',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 380000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-24, 28),
                'entity'            => 'Plantel profesional',
                'comments'          => 'Salarios de enero 2024',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta de Lucas González al Udinese (IT) - cuota final',
                'type'             => 'cobro',
                'amount'            => 2000000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-23, 10),
                'entity'            => 'Udinese Calcio',
                'comments'          => 'Cuota final del pase',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 385000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-23, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~21 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 310000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-21),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio Quilmes - Temporada',
                'type'             => 'cobro',
                'amount'            => 1200000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-21, 5),
                'entity'            => 'Quilmes',
                'comments'          => 'Patrocinio principal de camiseta',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta de Jonatan Báez al Cruz Azul (MX)',
                'type'             => 'cobro',
                'amount'            => 3500000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-20, 5),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Compra de Alan Soñora (Unión de Santa Fe)',
                'type'             => 'pago',
                'amount'            => 800000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-20, 15),
                'entity'            => 'Unión de Santa Fe',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 410000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-20, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~18 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 340000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-18),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación partido vs San Lorenzo - Liga Profesional',
                'type'             => 'cobro',
                'amount'            => 72000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-17, 14),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Multa AFA por incidentes en clásico',
                'type'             => 'pago',
                'amount'            => 18000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-17, 20),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 430000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-17, 28),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Mantenimiento y obras estadio Libertadores de América',
                'type'             => 'pago',
                'amount'            => 250000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-16, 15),
                'links'            => json_encode([]),
            ],

            // Hace ~15 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 320000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-15),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta de Leandro Fernández al Toluca (MX)',
                'type'             => 'cobro',
                'amount'            => 4500000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-14, 15),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Compra de Kevin Lomónaco',
                'type'             => 'pago',
                'amount'            => 1200000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-13, 10),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio principal Puma - Temporada',
                'type'             => 'cobro',
                'amount'            => 1800000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-13, 1),
                'entity'            => 'Puma',
                'comments'          => 'Contrato de indumentaria y patrocinio',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 620000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-1, 28),
                'links'            => json_encode([]),
            ],

            // =====================================================================
            // FUTURO (~1 mes adelante hasta +24 meses)
            // =====================================================================

            // Próximo mes
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 450000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(1),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 650000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(1, 28),
                'links'            => json_encode([]),
            ],

            // +2 meses
            [
                'description'      => 'Recaudación partido vs Racing - Clásico de Avellaneda (proyectado)',
                'type'             => 'cobro',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(2, 9),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 660000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(2, 28),
                'links'            => json_encode([]),
            ],

            // +3 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 460000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(3),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Deuda con AFIP - Plan de pagos cuota (proyectado)',
                'type'             => 'pago',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(3, 10),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 670000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(3, 28),
                'links'            => json_encode([]),
            ],

            // +4 meses
            [
                'description'      => 'Patrocinio principal Puma - renovación anual (proyectado)',
                'type'             => 'cobro',
                'amount'            => 2000000.00,
                'currency'           => 'USD',
                'record_date'            => $date(4, 1),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 680000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(4, 28),
                'links'            => json_encode([]),
            ],

            // +5 meses
            [
                'description'      => 'Recaudación Copa de la Liga - Semifinal (proyectado)',
                'type'             => 'cobro',
                'amount'            => 90000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(5, 15),
                'links'            => json_encode([]),
            ],
        ];

        foreach ($records as $record) {
            EconomyRecord::create($record);
        }
    }
}
