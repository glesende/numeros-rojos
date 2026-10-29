<?php

namespace Tests\Feature;

use App\Models\PageView;
use Carbon\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    private const VISITOR_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    private const VISITOR_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function track(string $section, string $visitor): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/analytics/view', ['section' => $section, 'visitor_id' => $visitor]);
    }

    #[Test]
    public function registra_una_visita_sin_guardar_el_id_ni_datos_personales(): void
    {
        $this->track('economia', self::VISITOR_A)->assertStatus(202);
        $this->track('economia', self::VISITOR_A)->assertStatus(202);

        $row = PageView::firstOrFail();
        $this->assertSame(2, $row->views);
        $this->assertSame(1, PageView::count());
        $this->assertNotSame(self::VISITOR_A, $row->visitor_hash);
        $this->assertSame(64, strlen($row->visitor_hash));
        $this->assertSame(['id', 'section', 'visitor_hash', 'viewed_on', 'views', 'created_at', 'updated_at'], array_keys($row->getAttributes()));
    }

    #[Test]
    public function rechaza_secciones_y_ids_invalidos(): void
    {
        $this->track('inventada', self::VISITOR_A)->assertStatus(422);
        $this->track('economia', 'corto')->assertStatus(422);
        $this->track('economia', "'; drop table users;--aaaaaaaa")->assertStatus(422);
        $this->assertSame(0, PageView::count());
    }

    #[Test]
    public function el_resumen_requiere_admin(): void
    {
        $this->getJson('/api/v1/admin/analytics/summary')->assertStatus(401);
    }

    #[Test]
    public function el_resumen_calcula_visitas_unicos_y_retorno_por_ventana(): void
    {
        Carbon::setTestNow('2026-10-20 12:00:00');
        $this->track('contratos', self::VISITOR_A);
        $this->track('contratos', self::VISITOR_B);
        $this->track('rumores', self::VISITOR_A);

        Carbon::setTestNow('2026-10-22 12:00:00');
        $this->track('contratos', self::VISITOR_A); // A vuelve otro día
        $this->track('contratos', self::VISITOR_A); // mismo día: suma visita, no es otro día

        Carbon::setTestNow('2026-10-29 12:00:00');
        $headers = $this->adminHeaders();

        $d7 = $this->getJson('/api/v1/admin/analytics/summary?days=7', $headers)->assertOk()->json('data');
        $this->assertSame(7, $d7['days']);
        $contratos = collect($d7['sections'])->firstWhere('section', 'contratos');
        $this->assertSame(0, $contratos['views']); // 20 y 22 quedan fuera de los últimos 7 días (desde el 23)

        $d30 = $this->getJson('/api/v1/admin/analytics/summary?days=30', $headers)->assertOk()->json('data');
        $contratos = collect($d30['sections'])->firstWhere('section', 'contratos');
        $this->assertSame(4, $contratos['views']);
        $this->assertSame(2, $contratos['unique_visitors']);
        $this->assertSame(1, $contratos['returning_visitors']);
        $this->assertEquals(50.0, $contratos['return_rate']);

        $rumores = collect($d30['sections'])->firstWhere('section', 'rumores');
        $this->assertSame(1, $rumores['unique_visitors']);
        $this->assertEquals(0.0, $rumores['return_rate']);

        $this->assertNull(collect($d30['sections'])->firstWhere('section', 'bcra')['return_rate']);
        $this->assertSame('contratos', $d30['sections'][0]['section']); // ordenado por audiencia
        $this->assertSame(2, $d30['site']['unique_visitors']);
        $this->assertSame(1, $d30['site']['returning_visitors']);
    }

    #[Test]
    public function el_comando_prune_borra_lo_viejo(): void
    {
        $hash = str_repeat('a', 64);
        PageView::create(['section' => 'home', 'visitor_hash' => $hash, 'viewed_on' => now()->subDays(120)->toDateString()]);
        PageView::create(['section' => 'home', 'visitor_hash' => $hash, 'viewed_on' => now()->toDateString()]);

        $this->assertSame(0, \Illuminate\Support\Facades\Artisan::call('analytics:prune'));

        $this->assertSame(1, PageView::count());
    }
}
