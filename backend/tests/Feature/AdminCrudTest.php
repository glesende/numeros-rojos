<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AdminCrudTest extends TestCase
{
    private array $headers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->headers = $this->adminHeaders();
    }

    #[Test]
    public function ciclo_completo_de_un_registro_economico(): void
    {
        $id = $this->postJson('/api/v1/admin/economy', [
            'description' => 'Pago de prueba',
            'type'        => 'pago',
            'amount'      => 1500.5,
            'currency'    => 'USD',
            'record_date' => '2026-01-15',
            'links'       => [['url' => 'https://example.com/nota', 'official' => true]],
        ], $this->headers)->assertStatus(201)->json('data.id');

        $this->getJson("/api/v1/economy/{$id}")->assertOk()->assertJsonPath('data.description', 'Pago de prueba');

        $this->putJson("/api/v1/admin/economy/{$id}", ['description' => 'Pago corregido', 'type' => 'pago', 'amount' => 10, 'currency' => 'ARS'], $this->headers)
            ->assertOk()->assertJsonPath('data.description', 'Pago corregido');

        $this->deleteJson("/api/v1/admin/economy/{$id}", [], $this->headers)->assertOk();
        $this->getJson("/api/v1/economy/{$id}")->assertStatus(404);
    }

    #[Test]
    public function un_registro_economico_invalido_responde_422_con_detalle_por_campo(): void
    {
        $this->postJson('/api/v1/admin/economy', ['type' => 'regalo', 'amount' => -1], $this->headers)
            ->assertStatus(422)
            ->assertJsonPath('error', 'Datos inválidos')
            ->assertJsonStructure(['details' => ['description', 'type', 'amount', 'currency']]);
    }

    #[Test]
    public function ciclo_completo_de_un_contrato(): void
    {
        $id = $this->postJson('/api/v1/admin/contracts', [
            'full_name'            => 'Jugador de Prueba',
            'expiration_date'      => '2028-12-31',
            'club_pass_percentage' => 70,
            'currency'             => 'USD',
        ], $this->headers)->assertStatus(201)->json('data.id');

        $this->getJson("/api/v1/contracts/{$id}")->assertOk();

        $this->putJson("/api/v1/admin/contracts/{$id}", [
            'full_name'            => 'Jugador de Prueba',
            'expiration_date'      => '2029-06-30',
            'club_pass_percentage' => 80,
        ], $this->headers)->assertOk();

        $this->deleteJson("/api/v1/admin/contracts/{$id}", [], $this->headers)->assertOk();
        $this->getJson("/api/v1/contracts/{$id}")->assertStatus(404);
    }

    #[Test]
    public function ciclo_completo_de_un_derecho(): void
    {
        $id = $this->postJson('/api/v1/admin/rights', ['full_name' => 'Derecho de Prueba'], $this->headers)
            ->assertStatus(201)->json('data.id');

        $this->getJson("/api/v1/rights/{$id}")->assertOk();
        $this->putJson("/api/v1/admin/rights/{$id}", ['full_name' => 'Derecho Editado'], $this->headers)->assertOk();
        $this->deleteJson("/api/v1/admin/rights/{$id}", [], $this->headers)->assertOk();
        $this->getJson("/api/v1/rights/{$id}")->assertStatus(404);
    }

    #[Test]
    public function rumores_dentro_de_un_mercado(): void
    {
        $marketId = $this->postJson('/api/v1/admin/markets', ['name' => 'Mercado de prueba'], $this->headers)
            ->assertStatus(201)->json('data.id');

        $rumorId = $this->postJson('/api/v1/admin/rumors', [
            'market_id' => $marketId,
            'full_name' => 'Refuerzo Rumoreado',
            'status'    => 'rumor',
        ], $this->headers)->assertStatus(201)->json('data.id');

        $this->getJson("/api/v1/rumors/{$rumorId}")->assertOk();
        $this->getJson('/api/v1/markets')->assertOk()->assertJsonFragment(['name' => 'Mercado de prueba']);

        $this->postJson('/api/v1/admin/rumors', ['market_id' => 999999999, 'full_name' => 'X'], $this->headers)
            ->assertStatus(422)->assertJsonStructure(['details' => ['market_id']]);

        $this->deleteJson("/api/v1/admin/rumors/{$rumorId}", [], $this->headers)->assertOk();
        $this->deleteJson("/api/v1/admin/markets/{$marketId}", [], $this->headers)->assertOk();
    }
}
