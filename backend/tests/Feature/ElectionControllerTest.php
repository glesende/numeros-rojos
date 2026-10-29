<?php

namespace Tests\Feature;

use App\Models\ElectionList;
use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ElectionControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function crearLista(array $overrides = []): ElectionList
    {
        return ElectionList::create($overrides + [
            'token' => bin2hex(random_bytes(8)), 'slug' => 'lista-' . bin2hex(random_bytes(3)),
            'name' => 'Lista Roja', 'is_active' => true,
        ]);
    }

    private function habilitarSeccion(): void
    {
        Setting::set('section_elecciones_enabled', '1');
    }

    #[Test]
    public function el_indice_publico_da_404_con_la_seccion_deshabilitada(): void
    {
        $this->crearLista();
        $this->getJson('/api/v1/elections')->assertStatus(404);
        $this->getJson('/api/v1/elections/slug/cualquiera')->assertStatus(404);
    }

    #[Test]
    public function el_indice_publico_lista_solo_activas_y_oculta_campos_privados(): void
    {
        $this->habilitarSeccion();
        $activa = $this->crearLista(['name' => 'Activa']);
        $this->crearLista(['name' => 'Inactiva', 'is_active' => false]);

        $response = $this->getJson('/api/v1/elections')->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($activa->slug, $response->json('data.0.slug'));
        $this->assertArrayNotHasKey('token', $response->json('data.0'));
        $this->assertArrayNotHasKey('is_active', $response->json('data.0'));
    }

    #[Test]
    public function por_slug_responde_la_lista_y_404_si_no_existe(): void
    {
        $this->habilitarSeccion();
        $lista = $this->crearLista();

        $this->getJson("/api/v1/elections/slug/{$lista->slug}")->assertOk()->assertJsonPath('data.name', 'Lista Roja');
        $this->getJson('/api/v1/elections/slug/no-existe')->assertStatus(404);
    }

    #[Test]
    public function por_token_funciona_con_la_seccion_deshabilitada_y_expone_campos_privados(): void
    {
        $lista = $this->crearLista();

        $this->getJson("/api/v1/elections/token/{$lista->token}")
            ->assertOk()
            ->assertJsonPath('data.token', $lista->token)
            ->assertJsonPath('data.is_active', true);
    }

    #[Test]
    public function el_admin_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/admin/elections')->assertStatus(401);
        $this->postJson('/api/v1/admin/elections/lists', ['name' => 'X'])->assertStatus(401);
    }

    #[Test]
    public function ciclo_completo_de_lista_candidatos_propuestas_y_compromisos(): void
    {
        $h = $this->adminHeaders();

        $listaId = $this->postJson('/api/v1/admin/elections/lists', [
            'name' => 'Unidos por Independiente', 'twitter_user' => '@unidos', 'instagram_user' => '  ',
        ], $h)->assertStatus(201)
            ->assertJsonPath('data.slug', 'unidos-por-independiente')
            ->assertJsonPath('data.twitter_user', 'unidos')
            ->assertJsonPath('data.instagram_user', null)
            ->json('data.id');

        // el slug se desambigua si ya existe
        $this->postJson('/api/v1/admin/elections/lists', ['name' => 'Unidos por Independiente'], $h)
            ->assertStatus(201)->assertJsonPath('data.slug', 'unidos-por-independiente-2');

        $candidatoId = $this->postJson("/api/v1/admin/elections/lists/{$listaId}/candidates", [
            'first_name' => 'Ana', 'last_name' => 'Pérez', 'position' => 'Presidente',
        ], $h)->assertStatus(201)->json('data.id');

        $propuestaId = $this->postJson("/api/v1/admin/elections/lists/{$listaId}/proposals", [
            'title' => 'Estadio', 'description' => 'Ampliar la capacidad',
        ], $h)->assertStatus(201)->json('data.id');

        $compromisoId = $this->postJson("/api/v1/admin/elections/proposals/{$propuestaId}/commitments", [
            'kind' => 'meta', 'description' => '60.000 lugares', 'metric_value' => 60000, 'metric_unit' => 'lugares',
        ], $h)->assertStatus(201)->json('data.id');

        $this->getJson('/api/v1/admin/elections', $h)->assertOk()
            ->assertJsonPath('data.0.candidates.0.last_name', 'Pérez')
            ->assertJsonPath('data.0.proposals.0.commitments.0.description', '60.000 lugares');

        $this->postJson("/api/v1/admin/elections/candidates/{$candidatoId}/update", ['position' => 'Vice'], $h)
            ->assertOk()->assertJsonPath('data.position', 'Vice');
        $this->putJson("/api/v1/admin/elections/proposals/{$propuestaId}", ['title' => 'Estadio nuevo'], $h)
            ->assertOk()->assertJsonPath('data.title', 'Estadio nuevo');
        $this->putJson("/api/v1/admin/elections/commitments/{$compromisoId}", ['deadline' => '2028'], $h)
            ->assertOk()->assertJsonPath('data.deadline', '2028');
        $this->postJson("/api/v1/admin/elections/lists/{$listaId}/update", ['name' => 'Renombrada', 'is_active' => false, 'twitter_user' => '', 'instagram_user' => '@ig'], $h)
            ->assertOk()->assertJsonPath('data.name', 'Renombrada')->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.twitter_user', null)->assertJsonPath('data.instagram_user', 'ig');

        $this->deleteJson("/api/v1/admin/elections/commitments/{$compromisoId}", [], $h)->assertOk();
        $this->deleteJson("/api/v1/admin/elections/proposals/{$propuestaId}", [], $h)->assertOk();
        $this->deleteJson("/api/v1/admin/elections/candidates/{$candidatoId}", [], $h)->assertOk();
        $this->deleteJson("/api/v1/admin/elections/lists/{$listaId}", [], $h)->assertOk();
        $this->assertNull(ElectionList::find($listaId));
    }

    #[Test]
    public function validaciones_de_los_formularios_admin(): void
    {
        $h     = $this->adminHeaders();
        $lista = $this->crearLista();

        $this->postJson('/api/v1/admin/elections/lists', [], $h)->assertStatus(422);
        $this->postJson("/api/v1/admin/elections/lists/{$lista->id}/candidates", ['first_name' => 'Solo nombre'], $h)->assertStatus(422);
        $this->postJson("/api/v1/admin/elections/lists/{$lista->id}/proposals", ['title' => 'Sin descripción'], $h)->assertStatus(422);
        $p = $lista->proposals()->create(['title' => 'T', 'description' => 'D']);
        $this->postJson("/api/v1/admin/elections/proposals/{$p->id}/commitments", ['description' => 'x', 'kind' => 'otro'], $h)->assertStatus(422);
        $this->postJson('/api/v1/admin/elections/lists/999999/candidates', ['first_name' => 'a', 'last_name' => 'b', 'position' => 'c'], $h)->assertStatus(404);
    }

    #[Test]
    public function archivos_de_lista_y_candidato_se_suben_se_sirven_y_se_borran(): void
    {
        $h = $this->adminHeaders();

        $lista = $this->postJson('/api/v1/admin/elections/lists', [
            'name' => 'Con logo', 'logo' => UploadedFile::fake()->create('logo.png', 10, 'image/png'),
        ], $h)->assertStatus(201)->json('data');
        Storage::disk('local')->assertExists($lista['logo_path']);

        $cand = $this->postJson("/api/v1/admin/elections/lists/{$lista['id']}/candidates", [
            'first_name' => 'Ana', 'last_name' => 'Pérez', 'position' => 'Presidente',
            'photo' => UploadedFile::fake()->create('foto.jpg', 10, 'image/jpeg'),
            'cv' => UploadedFile::fake()->create('cv.pdf', 10, 'application/pdf'),
        ], $h)->assertStatus(201)->json('data');
        Storage::disk('local')->assertExists($cand['photo_path']);
        Storage::disk('local')->assertExists($cand['cv_path']);

        $this->get("/api/v1/elections/lists/{$lista['id']}/logo")->assertOk();
        $this->get("/api/v1/elections/candidates/{$cand['id']}/photo")->assertOk();
        $this->get("/api/v1/elections/candidates/{$cand['id']}/cv")->assertOk()->assertDownload('cv.pdf');

        // reemplazar archivos borra los anteriores
        $this->postJson("/api/v1/admin/elections/lists/{$lista['id']}/update", ['logo' => UploadedFile::fake()->create('nuevo.png', 10, 'image/png')], $h)->assertOk();
        Storage::disk('local')->assertMissing($lista['logo_path']);
        $this->postJson("/api/v1/admin/elections/candidates/{$cand['id']}/update", [
            'photo' => UploadedFile::fake()->create('otra.jpg', 10, 'image/jpeg'),
            'cv' => UploadedFile::fake()->create('cv2.pdf', 10, 'application/pdf'),
        ], $h)->assertOk();
        Storage::disk('local')->assertMissing($cand['photo_path']);
        Storage::disk('local')->assertMissing($cand['cv_path']);

        // borrar la lista borra los archivos de sus candidatos
        $actual = \App\Models\ElectionCandidate::findOrFail($cand['id']);
        Storage::disk('local')->assertExists($actual->photo_path);
        $this->deleteJson("/api/v1/admin/elections/lists/{$lista['id']}", [], $h)->assertOk();
        Storage::disk('local')->assertMissing($actual->photo_path);
        Storage::disk('local')->assertMissing($actual->cv_path);
    }

    #[Test]
    public function archivos_inexistentes_responden_404(): void
    {
        $lista = $this->crearLista();
        $cand  = $lista->candidates()->create(['first_name' => 'A', 'last_name' => 'B', 'position' => 'C']);

        $this->getJson("/api/v1/elections/lists/{$lista->id}/logo")->assertStatus(404);
        $this->getJson("/api/v1/elections/candidates/{$cand->id}/photo")->assertStatus(404);
        $this->getJson("/api/v1/elections/candidates/{$cand->id}/cv")->assertStatus(404);
        $this->getJson('/api/v1/elections/lists/999999/logo')->assertStatus(404);
    }
}
