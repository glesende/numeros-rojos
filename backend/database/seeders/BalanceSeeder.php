<?php

namespace Database\Seeders;

use App\Models\Balance;
use App\Models\BalanceLine;
use Illuminate\Database\Seeder;

class BalanceSeeder extends Seeder
{
    public function run(): void
    {
        $balances = [
            [
                'exercise'            => '2022/2023',
                'dollar_reference'    => 350.00,
                'published_at'        => '2023-10-15',
                'lines'               => $this->lines2022_2023(),
            ],
            [
                'exercise'            => '2023/2024',
                'dollar_reference'    => 890.00,
                'published_at'        => '2024-10-20',
                'lines'               => $this->lines2023_2024(),
            ],
            [
                'exercise'            => '2024/2025',
                'dollar_reference'    => 1050.00,
                'published_at'        => '2025-10-18',
                'lines'               => $this->lines2024_2025(),
            ],
        ];

        foreach ($balances as $balanceData) {
            $lines = $balanceData['lines'];
            unset($balanceData['lines']);

            $balance = Balance::create($balanceData);

            $this->createLines($balance, $lines);
        }
    }

    /**
     * Recursively creates balance lines, resolving parent IDs.
     */
    private function createLines(Balance $balance, array $lines, ?int $parentId = null, int $level = 1, string $parentPath = ''): void
    {
        foreach ($lines as $order => $lineData) {
            $children = $lineData['children'] ?? [];
            unset($lineData['children']);

            $name           = $lineData['name'];
            $normalizedName = BalanceLine::normalizeName($name);
            $path           = $parentPath ? "{$parentPath}.{$normalizedName}" : $normalizedName;

            $line = BalanceLine::create([
                'balance_id'      => $balance->id,
                'parent_id'       => $parentId,
                'name'            => $name,
                'normalized_name' => $normalizedName,
                'level'           => $level,
                'order'           => $order + 1,
                'amount'          => $lineData['amount'] ?? null,
                'currency'        => $lineData['currency'] ?? 'ARS',
                'is_total'        => $lineData['is_total'] ?? false,
                'path'            => $path,
            ]);

            if (!empty($children)) {
                $this->createLines($balance, $children, $line->id, $level + 1, $path);
            }
        }
    }

    // =========================================================================
    // Ejercicio 2022/2023
    // =========================================================================

