<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

abstract class TestCase extends BaseTestCase
{
    use DatabaseTransactions;

    private const EXPECTED_TEST_DATABASE = 'numeros_rojos_testing';

    /**
     * tests/bootstrap.php ya migró numeros_rojos_testing para toda la corrida. Cada app de
     * test tiene que resolver esa misma base: si no, se aborta antes de que
     * DatabaseTransactions toque la base real.
     */
    public function createApplication()
    {
        foreach (['APP_ENV' => 'testing', 'DB_DATABASE' => self::EXPECTED_TEST_DATABASE, 'CACHE_DRIVER' => 'array'] as $key => $value) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }

        $app = parent::createApplication();

        $actualDatabase = $app->make('config')->get('database.connections.mysql.database');
        if ($actualDatabase !== self::EXPECTED_TEST_DATABASE) {
            fwrite(STDERR, "\nABORTANDO: la app de test resolvió la base de datos \"{$actualDatabase}\" en vez de \"" . self::EXPECTED_TEST_DATABASE . "\".\n");
            exit(1);
        }

        return $app;
    }

    protected function createAdmin(string $password = 'secret-password'): User
    {
        return User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => Hash::make($password)]);
    }

    /** Cabeceras de un admin autenticado con JWT */
    protected function adminHeaders(): array
    {
        return ['Authorization' => 'Bearer ' . JWTAuth::fromUser($this->createAdmin())];
    }
}
