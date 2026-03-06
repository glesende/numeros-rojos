<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\EconomyRecord;
use App\Models\Contract;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'     => 'Admin',
            'email'    => 'admin@numerosrojos.ar',
            'password' => Hash::make('password'),
        ]);

        // Datos de ejemplo - Economía
        $economyRecords = [
            [
                'descripcion' => 'Venta de Leandro Fernández al Toluca (MX)',
                'tipo' => 'cobro',
                'monto' => 4500000.00,
                'moneda' => 'USD',
                'fecha' => '2024-01-15',
                'oficial' => true,
                'confidence_level' => 'high',
                'links' => json_encode(['https://example.com/nota1']),
            ],
            [
                'descripcion' => 'Compra de Kevin Lomónaco',
                'tipo' => 'pago',
                'monto' => 1200000.00,
                'moneda' => 'USD',
                'fecha' => '2024-02-10',
                'oficial' => false,
                'confidence_level' => 'medium',
                'links' => json_encode(['https://example.com/nota2']),
            ],
            [
                'descripcion' => 'Recaudación partido vs Racing - Clásico de Avellaneda',
                'tipo' => 'cobro',
                'monto' => 85000000.00,
                'moneda' => 'ARS',
                'fecha' => '2024-03-05',
                'oficial' => true,
                'confidence_level' => 'high',
                'links' => json_encode([]),
            ],
            [
                'descripcion' => 'Pago de salarios - Plantel profesional Marzo 2024',
                'tipo' => 'pago',
                'monto' => 450000000.00,
                'moneda' => 'ARS',
                'fecha' => '2024-03-30',
                'oficial' => false,
                'confidence_level' => 'low',
                'links' => json_encode([]),
            ],
            [
                'descripcion' => 'Derechos TV - Cuota trimestral',
                'tipo' => 'cobro',
                'monto' => 320000000.00,
                'moneda' => 'ARS',
                'fecha' => '2024-04-01',
                'oficial' => true,
                'confidence_level' => 'high',
                'links' => json_encode(['https://example.com/nota-tv']),
            ],
        ];

        foreach ($economyRecords as $record) {
            EconomyRecord::create($record);
        }

        // Datos de ejemplo - Contratos
        $contracts = [
            [
                'nombre_completo' => 'Rodrigo Rey',
                'fecha_firma' => '2023-07-01',
                'fecha_caducidad' => '2025-12-31',
                'porcentaje_pase_club' => 100.00,
                'salario_estimado' => 35000.00,
                'moneda' => 'USD',
                'oficial' => true,
                'confidence_level' => 'high',
                'clausulas' => json_encode(['Cláusula de rescisión: USD 5M']),
                'links' => json_encode([]),
            ],
            [
                'nombre_completo' => 'Sergio Barreto',
                'fecha_firma' => '2024-01-15',
                'fecha_caducidad' => '2026-06-30',
                'porcentaje_pase_club' => 80.00,
                'salario_estimado' => 25000.00,
                'moneda' => 'USD',
                'oficial' => false,
                'confidence_level' => 'medium',
                'clausulas' => json_encode([]),
                'links' => json_encode(['https://example.com/contrato-barreto']),
            ],
            [
                'nombre_completo' => 'Iván Marcone',
                'fecha_firma' => '2023-08-01',
                'fecha_caducidad' => '2025-06-30',
                'porcentaje_pase_club' => 50.00,
                'salario_estimado' => null,
                'moneda' => null,
                'oficial' => false,
                'confidence_level' => 'low',
                'clausulas' => json_encode(['Opción de compra: USD 2M']),
                'links' => json_encode([]),
            ],
        ];

        foreach ($contracts as $contract) {
            Contract::create($contract);
        }
    }
}
