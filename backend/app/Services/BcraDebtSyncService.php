<?php

namespace App\Services;

use App\Models\BankDebt;
use App\Models\Setting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Mail;

class BcraDebtSyncService
{
    private const BASE_URL = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/Historicas/';

    private Client $httpClient;

    public function __construct()
    {
        $this->httpClient = new Client(['timeout' => 60]);
    }

    /**
     * Fetches the historical debt report for the configured CUIT and inserts
     * whatever rows (identifier + period + entity) are not already stored.
     *
     * Returns null when there is no CUIT configured — nothing to do, nothing to email.
     *
     * @return array{identifier: string, periods: int, rows_seen: int, rows_inserted: int}|null
     */
    public function run(): ?array
    {
        $cuit = Setting::get('bcra_cuit');
        if (empty($cuit)) {
            return null;
        }

        $periods      = $this->fetchDebts($cuit);
        $rowsSeen     = 0;
        $rowsInserted = 0;

        foreach ($periods as $period) {
            foreach ($period['entidades'] ?? [] as $entity) {
                $rowsSeen++;

                $debt = BankDebt::firstOrCreate(
                    [
                        'identifier' => $cuit,
                        'period'     => $period['periodo'],
                        'entity'     => $entity['entidad'],
                    ],
                    [
                        'amount'           => $entity['monto'] ?? 0,
                        'situation'        => $entity['situacion'] ?? 0,
                        'under_review'     => $entity['enRevision'] ?? false,
                        'legal_proceeding' => $entity['procesoJud'] ?? false,
                    ]
                );

                if ($debt->wasRecentlyCreated) {
                    $rowsInserted++;
                }
            }
        }

        $report = [
            'identifier'    => $cuit,
            'periods'       => count($periods),
            'rows_seen'     => $rowsSeen,
            'rows_inserted' => $rowsInserted,
        ];

        $this->sendEmail($report);

        return $report;
    }

    private function fetchDebts(string $cuit): array
    {
        try {
            $response = $this->httpClient->get(self::BASE_URL . $cuit, ['http_errors' => false]);
            $data     = json_decode($response->getBody()->getContents(), true) ?? [];

            if ($response->getStatusCode() === 404) {
                return [];
            }

            if ($response->getStatusCode() !== 200) {
                $message = implode(', ', $data['errorMessages'] ?? ['respuesta inesperada del BCRA']);
                throw new \RuntimeException("Error al consultar deudas del BCRA: {$message}");
            }

            return $data['results']['periodos'] ?? [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException('Error al consultar deudas del BCRA: ' . $e->getMessage());
        }
    }

    private function sendEmail(array $report): void
    {
        $adminEmail = env('ADMIN_EMAIL');
        if (!$adminEmail) {
            return;
        }

        $hasNews = $report['rows_inserted'] > 0;
        $subject = $hasNews
            ? 'Números Rojos – BCRA: nuevas deudas registradas'
            : 'Números Rojos – BCRA: sin novedades';

        $lines   = [];
        $lines[] = 'SINCRONIZACIÓN DE DEUDAS BANCARIAS (BCRA)';
        $lines[] = str_repeat('─', 60);
        $lines[] = '';
        $lines[] = "CUIT consultado    : {$report['identifier']}";
        $lines[] = "Períodos recibidos  : {$report['periods']}";
        $lines[] = "Filas recibidas     : {$report['rows_seen']}";
        $lines[] = "Filas nuevas        : {$report['rows_inserted']}";
        $lines[] = '';
        $lines[] = $hasNews
            ? 'Se insertaron registros nuevos de deuda bancaria.'
            : 'No se encontraron registros nuevos respecto de la última ejecución.';

        $body = implode("\n", $lines);

        Mail::raw($body, function ($message) use ($adminEmail, $subject) {
            $message->to($adminEmail)->subject($subject);
        });
    }
}
