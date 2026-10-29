<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DataFreshnessTest extends TestCase
{
    use DatabaseTransactions;

    private function freshness(string $section): string
    {
        Artisan::call('data:freshness', ['section' => $section]);
        return trim(Artisan::output());
    }

    public function test_tabla_vacia_devuelve_cero(): void
    {
        DB::table('markets')->delete();
        $this->assertSame('0', $this->freshness('market'));
    }

    public function test_devuelve_dias_desde_el_ultimo_dato(): void
    {
        DB::table('markets')->delete();
        $old = now()->subDays(10)->toDateTimeString();
        $new = now()->subDays(3)->toDateTimeString();
        DB::table('markets')->insert([
            ['name' => 'viejo', 'created_at' => $old, 'updated_at' => $old],
            ['name' => 'nuevo', 'created_at' => $old, 'updated_at' => $new],
        ]);
        $this->assertSame('3', $this->freshness('market'));
    }

    public function test_todas_las_secciones_son_consultables(): void
    {
        foreach (array_keys(\App\Console\Commands\DataFreshnessCommand::SECTIONS) as $section) {
            $this->assertMatchesRegularExpression('/^\d+$/', $this->freshness($section), $section);
        }
    }

    public function test_seccion_desconocida_falla(): void
    {
        $this->assertSame(1, Artisan::call('data:freshness', ['section' => 'nada']));
    }
}
