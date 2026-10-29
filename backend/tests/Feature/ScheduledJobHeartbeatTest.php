<?php

namespace Tests\Feature;

use App\Models\ScheduledJobRun;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Tests\TestCase;

class ScheduledJobHeartbeatTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // En tests Laravel no re-enruta los eventos de Symfony; en producción sí. Tiene que ir antes de crear la app de consola.
        $this->app->make(Kernel::class)->rerouteSymfonyCommandEvents();
        Artisan::command('bcra:sync-fake-ok', fn () => 0);
        Artisan::command('bcra:sync-fake-fail', fn () => 1);
        Artisan::command('otro:comando', fn () => 0);
    }

    /** `php artisan x` y schedule:run disparan CommandStarting/CommandFinished vía Kernel::handle; Artisan::call no. */
    private function runLikeCli(string $command): void
    {
        $this->app->make(Kernel::class)->handle(new ArrayInput(['command' => $command]), new BufferedOutput());
    }

    public function test_registra_ejecucion_exitosa(): void
    {
        $this->runLikeCli('bcra:sync-fake-ok');

        $run = ScheduledJobRun::where('command', 'bcra:sync-fake-ok')->firstOrFail();
        $this->assertSame('success', $run->status);
        $this->assertSame(0, $run->exit_code);
        $this->assertNotNull($run->finished_at);
    }

    public function test_registra_ejecucion_fallida(): void
    {
        $this->runLikeCli('bcra:sync-fake-fail');

        $run = ScheduledJobRun::where('command', 'bcra:sync-fake-fail')->firstOrFail();
        $this->assertSame('failed', $run->status);
        $this->assertSame(1, $run->exit_code);
    }

    public function test_ignora_comandos_que_no_son_de_sync(): void
    {
        $this->runLikeCli('otro:comando');

        $this->assertSame(0, ScheduledJobRun::where('command', 'otro:comando')->count());
    }

    public function test_metrica_failed_cuenta_solo_la_ultima_ejecucion(): void
    {
        ScheduledJobRun::create(['command' => 'bcra:sync-debts', 'status' => 'failed', 'started_at' => now()->subDays(2), 'finished_at' => now()->subDays(2), 'exit_code' => 1]);
        ScheduledJobRun::create(['command' => 'bcra:sync-debts', 'status' => 'success', 'started_at' => now()->subDay(), 'finished_at' => now()->subDay(), 'exit_code' => 0]);
        ScheduledJobRun::create(['command' => 'bcra:sync-checks', 'status' => 'failed', 'started_at' => now()->subDay(), 'finished_at' => now()->subDay(), 'exit_code' => 1]);

        Artisan::call('bcra:heartbeat', ['metric' => 'failed']);

        $this->assertSame('1', trim(Artisan::output()));
    }

    public function test_metrica_stale_days(): void
    {
        ScheduledJobRun::create(['command' => 'bcra:sync-debts', 'status' => 'success', 'started_at' => now()->subDays(40), 'finished_at' => now()->subDays(40), 'exit_code' => 0]);
        ScheduledJobRun::create(['command' => 'bcra:sync-checks', 'status' => 'success', 'started_at' => now()->subDays(3), 'finished_at' => now()->subDays(3), 'exit_code' => 0]);

        Artisan::call('bcra:heartbeat', ['metric' => 'stale-days']);

        $this->assertSame('40', trim(Artisan::output()));
    }
}
