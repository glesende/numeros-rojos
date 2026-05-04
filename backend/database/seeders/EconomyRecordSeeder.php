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

            // =====================================================================
            // PASADO ADICIONAL - llenar meses vacíos y agregar EUR
            // =====================================================================

            // Hace ~22 meses
            [
                'description'      => 'Solidarity payment UEFA - Lucas González (Udinese)',
                'type'             => 'cobro',
                'amount'            => 85000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-22, 12),
                'entity'            => 'UEFA',
                'comments'          => 'Mecanismo de solidaridad 5% del pase',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 390000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-22, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~19 meses
            [
                'description'      => 'Venta de Rodrigo Márquez al Olympique Lyon (FR)',
                'type'             => 'cobro',
                'amount'            => 3200000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-19, 8),
                'entity'            => 'Olympique Lyon',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 420000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-19, 28),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Agente representante - Comisión venta Lyon',
                'type'             => 'pago',
                'amount'            => 160000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-19, 15),
                'links'            => json_encode([]),
            ],

            // Hace ~16 meses (complemento)
            [
                'description'      => 'Compra de Pierre Dubois (Girona FC)',
                'type'             => 'pago',
                'amount'            => 1500000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-16, 20),
                'entity'            => 'Girona FC',
                'links'            => json_encode([]),
            ],

            // Hace ~12 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 490000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-12),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio Quilmes - Renovación anual',
                'type'             => 'cobro',
                'amount'            => 1400000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-12, 5),
                'entity'            => 'Quilmes',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Solidarity payment UEFA - Rodrigo Márquez (Lyon)',
                'type'             => 'cobro',
                'amount'            => 96000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-12, 10),
                'entity'            => 'UEFA',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 560000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-12, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~10 meses
            [
                'description'      => 'Recaudación partido vs Boca - Superclásico',
                'type'             => 'cobro',
                'amount'            => 180000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-10, 12),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Compra de Matías Suárez (Belgrano)',
                'type'             => 'pago',
                'amount'            => 950000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-10, 18),
                'entity'            => 'Belgrano',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 580000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-10, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~8 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 520000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-8),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta de Tomás Pozzo al Getafe CF (ES)',
                'type'             => 'cobro',
                'amount'            => 2800000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-8, 7),
                'entity'            => 'Getafe CF',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 590000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-8, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~6 meses
            [
                'description'      => 'Venta de Franco Acosta al LA Galaxy (USA)',
                'type'             => 'cobro',
                'amount'            => 1800000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-6, 5),
                'entity'            => 'LA Galaxy',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Agente representante - Comisión venta Getafe',
                'type'             => 'pago',
                'amount'            => 140000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-6, 10),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 600000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-6, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~5 meses
            [
                'description'      => 'Recaudación partido vs Estudiantes - Liga Profesional',
                'type'             => 'cobro',
                'amount'            => 95000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-5, 16),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 605000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-5, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~4 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 540000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-4),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio Puma - Cuota semestral',
                'type'             => 'cobro',
                'amount'            => 900000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-4, 3),
                'entity'            => 'Puma',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 610000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-4, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~3 meses
            [
                'description'      => 'Solidarity payment UEFA - Tomás Pozzo (Getafe)',
                'type'             => 'cobro',
                'amount'            => 84000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(-3, 8),
                'entity'            => 'UEFA',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 615000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-3, 28),
                'links'            => json_encode([]),
            ],

            // Hace ~2 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 560000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-2),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Compra de Ezequiel Barcos (Santos FC)',
                'type'             => 'pago',
                'amount'            => 1100000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-2, 12),
                'entity'            => 'Santos FC',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 618000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-2, 28),
                'links'            => json_encode([]),
            ],

            // Mes actual
            [
                'description'      => 'Recaudación partido vs Huracán - Liga Profesional',
                'type'             => 'cobro',
                'amount'            => 88000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(0, 10),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Cuota pase Ezequiel Barcos - primera cuota',
                'type'             => 'pago',
                'amount'            => 550000.00,
                'currency'           => 'USD',
                'record_date'            => $date(0, 15),
                'entity'            => 'Santos FC',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 625000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(0, 28),
                'links'            => json_encode([]),
            ],

            // =====================================================================
            // FUTURO ADICIONAL - +6 a +12 meses
            // =====================================================================

            // +6 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 470000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(6),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio Puma - Cuota semestral (proyectado)',
                'type'             => 'cobro',
                'amount'            => 950000.00,
                'currency'           => 'USD',
                'record_date'            => $date(6, 3),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 695000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(6, 28),
                'links'            => json_encode([]),
            ],

            // +7 meses
            [
                'description'      => 'Solidarity payment UEFA - Franco Acosta (LA Galaxy)',
                'type'             => 'cobro',
                'amount'            => 54000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(7, 5),
                'entity'            => 'UEFA',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación partido vs River - Clásico',
                'type'             => 'cobro',
                'amount'            => 140000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(7, 20),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 700000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(7, 28),
                'links'            => json_encode([]),
            ],

            // +8 meses - mes cargado (copa + derechos)
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 480000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(8),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Premio Copa Sudamericana - Fase de grupos (proyectado)',
                'type'             => 'cobro',
                'amount'            => 600000.00,
                'currency'           => 'USD',
                'record_date'            => $date(8, 10),
                'entity'            => 'CONMEBOL',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Deuda con AFIP - Plan de pagos cuota (proyectado)',
                'type'             => 'pago',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(8, 10),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 710000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(8, 28),
                'links'            => json_encode([]),
            ],

            // +9 meses
            [
                'description'      => 'Venta de Sebastián Méndez al Villarreal CF (ES) - proyectado',
                'type'             => 'cobro',
                'amount'            => 5500000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(9, 8),
                'entity'            => 'Villarreal CF',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio Quilmes - Renovación anual (proyectado)',
                'type'             => 'cobro',
                'amount'            => 1600000.00,
                'currency'           => 'USD',
                'record_date'            => $date(9, 5),
                'entity'            => 'Quilmes',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Agente representante - Comisión venta Villarreal',
                'type'             => 'pago',
                'amount'            => 275000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(9, 15),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 715000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(9, 28),
                'links'            => json_encode([]),
            ],

            // +10 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 490000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(10),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 720000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(10, 28),
                'links'            => json_encode([]),
            ],

            // +11 meses
            [
                'description'      => 'Recaudación partido vs San Lorenzo - Liga (proyectado)',
                'type'             => 'cobro',
                'amount'            => 100000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(11, 14),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Cuota pase Sebastián Méndez - segunda cuota',
                'type'             => 'pago',
                'amount'            => 1800000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(11, 10),
                'entity'            => 'Villarreal CF',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 725000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(11, 28),
                'links'            => json_encode([]),
            ],

            // +12 meses - mes pesado (gran compra + salarios + AFIP)
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 500000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(12),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Compra de Adrián Ruiz (Athletico Paranaense)',
                'type'             => 'pago',
                'amount'            => 3200000.00,
                'currency'           => 'EUR',
                'record_date'            => $date(12, 10),
                'entity'            => 'Athletico Paranaense',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Deuda con AFIP - Plan de pagos cuota (proyectado)',
                'type'             => 'pago',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(12, 10),
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 730000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(12, 28),
                'links'            => json_encode([]),
            ],
        ];

        foreach ($records as $record) {
            EconomyRecord::create($record);
        }
    }
}
