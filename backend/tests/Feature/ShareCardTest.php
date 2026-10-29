<?php

namespace Tests\Feature;

use App\Models\Balance;
use App\Models\BalanceLine;
use App\Models\Contract;
use App\Models\ElectionList;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ShareCardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    #[Test]
    public function el_balance_tiene_og_tags_con_cifras_e_imagen(): void
    {
        $b = Balance::create(['exercise' => '2024', 'dollar_reference' => 1000, 'published_at' => '2024-12-31']);
        BalanceLine::create([
            'balance_id' => $b->id, 'name' => 'Total Activo', 'normalized_name' => 'total_activo', 'level' => 1,
            'order' => 0, 'amount' => 5400000000, 'currency' => 'ARS', 'is_total' => true, 'path' => 'Total Activo',
        ]);

        $html = $this->get("/api/v1/share/balances/{$b->id}")->assertOk()->getContent();

        $this->assertStringContainsString('<meta property="og:title" content="Balance 2024 de Independiente | Números Rojos">', $html);
        $this->assertStringContainsString('Total Activo: $5.400 M', $html);
        $this->assertStringContainsString("og:url\" content=\"https://www.numerosrojos.net/balances/{$b->id}\"", $html);
        $this->assertStringContainsString("/api/api/v1/share/balances/{$b->id}/image.png", $html);
        $this->assertStringContainsString('twitter:card" content="summary_large_image"', $html);
    }

    #[Test]
    public function el_contrato_escapa_el_nombre_y_muestra_vencimiento(): void
    {
        $c = Contract::create(['club_pass_percentage' => 0, 'full_name' => 'Juan "<b>" Pérez', 'expiration_date' => '2027-06-30', 'estimated_salary' => 120000, 'currency' => 'USD']);

        $html = $this->get("/api/v1/share/contratos/{$c->id}")->assertOk()->getContent();

        $this->assertStringNotContainsString('<b>', $html);
        $this->assertStringContainsString('Vencimiento: 30/06/2027', $html);
        $this->assertStringContainsString('Salario estimado: US$120.000', $html);
    }

    #[Test]
    public function la_lista_de_elecciones_respeta_la_seccion_habilitada(): void
    {
        ElectionList::create(['token' => 'abc', 'slug' => 'lista-roja', 'name' => 'Lista Roja', 'is_active' => true]);

        $this->get('/api/v1/share/elecciones/lista-roja')->assertNotFound();

        Setting::set('section_elecciones_enabled', '1');
        $this->get('/api/v1/share/elecciones/lista-roja')->assertOk()
            ->assertSee('Lista Roja | Elecciones | Números Rojos', false);
    }

    #[Test]
    public function tipos_o_ids_inexistentes_dan_404(): void
    {
        $this->get('/api/v1/share/otra-cosa/1')->assertNotFound();
        $this->get('/api/v1/share/balances/999999')->assertNotFound();
        $this->get('/api/v1/share/contratos/999999/image.png')->assertNotFound();
    }

    #[Test]
    public function la_imagen_es_un_png_1200x630_o_cae_a_la_generica(): void
    {
        $c = Contract::create(['club_pass_percentage' => 0, 'full_name' => 'Juan Pérez', 'expiration_date' => '2027-06-30']);

        $res = $this->get("/api/v1/share/contratos/{$c->id}/image.png");

        if (function_exists('imagettftext') && is_readable('/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf')) {
            $res->assertOk()->assertHeader('Content-Type', 'image/png');
            $size = getimagesizefromstring($res->getContent());
            $this->assertSame([1200, 630], [$size[0], $size[1]]);
        } else {
            $res->assertRedirect('https://www.numerosrojos.net/og-image-nr.png');
        }
    }
}
