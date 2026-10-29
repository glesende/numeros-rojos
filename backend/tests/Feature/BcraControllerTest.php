<?php

namespace Tests\Feature;

use App\Models\BankDebt;
use App\Models\RejectedCheck;
use App\Models\UsdQuote;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BcraControllerTest extends TestCase
{
    private function deuda(string $period, string $entity, int $amount, int $situation = 1, array $extra = []): BankDebt
    {
        return BankDebt::create($extra + [
            'identifier' => '30-1', 'period' => $period, 'entity' => $entity, 'amount' => $amount,
            'situation' => $situation, 'under_review' => false, 'legal_proceeding' => false,
        ]);
    }

    private function cheque(string $date, int $amount, ?string $paid = null, string $cause = 'SIN FONDOS'): RejectedCheck
    {
        return RejectedCheck::create([
            'identifier' => '30-1', 'check_number' => random_int(1, 999999), 'entity' => 11, 'cause' => $cause,
            'rejection_date' => $date, 'amount' => $amount, 'payment_date' => $paid,
            'under_review' => false, 'legal_proceeding' => false,
        ]);
    }

    #[Test]
    public function sin_datos_las_deudas_vienen_vacias(): void
    {
        $this->getJson('/api/v1/bcra/debts')->assertOk()
            ->assertExactJson(['data' => [], 'entities' => [], 'latest' => null]);
    }

    #[Test]
    public function las_deudas_se_dolarizan_con_la_ultima_cotizacion_al_fin_de_mes(): void
    {
        UsdQuote::create(['quote_date' => '2026-01-20', 'rate' => 1000]);
        UsdQuote::create(['quote_date' => '2026-02-10', 'rate' => 1250]);
        $this->deuda('202601', 'Banco A', 2);   // 2 * 1000 (miles) = 2.000.000 ARS
        $this->deuda('202601', 'Banco B', 3);
        $this->deuda('202602', 'Banco A', 5);

        $r = $this->getJson('/api/v1/bcra/debts')->assertOk();

        $this->assertEquals(5, $r->json('data.0.total_usd'), '(2+3)*1000/1000 con la cotización de enero');
        $this->assertEquals(4, $r->json('data.1.total_usd'), '5*1000/1250 con la cotización de febrero');
        $this->assertSame(['Banco A', 'Banco B'], $r->json('entities'));
        $this->assertSame('202602', $r->json('latest.period'));
    }

    #[Test]
    public function los_periodos_sin_cotizacion_previa_se_omiten_y_el_filtro_por_entidad_aplica(): void
    {
        UsdQuote::create(['quote_date' => '2026-02-10', 'rate' => 1000]);
        $this->deuda('202601', 'Banco A', 1);   // sin cotización a esa fecha
        $this->deuda('202602', 'Banco A', 1);
        $this->deuda('202602', 'Banco B', 9);

        $r = $this->getJson('/api/v1/bcra/debts?entity=Banco A')->assertOk();

        $this->assertCount(1, $r->json('data'));
        $this->assertEquals(1, $r->json('data.0.total_usd'));
        $this->assertCount(2, $r->json('latest.rows'), 'el desglose ignora el filtro');
    }

    #[Test]
    public function los_registros_filtran_ordenan_y_paginan(): void
    {
        UsdQuote::create(['quote_date' => '2026-01-01', 'rate' => 1000]);
        $this->deuda('202601', 'Banco A', 1, 1);
        $this->deuda('202601', 'Banco B', 4, 3, ['under_review' => true]);
        $this->deuda('202602', 'Banco C', 2, 5, ['legal_proceeding' => true]);

        $this->getJson('/api/v1/bcra/debts/records?period=202601')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/v1/bcra/debts/records?entity=Banco C')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/bcra/debts/records?situation=3')->assertOk()->assertJsonPath('data.0.entity', 'Banco B');
        $this->getJson('/api/v1/bcra/debts/records?under_review=true')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/bcra/debts/records?legal_proceeding=1')->assertOk()->assertJsonPath('data.0.entity', 'Banco C');

        $ordenado = $this->getJson('/api/v1/bcra/debts/records?sort_by=amount&sort_dir=asc')->assertOk();
        $this->assertSame([1000, 2000, 4000], array_column($ordenado->json('data'), 'amount_ars'));

        // un campo de orden no permitido cae al período
        $this->getJson('/api/v1/bcra/debts/records?sort_by=identifier;drop')->assertOk()->assertJsonPath('data.0.period', '202602');

        $this->getJson('/api/v1/bcra/debts/records?per_page=2')->assertOk()
            ->assertJsonPath('meta.last_page', 2)->assertJsonPath('meta.per_page', 2);
        $this->getJson('/api/v1/bcra/debts/records?per_page=5000')->assertOk()->assertJsonPath('meta.per_page', 100);
    }

    #[Test]
    public function un_registro_sin_cotizacion_tiene_monto_en_dolares_nulo(): void
    {
        $this->deuda('202601', 'Banco A', 1);

        $this->getJson('/api/v1/bcra/debts/records')->assertOk()
            ->assertJsonPath('data.0.amount_usd', null)
            ->assertJsonPath('data.0.amount_ars', 1000);
    }

    #[Test]
    public function los_cheques_solo_cuentan_sin_fondos_y_el_total_solo_los_pendientes(): void
    {
        $this->cheque('2026-03-01', 100);
        $this->cheque('2026-04-01', 50, '2026-04-10');
        $this->cheque('2026-05-01', 999, null, 'DEFECTOS FORMALES');

        $r = $this->getJson('/api/v1/bcra/checks')->assertOk();

        $this->assertSame(2, $r->json('count'));
        $this->assertEquals(100, $r->json('total_ars'));
        $this->assertSame('2026-04-01', $r->json('rows.0.rejection_date'), 'más reciente primero');
        $this->assertFalse($r->json('rows.0.pending'));
        $this->assertTrue($r->json('rows.1.pending'));
    }
}
