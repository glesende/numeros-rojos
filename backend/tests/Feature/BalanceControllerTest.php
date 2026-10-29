<?php

namespace Tests\Feature;

use App\Models\Balance;
use App\Models\BalanceLine;
use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BalanceControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function balance(string $exercise = '2024', float $dollar = 1000, ?string $publishedAt = '2024-12-31'): Balance
    {
        return Balance::create(['exercise' => $exercise, 'dollar_reference' => $dollar, 'published_at' => $publishedAt]);
    }

    private function linea(Balance $b, string $name, ?float $amount, array $extra = []): BalanceLine
    {
        return BalanceLine::create($extra + [
            'balance_id' => $b->id, 'name' => $name, 'normalized_name' => BalanceLine::normalizeName($name),
            'level' => 1, 'order' => 0, 'amount' => $amount, 'currency' => 'ARS', 'is_total' => false, 'path' => $name,
        ]);
    }

    #[Test]
    public function el_indice_ordena_por_publicacion_descendente(): void
    {
        $this->balance('2023', 500, '2023-12-31');
        $this->balance('2024', 1000, '2024-12-31');

        $this->getJson('/api/v1/balances')->assertOk()
            ->assertJsonPath('data.0.exercise', '2024')
            ->assertJsonPath('data.1.exercise', '2023')
            ->assertJsonPath('data.0.has_file', false);
    }

    #[Test]
    public function show_arma_el_arbol_de_lineas_y_404_si_no_existe(): void
    {
        $b      = $this->balance();
        $activo = $this->linea($b, 'Activo', 300, ['is_total' => true]);
        $this->linea($b, 'Caja', 100, ['parent_id' => $activo->id, 'level' => 2]);

        $this->getJson("/api/v1/balances/{$b->id}")->assertOk()
            ->assertJsonPath('data.lines.0.name', 'Activo')
            ->assertJsonPath('data.lines.0.children.0.name', 'Caja')
            ->assertJsonPath('data.lines.0.children.0.amount', 100);

        $this->getJson('/api/v1/balances/999999')->assertStatus(404);
    }

    #[Test]
    public function la_evolucion_vacia_devuelve_listas_vacias(): void
    {
        $this->getJson('/api/v1/balances/evolution')->assertOk()
            ->assertExactJson(['data' => ['exercises' => [], 'series' => []]]);
    }

    #[Test]
    public function la_evolucion_convierte_a_dolares_y_usa_solo_totales_por_defecto(): void
    {
        $a = $this->balance('2023', 100, '2023-12-31');
        $b = $this->balance('2024', 200, '2024-12-31');
        $this->linea($a, 'Activo', 1000, ['is_total' => true]);
        $this->linea($b, 'Activo', 4000, ['is_total' => true]);
        $this->linea($b, 'Detalle', 50);

        $data = $this->getJson('/api/v1/balances/evolution')->assertOk()->json('data');

        $this->assertSame(['2023', '2024'], $data['exercises']);
        $this->assertSame('USD', $data['currency']);
        $this->assertCount(1, $data['series']);
        $this->assertEquals([10.0, 20.0], $data['series'][0]['values']);
        $this->assertTrue($data['series'][0]['default_active']);
    }

    #[Test]
    public function la_evolucion_respeta_los_filtros_configurados_por_el_admin(): void
    {
        $b = $this->balance('2024', 100);
        $this->linea($b, 'Activo', 1000, ['is_total' => true]);
        $this->linea($b, 'Caja', 500);
        Setting::set('balance_chart_filter_items', json_encode(['caja']));
        Setting::set('balance_chart_default_items', json_encode(['otro']));
        Setting::set('balance_chart_label_overrides', json_encode(['caja' => 'Efectivo']));

        $series = $this->getJson('/api/v1/balances/evolution')->assertOk()->json('data.series');

        $this->assertCount(1, $series);
        $this->assertSame('Caja', $series[0]['name']);
        $this->assertSame('Efectivo', $series[0]['short_name']);
        $this->assertFalse($series[0]['default_active']);
        $this->assertEquals([5.0], $series[0]['values']);
    }

    #[Test]
    public function la_descarga_responde_404_sin_archivo_y_sirve_el_archivo_si_existe(): void
    {
        $b = $this->balance();
        $this->getJson("/api/v1/balances/{$b->id}/download")->assertStatus(404)->assertJsonPath('error', 'Archivo no disponible');

        $h  = $this->adminHeaders();
        $id = $this->postJson('/api/v1/admin/balances', [
            'exercise' => '2025', 'file' => UploadedFile::fake()->create('balance.pdf', 10, 'application/pdf'),
        ], $h)->assertStatus(201)->json('data.id');

        $this->get("/api/v1/balances/{$id}/download")->assertOk()->assertDownload('balance.pdf');
    }

    #[Test]
    public function ciclo_admin_de_un_balance_con_archivo(): void
    {
        $h = $this->adminHeaders();

        $this->postJson('/api/v1/admin/balances', [], $h)->assertStatus(422);
        $this->postJson('/api/v1/admin/balances', ['exercise' => 'x', 'file' => UploadedFile::fake()->create('a.exe', 1)], $h)->assertStatus(422);

        $creado = $this->postJson('/api/v1/admin/balances', [
            'exercise' => '2025', 'dollar_reference' => 1200, 'file' => UploadedFile::fake()->create('b.pdf', 10, 'application/pdf'),
        ], $h)->assertStatus(201)->json('data');
        Storage::disk('local')->assertExists($creado['file_path']);

        $this->putJson("/api/v1/admin/balances/{$creado['id']}", ['exercise' => '2025/26'], $h)
            ->assertOk()->assertJsonPath('data.exercise', '2025/26');

        $this->postJson("/api/v1/admin/balances/{$creado['id']}/update", ['file' => UploadedFile::fake()->create('c.pdf', 10, 'application/pdf')], $h)->assertOk();
        Storage::disk('local')->assertMissing($creado['file_path']);

        $this->deleteJson("/api/v1/admin/balances/{$creado['id']}", [], $h)->assertOk();
        $this->assertNull(Balance::find($creado['id']));
        $this->assertSame([], Storage::disk('local')->allFiles('balances'));
    }

    #[Test]
    public function analizar_sin_archivo_responde_422(): void
    {
        $b = $this->balance();
        $this->postJson("/api/v1/admin/balances/{$b->id}/analyze", [], $this->adminHeaders())
            ->assertStatus(422)->assertJsonPath('error', 'El balance no tiene archivo adjunto');
    }

    #[Test]
    public function aplicar_analisis_exige_datos(): void
    {
        $b = $this->balance();
        $this->postJson("/api/v1/admin/balances/{$b->id}/apply-analysis", [], $this->adminHeaders())->assertStatus(422);
    }

    #[Test]
    public function ciclo_de_lineas_manuales_con_jerarquia_niveles_y_ciclos(): void
    {
        $h = $this->adminHeaders();
        $b = $this->balance();

        $this->postJson("/api/v1/admin/balances/{$b->id}/lines", ['amount' => 1], $h)->assertStatus(422);

        $raiz = $this->postJson("/api/v1/admin/balances/{$b->id}/lines", ['name' => 'Activo', 'amount' => 100, 'is_total' => true], $h)
            ->assertStatus(201)->assertJsonPath('data.level', 1)->assertJsonPath('data.currency', 'ARS')->json('data');
        $hija = $this->postJson("/api/v1/admin/balances/{$b->id}/lines", ['name' => 'Caja', 'parent_id' => $raiz['id'], 'amount' => 40], $h)
            ->assertStatus(201)->assertJsonPath('data.level', 2)->assertJsonPath('data.path', 'Activo > Caja')->json('data');
        $nieta = $this->postJson("/api/v1/admin/balances/{$b->id}/lines", ['name' => 'Efectivo', 'parent_id' => $hija['id']], $h)
            ->assertStatus(201)->assertJsonPath('data.level', 3)->json('data');
        $otra = $this->postJson("/api/v1/admin/balances/{$b->id}/lines", ['name' => 'Pasivo'], $h)
            ->assertStatus(201)->assertJsonPath('data.order', 2)->json('data');

        $this->putJson("/api/v1/admin/balances/{$b->id}/lines/{$hija['id']}", ['name' => 'Caja y bancos', 'amount' => 55, 'currency' => 'USD', 'is_total' => true], $h)
            ->assertOk()->assertJsonPath('data.name', 'Caja y bancos')->assertJsonPath('data.currency', 'USD')->assertJsonPath('data.is_total', true);

        // un nodo no puede moverse dentro de sus propios hijos
        $this->putJson("/api/v1/admin/balances/{$b->id}/lines/{$raiz['id']}", ['parent_id' => $nieta['id']], $h)->assertStatus(422);

        // mover la subrama baja o sube el nivel de los descendientes
        $this->putJson("/api/v1/admin/balances/{$b->id}/lines/{$hija['id']}", ['parent_id' => $otra['id']], $h)
            ->assertOk()->assertJsonPath('data.level', 2);
        $this->putJson("/api/v1/admin/balances/{$b->id}/lines/{$hija['id']}", ['parent_id' => null], $h)
            ->assertOk()->assertJsonPath('data.level', 1);
        $this->assertSame(2, BalanceLine::find($nieta['id'])->level);

        $this->putJson("/api/v1/admin/balances/{$b->id}/lines/{$hija['id']}", ['parent_id' => 999999], $h)->assertStatus(404);

        $this->postJson("/api/v1/admin/balances/{$b->id}/lines/reorder", ['items' => [['id' => $otra['id'], 'order' => 0], ['id' => $raiz['id'], 'order' => 5]]], $h)
            ->assertOk();
        $this->assertSame(5, BalanceLine::find($raiz['id'])->order);
        $this->postJson("/api/v1/admin/balances/{$b->id}/lines/reorder", [], $h)->assertStatus(422);

        $this->deleteJson("/api/v1/admin/balances/{$b->id}/lines/{$hija['id']}", [], $h)->assertOk();
        $this->assertNull(BalanceLine::find($nieta['id']), 'borrar una línea borra a sus hijas');
    }

    #[Test]
    public function el_selector_de_items_agrupa_por_nombre_normalizado(): void
    {
        $a = $this->balance('2023');
        $b = $this->balance('2024');
        $this->linea($a, 'Caja', 1);
        $this->linea($b, 'Caja', 2);
        $this->linea($b, 'Sin monto', null);

        $items = $this->getJson('/api/v1/admin/balances/items', $this->adminHeaders())->assertOk()->json('data');

        $this->assertCount(1, $items);
        $this->assertSame(2, $items[0]['balance_count']);
    }
}