    private function lines2022_2023(): array
    {
        return [
            [
                'name'     => 'ACTIVO',
                'amount'   => 4_850_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Activo Corriente',
                        'amount'   => 2_100_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Caja y Bancos', 'amount' => 380_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Inversiones', 'amount' => 210_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Créditos por Derechos de TV', 'amount' => 840_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Créditos', 'amount' => 320_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Bienes de Cambio', 'amount' => 350_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Activo Corriente', 'amount' => 2_100_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Activo No Corriente',
                        'amount'   => 2_750_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Derechos Federativos de Jugadores', 'amount' => 1_200_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Bienes de Uso (Estadio e Instalaciones)', 'amount' => 1_100_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Inversiones Permanentes', 'amount' => 250_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Activos No Corrientes', 'amount' => 200_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Activo No Corriente', 'amount' => 2_750_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'TOTAL ACTIVO', 'amount' => 4_850_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'PASIVO',
                'amount'   => 3_120_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Pasivo Corriente',
                        'amount'   => 1_480_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Deudas Comerciales', 'amount' => 340_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Bancarias', 'amount' => 420_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Sociales y Previsionales', 'amount' => 280_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Fiscales', 'amount' => 180_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Anticipos por Traspasos', 'amount' => 160_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otras Deudas Corrientes', 'amount' => 100_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Pasivo Corriente', 'amount' => 1_480_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Pasivo No Corriente',
                        'amount'   => 1_640_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Deudas Bancarias a Largo Plazo', 'amount' => 900_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas por Traspasos a Largo Plazo', 'amount' => 480_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Previsiones', 'amount' => 260_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Pasivo No Corriente', 'amount' => 1_640_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'TOTAL PASIVO', 'amount' => 3_120_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'PATRIMONIO NETO',
                'amount'   => 1_730_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    ['name' => 'Capital Social', 'amount' => 950_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'Reservas', 'amount' => 380_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'Resultado del Ejercicio', 'amount' => 400_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'TOTAL PATRIMONIO NETO', 'amount' => 1_730_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'ESTADO DE RESULTADOS',
                'amount'   => null,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Ingresos',
                        'amount'   => 4_280_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Derechos de Televisión', 'amount' => 1_820_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Ingresos por Traspasos', 'amount' => 980_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Abonos y Entradas', 'amount' => 620_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Sponsors y Publicidad', 'amount' => 480_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Premios y Subsidios AFA', 'amount' => 280_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Ingresos', 'amount' => 100_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Ingresos', 'amount' => 4_280_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Egresos',
                        'amount'   => 3_880_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Sueldos y Cargas Sociales - Plantel', 'amount' => 1_950_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Sueldos y Cargas Sociales - Administrativos', 'amount' => 420_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Costos por Traspasos', 'amount' => 560_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Gastos de Mantenimiento', 'amount' => 280_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Gastos de Competición', 'amount' => 320_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Amortizaciones', 'amount' => 230_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Gastos', 'amount' => 120_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Egresos', 'amount' => 3_880_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'RESULTADO DEL EJERCICIO', 'amount' => 400_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
        ];
    }

    // =========================================================================
    // Ejercicio 2023/2024
    // =========================================================================

    private function lines2023_2024(): array
    {
        return [
            [
                'name'     => 'ACTIVO',
                'amount'   => 9_640_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Activo Corriente',
                        'amount'   => 4_200_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Caja y Bancos', 'amount' => 720_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Inversiones', 'amount' => 480_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Créditos por Derechos de TV', 'amount' => 1_680_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Créditos', 'amount' => 720_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Bienes de Cambio', 'amount' => 600_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Activo Corriente', 'amount' => 4_200_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Activo No Corriente',
                        'amount'   => 5_440_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Derechos Federativos de Jugadores', 'amount' => 2_600_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Bienes de Uso (Estadio e Instalaciones)', 'amount' => 1_980_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Inversiones Permanentes', 'amount' => 540_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Activos No Corrientes', 'amount' => 320_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Activo No Corriente', 'amount' => 5_440_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'TOTAL ACTIVO', 'amount' => 9_640_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'PASIVO',
                'amount'   => 6_380_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Pasivo Corriente',
                        'amount'   => 2_940_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Deudas Comerciales', 'amount' => 680_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Bancarias', 'amount' => 840_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Sociales y Previsionales', 'amount' => 560_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Fiscales', 'amount' => 360_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Anticipos por Traspasos', 'amount' => 280_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otras Deudas Corrientes', 'amount' => 220_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Pasivo Corriente', 'amount' => 2_940_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Pasivo No Corriente',
                        'amount'   => 3_440_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Deudas Bancarias a Largo Plazo', 'amount' => 1_860_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas por Traspasos a Largo Plazo', 'amount' => 980_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Previsiones', 'amount' => 600_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Pasivo No Corriente', 'amount' => 3_440_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'TOTAL PASIVO', 'amount' => 6_380_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'PATRIMONIO NETO',
                'amount'   => 3_260_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    ['name' => 'Capital Social', 'amount' => 1_680_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'Reservas', 'amount' => 840_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'Resultado del Ejercicio', 'amount' => 740_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'TOTAL PATRIMONIO NETO', 'amount' => 3_260_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'ESTADO DE RESULTADOS',
                'amount'   => null,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Ingresos',
                        'amount'   => 9_480_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Derechos de Televisión', 'amount' => 3_960_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Ingresos por Traspasos', 'amount' => 2_420_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Abonos y Entradas', 'amount' => 1_340_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Sponsors y Publicidad', 'amount' => 1_020_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Premios y Subsidios AFA', 'amount' => 540_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Ingresos', 'amount' => 200_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Ingresos', 'amount' => 9_480_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Egresos',
                        'amount'   => 8_740_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Sueldos y Cargas Sociales - Plantel', 'amount' => 4_380_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Sueldos y Cargas Sociales - Administrativos', 'amount' => 940_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Costos por Traspasos', 'amount' => 1_280_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Gastos de Mantenimiento', 'amount' => 640_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Gastos de Competición', 'amount' => 780_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Amortizaciones', 'amount' => 480_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Gastos', 'amount' => 240_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Egresos', 'amount' => 8_740_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'RESULTADO DEL EJERCICIO', 'amount' => 740_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
        ];
    }

    // =========================================================================
    // Ejercicio 2024/2025
    // =========================================================================

    private function lines2024_2025(): array
    {
        return [
            [
                'name'     => 'ACTIVO',
                'amount'   => 18_320_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Activo Corriente',
                        'amount'   => 7_840_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Caja y Bancos', 'amount' => 1_260_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Inversiones', 'amount' => 980_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Créditos por Derechos de TV', 'amount' => 3_200_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Créditos', 'amount' => 1_480_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Bienes de Cambio', 'amount' => 920_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Activo Corriente', 'amount' => 7_840_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Activo No Corriente',
                        'amount'   => 10_480_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Derechos Federativos de Jugadores', 'amount' => 5_200_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Bienes de Uso (Estadio e Instalaciones)', 'amount' => 3_680_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Inversiones Permanentes', 'amount' => 960_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Activos No Corrientes', 'amount' => 640_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Activo No Corriente', 'amount' => 10_480_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'TOTAL ACTIVO', 'amount' => 18_320_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'PASIVO',
                'amount'   => 12_140_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Pasivo Corriente',
                        'amount'   => 5_460_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Deudas Comerciales', 'amount' => 1_240_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Bancarias', 'amount' => 1_580_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Sociales y Previsionales', 'amount' => 1_020_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas Fiscales', 'amount' => 680_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Anticipos por Traspasos', 'amount' => 540_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otras Deudas Corrientes', 'amount' => 400_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Pasivo Corriente', 'amount' => 5_460_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Pasivo No Corriente',
                        'amount'   => 6_680_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Deudas Bancarias a Largo Plazo', 'amount' => 3_640_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Deudas por Traspasos a Largo Plazo', 'amount' => 1_880_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Previsiones', 'amount' => 1_160_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Pasivo No Corriente', 'amount' => 6_680_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'TOTAL PASIVO', 'amount' => 12_140_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'PATRIMONIO NETO',
                'amount'   => 6_180_000_000,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    ['name' => 'Capital Social', 'amount' => 3_100_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'Reservas', 'amount' => 1_680_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'Resultado del Ejercicio', 'amount' => 1_400_000_000, 'currency' => 'ARS', 'is_total' => false],
                    ['name' => 'TOTAL PATRIMONIO NETO', 'amount' => 6_180_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
            [
                'name'     => 'ESTADO DE RESULTADOS',
                'amount'   => null,
                'currency' => 'ARS',
                'is_total' => false,
                'children' => [
                    [
                        'name'     => 'Ingresos',
                        'amount'   => 18_640_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Derechos de Televisión', 'amount' => 7_480_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Ingresos por Traspasos', 'amount' => 4_820_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Abonos y Entradas', 'amount' => 2_680_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Sponsors y Publicidad', 'amount' => 2_160_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Premios y Subsidios AFA', 'amount' => 1_100_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Ingresos', 'amount' => 400_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Ingresos', 'amount' => 18_640_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    [
                        'name'     => 'Egresos',
                        'amount'   => 17_240_000_000,
                        'currency' => 'ARS',
                        'is_total' => false,
                        'children' => [
                            ['name' => 'Sueldos y Cargas Sociales - Plantel', 'amount' => 8_620_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Sueldos y Cargas Sociales - Administrativos', 'amount' => 1_860_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Costos por Traspasos', 'amount' => 2_580_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Gastos de Mantenimiento', 'amount' => 1_280_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Gastos de Competición', 'amount' => 1_480_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Amortizaciones', 'amount' => 980_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Otros Gastos', 'amount' => 440_000_000, 'currency' => 'ARS', 'is_total' => false],
                            ['name' => 'Total Egresos', 'amount' => 17_240_000_000, 'currency' => 'ARS', 'is_total' => true],
                        ],
                    ],
                    ['name' => 'RESULTADO DEL EJERCICIO', 'amount' => 1_400_000_000, 'currency' => 'ARS', 'is_total' => true],
                ],
            ],
        ];
    }
}
