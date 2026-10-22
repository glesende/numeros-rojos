<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuthTest extends TestCase
{
    #[Test]
    public function login_valida_los_datos_con_el_formato_de_error_propio(): void
    {
        $response = $this->postJson('/api/v1/auth/login', ['email' => 'no-es-un-email']);

        $response->assertStatus(422)
            ->assertJsonStructure(['error', 'details' => ['email', 'password']])
            ->assertJson(['error' => 'Datos inválidos']);
    }

    #[Test]
    public function login_con_credenciales_incorrectas_responde_401(): void
    {
        $this->createAdmin();

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.com', 'password' => 'otra-cosa'])
            ->assertStatus(401)
            ->assertJson(['error' => 'Credenciales inválidas']);
    }

    #[Test]
    public function login_correcto_devuelve_un_token_que_abre_el_panel(): void
    {
        $this->createAdmin('clave-correcta');

        $token = $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.com', 'password' => 'clave-correcta'])
            ->assertOk()
            ->assertJsonStructure(['token', 'token_type', 'expires_in', 'user' => ['id', 'name', 'email']])
            ->json('token');

        $this->getJson('/api/v1/admin/me', ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->assertJsonFragment(['email' => 'admin@example.com']);
    }

    #[Test]
    public function el_panel_rechaza_peticiones_sin_token_o_con_token_invalido(): void
    {
        $this->getJson('/api/v1/admin/me')->assertStatus(401);
        $this->getJson('/api/v1/admin/me', ['Authorization' => 'Bearer basura'])->assertStatus(401);
        $this->postJson('/api/v1/admin/economy', [])->assertStatus(401);
    }

    #[Test]
    public function logout_invalida_el_token(): void
    {
        $headers = $this->adminHeaders();

        $this->postJson('/api/v1/admin/auth/logout', [], $headers)->assertOk();
        $this->getJson('/api/v1/admin/me', $headers)->assertStatus(401);
    }
}
