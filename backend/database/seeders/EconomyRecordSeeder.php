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
                'official'          => true,
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
                'official'          => false,
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
                'official'          => true,
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
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // Hace ~21 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 310000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-21),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio Quilmes - Temporada',
                'type'             => 'cobro',
                'amount'            => 1200000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-21, 5),
                'official'          => true,
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
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Compra de Alan Soñora (Unión de Santa Fe)',
                'type'             => 'pago',
                'amount'            => 800000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-20, 15),
                'official'          => false,
                'entity'            => 'Unión de Santa Fe',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 410000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-20, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // Hace ~18 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 340000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-18),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación partido vs San Lorenzo - Liga Profesional',
                'type'             => 'cobro',
                'amount'            => 72000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-17, 14),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Multa AFA por incidentes en clásico',
                'type'             => 'pago',
                'amount'            => 18000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-17, 20),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 430000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-17, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Mantenimiento y obras estadio Libertadores de América',
                'type'             => 'pago',
                'amount'            => 250000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-16, 15),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // Hace ~15 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 320000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-15),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta de Leandro Fernández al Toluca (MX)',
                'type'             => 'cobro',
                'amount'            => 4500000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-14, 15),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Compra de Kevin Lomónaco',
                'type'             => 'pago',
                'amount'            => 1200000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-13, 10),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio principal Puma - Temporada',
                'type'             => 'cobro',
                'amount'            => 1800000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-13, 1),
                'official'          => true,
                'entity'            => 'Puma',
                'comments'          => 'Contrato de indumentaria y patrocinio',
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 480000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-13, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // Hace ~12 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 320000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-12),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación partido vs Racing - Clásico de Avellaneda',
                'type'             => 'cobro',
                'amount'            => 85000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-11, 5),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 450000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-11, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta de Javier Altamirano al Sporting de Lisboa (PT)',
                'type'             => 'cobro',
                'amount'            => 6000000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-11, 1),
                'official'          => true,
                'links'            => json_encode([]),
            ],

            // Hace ~9 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 350000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-9),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación Copa de la Liga - Fase de grupos',
                'type'             => 'cobro',
                'amount'            => 52000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-8, 20),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 500000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-8, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta parcial pase de Alexis Canelo al exterior',
                'type'             => 'cobro',
                'amount'            => 900000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-8, 20),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // Hace ~6 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 380000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-6),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación partido vs Boca Juniors - LPF',
                'type'             => 'cobro',
                'amount'            => 110000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-5, 8),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Multa AFA por demora en pagos de salarios',
                'type'             => 'pago',
                'amount'            => 25000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-5, 15),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta de Silvio Romero al Al-Ettifaq (SA)',
                'type'             => 'cobro',
                'amount'            => 5200000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-5, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 560000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-4, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Deuda con AFIP - Plan de pagos cuota',
                'type'             => 'pago',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-4, 10),
                'official'          => true,
                'links'            => json_encode([]),
            ],

            // Hace ~3 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF',
                'type'             => 'cobro',
                'amount'            => 420000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(-3),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación Copa Argentina - Cuartos de Final',
                'type'             => 'cobro',
                'amount'            => 65000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-2, 12),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 580000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-2, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Mantenimiento predio de Villa Domínico',
                'type'             => 'pago',
                'amount'            => 180000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-2, 20),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio secundario - acuerdo comercial',
                'type'             => 'cobro',
                'amount'            => 400000.00,
                'currency'           => 'USD',
                'record_date'            => $date(-1, 15),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional',
                'type'             => 'pago',
                'amount'            => 620000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(-1, 28),
                'official'          => false,
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
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 650000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(1, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +2 meses
            [
                'description'      => 'Recaudación partido vs Racing - Clásico de Avellaneda (proyectado)',
                'type'             => 'cobro',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(2, 9),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 660000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(2, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +3 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 460000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(3),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Deuda con AFIP - Plan de pagos cuota (proyectado)',
                'type'             => 'pago',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(3, 10),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 670000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(3, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +4 meses
            [
                'description'      => 'Patrocinio principal Puma - renovación anual (proyectado)',
                'type'             => 'cobro',
                'amount'            => 2000000.00,
                'currency'           => 'USD',
                'record_date'            => $date(4, 1),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 680000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(4, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +5 meses
            [
                'description'      => 'Recaudación Copa de la Liga - Semifinal (proyectado)',
                'type'             => 'cobro',
                'amount'            => 90000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(5, 15),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 690000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(5, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +6 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 480000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(6),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta proyectada de juvenil al exterior - cuota 1/2',
                'type'             => 'cobro',
                'amount'            => 1500000.00,
                'currency'           => 'USD',
                'record_date'            => $date(6, 20),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Deuda con AFIP - Plan de pagos cuota (proyectado)',
                'type'             => 'pago',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(6, 10),
                'official'          => true,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 710000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(6, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +9 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 500000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(9),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 750000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(9, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Recaudación partido vs Boca Juniors - LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 130000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(10, 5),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Deuda con AFIP - Plan de pagos cuota (proyectado)',
                'type'             => 'pago',
                'amount'            => 120000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(9, 10),
                'official'          => true,
                'links'            => json_encode([]),
            ],

            // +12 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 520000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(12),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio principal - renovación anual (proyectado)',
                'type'             => 'cobro',
                'amount'            => 2200000.00,
                'currency'           => 'USD',
                'record_date'            => $date(12, 1),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 800000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(12, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Venta proyectada de juvenil al exterior - cuota 2/2',
                'type'             => 'cobro',
                'amount'            => 1500000.00,
                'currency'           => 'USD',
                'record_date'            => $date(13, 20),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +15 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 550000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(15),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 850000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(15, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +18 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 580000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(18),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio principal - renovación anual (proyectado)',
                'type'             => 'cobro',
                'amount'            => 2400000.00,
                'currency'           => 'USD',
                'record_date'            => $date(18, 1),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 900000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(18, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +21 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 610000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(21),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 950000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(21, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],

            // +24 meses
            [
                'description'      => 'Derechos TV - Cuota trimestral LPF (proyectado)',
                'type'             => 'cobro',
                'amount'            => 640000000.00,
                'currency'           => 'ARS',
                'record_date'            => $month(24),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Patrocinio principal - renovación anual (proyectado)',
                'type'             => 'cobro',
                'amount'            => 2600000.00,
                'currency'           => 'USD',
                'record_date'            => $date(24, 1),
                'official'          => false,
                'links'            => json_encode([]),
            ],
            [
                'description'      => 'Pago de salarios - Plantel profesional (proyectado)',
                'type'             => 'pago',
                'amount'            => 1000000000.00,
                'currency'           => 'ARS',
                'record_date'            => $date(24, 28),
                'official'          => false,
                'links'            => json_encode([]),
            ],
        ];

        foreach ($records as $record) {
            EconomyRecord::create($record);
        }
    }
}
