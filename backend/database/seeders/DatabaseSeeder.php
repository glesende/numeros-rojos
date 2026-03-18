<?php

namespace Database\Seeders;

use App\Models\User;
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

        $this->call([
            EconomyRecordSeeder::class,
            ContractSeeder::class,
            StadiumSeeder::class,
        ]);
    }
}
