<?php

namespace Database\Seeders;

use App\Models\Contract;
use Illuminate\Database\Seeder;

class ContractSeeder extends Seeder
{
    public function run(): void
    {
        $contracts = [
            // Arqueros
            [
                'full_name'      => 'Rodrigo Rey',
                'expiration_date'      => '2025-12-31',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 35000.00,
                'currency'              => 'USD',
                'official'             => true,
                'clauses'           => ['Cláusula de rescisión: USD 5M'],
                'links'               => [],
            ],
            [
                'full_name'      => 'Lucas Rodríguez',
                'expiration_date'      => '2025-06-30',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 8000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],

            // Defensores
            [
                'full_name'      => 'Sergio Barreto',
                'expiration_date'      => '2026-06-30',
                'club_pass_percentage' => 80.00,
                'estimated_salary'     => 25000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Emanuel Mammana',
                'expiration_date'      => '2026-12-31',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 30000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => ['Opción de compra definitiva'],
                'links'               => [],
            ],
            [
                'full_name'      => 'Alexander Barboza',
                'expiration_date'      => '2025-06-30',
                'club_pass_percentage' => 70.00,
                'estimated_salary'     => 18000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Lucas González',
                'expiration_date'      => '2024-06-30',
                'club_pass_percentage' => 60.00,
                'estimated_salary'     => null,
                'currency'              => null,
                'official'             => false,
                'clauses'           => ['Préstamo con opción de compra: USD 5M'],
                'links'               => [],
            ],
            [
                'full_name'      => 'Gastón Togni',
                'expiration_date'      => '2025-06-30',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 12000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Fabricio Bustos',
                'expiration_date'      => '2026-06-30',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 22000.00,
                'currency'              => 'USD',
                'official'             => true,
                'clauses'           => ['Cláusula de rescisión: USD 3M'],
                'links'               => [],
            ],

            // Mediocampistas
            [
                'full_name'      => 'Iván Marcone',
                'expiration_date'      => '2025-06-30',
                'club_pass_percentage' => 50.00,
                'estimated_salary'     => null,
                'currency'              => null,
                'official'             => false,
                'clauses'           => ['Opción de compra: USD 2M'],
                'links'               => [],
            ],
            [
                'full_name'      => 'Alan Soñora',
                'expiration_date'      => '2026-12-31',
                'club_pass_percentage' => 90.00,
                'estimated_salary'     => 20000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Javier Altamirano',
                'expiration_date'      => '2024-12-31',
                'club_pass_percentage' => 80.00,
                'estimated_salary'     => 15000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Carlos Briasco',
                'expiration_date'      => '2026-06-30',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 16000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Lucas Romero',
                'expiration_date'      => '2025-12-31',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 14000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Kevin Lomónaco',
                'expiration_date'      => '2027-06-30',
                'club_pass_percentage' => 70.00,
                'estimated_salary'     => 18000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],

            // Delanteros
            [
                'full_name'      => 'Silvio Romero',
                'expiration_date'      => '2025-06-30',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 40000.00,
                'currency'              => 'USD',
                'official'             => true,
                'clauses'           => ['Cláusula de rescisión: USD 8M'],
                'links'               => [],
            ],
            [
                'full_name'      => 'Leandro Fernández',
                'expiration_date'      => '2024-06-30',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 28000.00,
                'currency'              => 'USD',
                'official'             => true,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Jonatan Báez',
                'expiration_date'      => '2024-06-30',
                'club_pass_percentage' => 90.00,
                'estimated_salary'     => 22000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Joaquín Laso',
                'expiration_date'      => '2025-12-31',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 10000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
            [
                'full_name'      => 'Alexis Canelo',
                'expiration_date'      => '2027-06-30',
                'club_pass_percentage' => 60.00,
                'estimated_salary'     => 12000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => ['Cláusula de compra por terceros: USD 4M'],
                'links'               => [],
            ],
            [
                'full_name'      => 'Facundo Pumpido',
                'expiration_date'      => '2026-12-31',
                'club_pass_percentage' => 100.00,
                'estimated_salary'     => 9000.00,
                'currency'              => 'USD',
                'official'             => false,
                'clauses'           => [],
                'links'               => [],
            ],
        ];

        foreach ($contracts as $contract) {
            Contract::create($contract);
        }
    }
}
