<?php

require __DIR__ . '/../vendor/autoload.php';

// Migramos la base de test UNA sola vez para toda la corrida — DatabaseTransactions en
// TestCase.php aísla cada test con un rollback. Nunca contra la base de desarrollo.
foreach (['APP_ENV' => 'testing', 'DB_DATABASE' => 'numeros_rojos_testing', 'CACHE_DRIVER' => 'array'] as $key => $value) {
    putenv("{$key}={$value}");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$actualDatabase = $app->make('config')->get('database.connections.mysql.database');
if ($actualDatabase !== 'numeros_rojos_testing') {
    fwrite(STDERR, "\nABORTANDO: la app de test resolvió la base de datos \"{$actualDatabase}\" en vez de \"numeros_rojos_testing\". No se migra para no arriesgar la base real.\n");
    exit(1);
}

$kernel->call('migrate:fresh');

// Esta app solo sirve para migrar: se retiran sus manejadores de errores globales para que
// PHPUnit no marque cada test como "risky" cuando la app de cada test instala los suyos.
Illuminate\Foundation\Bootstrap\HandleExceptions::flushState();
