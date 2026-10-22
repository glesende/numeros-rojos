<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PublicEndpointsTest extends TestCase
{
    /** Endpoints públicos de lectura que no dependen de servicios externos (BeSoccer, BCRA en vivo) */
    public static function publicEndpoints(): array
    {
        return [
            'economía'            => ['/api/v1/economy'],
            'resumen mensual'     => ['/api/v1/economy/monthly-summary'],
            'evolución de deuda'  => ['/api/v1/economy/overdue-evolution'],
            'contratos'           => ['/api/v1/contracts'],
            'stats de contratos'  => ['/api/v1/contracts/stats'],
            'movimientos'         => ['/api/v1/contracts/recent-moves'],
            'representantes'      => ['/api/v1/contracts/representatives'],
            'derechos'            => ['/api/v1/rights'],
            'rumores'             => ['/api/v1/rumors'],
            'mercados'            => ['/api/v1/markets'],
            'balances'            => ['/api/v1/balances'],
            'evolución balances'  => ['/api/v1/balances/evolution'],
            'secciones visibles'  => ['/api/v1/settings/sections'],
            'deudas BCRA'         => ['/api/v1/bcra/debts'],
            'registros BCRA'      => ['/api/v1/bcra/debts/records'],
            'cheques BCRA'        => ['/api/v1/bcra/checks'],
            'estadio'             => ['/api/v1/stadium'],
        ];
    }

    #[Test]
    #[DataProvider('publicEndpoints')]
    public function responde_json_sin_autenticacion(string $uri): void
    {
        $response = $this->getJson($uri);

        $response->assertOk();
        $this->assertIsArray($response->json(), "{$uri} debe responder JSON");
    }

    #[Test]
    public function el_sitemap_es_xml(): void
    {
        $response = $this->get('/api/sitemap.xml');

        $response->assertOk();
        $this->assertStringStartsWith('<?xml', ltrim($response->getContent()));
    }

    #[Test]
    public function un_recurso_inexistente_responde_404_con_el_formato_propio(): void
    {
        foreach (['economy', 'contracts', 'rights', 'rumors', 'balances'] as $resource) {
            $this->getJson("/api/v1/{$resource}/999999999")
                ->assertStatus(404)
                ->assertExactJson(['error' => 'Recurso no encontrado']);
        }
    }

    #[Test]
    public function una_eleccion_con_token_desconocido_responde_404(): void
    {
        $this->getJson('/api/v1/elections/token/token-que-no-existe')->assertStatus(404);
    }
}
