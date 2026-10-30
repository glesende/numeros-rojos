<?php

use App\Http\Middleware\Authenticate;
use App\Http\Middleware\CorsMiddleware;
use App\Http\Middleware\JwtMiddleware;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(using: function () {
        // Sin los grupos de middleware "web"/"api" de Laravel (sesión, CSRF, prefijo /api):
        // las rutas llevan solo los middlewares que declaran, como en Lumen.
        Route::namespace('App\Http\Controllers')->group(function () {
            require base_path('routes/web.php');
            require base_path('routes/api.php');
        });
    })
    ->withMiddleware(function (Middleware $middleware): void {
        // Mismo comportamiento que con Lumen: sin recortar strings ni convertir "" en null,
        // y CORS propio en lugar de HandleCors.
        $middleware->remove([TrimStrings::class, ConvertEmptyStringsToNull::class, HandleCors::class]);
        $middleware->append(CorsMiddleware::class);

        $middleware->alias([
            'auth'     => Authenticate::class,
            'jwt.auth' => JwtMiddleware::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        //$schedule->command('twitter:monitor --dry-run')
        //    ->dailyAt('08:10')
        //    ->appendOutputTo(storage_path('logs/twitter-monitor.log'));

        $schedule->command('bcra:sync-debts')
            ->monthlyOn(1, '03:00')
            ->appendOutputTo(storage_path('logs/bcra-debts.log'));

        $schedule->command('bcra:sync-checks')
            ->monthlyOn(1, '03:10')
            ->appendOutputTo(storage_path('logs/bcra-checks.log'));

        $schedule->command('bcra:sync-quotes')
            ->weeklyOn(1, '04:00')
            ->appendOutputTo(storage_path('logs/bcra-quotes.log'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Request $request) {
            // Laravel ya convirtió ModelNotFoundException en un 404 genérico; se recupera el formato propio
            if ($e->getPrevious() instanceof ModelNotFoundException) {
                return response()->json(['error' => 'Recurso no encontrado'], 404);
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'error'   => 'Datos inválidos',
                    'details' => $e->errors(),
                ], 422);
            }

            return null;
        });
    })->create();
