<?php

namespace App\Services;

use App\Models\RejectedCheck;
use App\Models\Setting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Mail;

class BcraCheckSyncService
{
    private const BASE_URL = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/ChequesRechazados/';

    private Client $httpClient;

    public function __construct()
    {
        $this->httpClient = new Client(['timeout' => 60]);
    }

    /**
     * Fetches rejected checks for the configured CUIT and inserts whatever rows
     * (identifier + check_number + entity) are not already stored.
     *
     * Returns null when there is no CUIT configured — nothing to do, nothing to email.
     *
     * @return array{identifier: string, causes: int, rows_seen: int, rows_inserted: int}|null
     */
    public function run(): ?array
    {
        $cuit = Setting::get('bcra_cuit');
        if (empty($cuit)) {
            return null;
        }

        $causales     = $this->fetchRejectedChecks($cuit);
        $rowsSeen     = 0;
        $rowsInserted = 0;

        foreach ($causales as $causal) {
            foreach ($causal['entidades'] ?? [] as $entity) {
                foreach ($entity['detalle'] ?? [] as $check) {
                    $rowsSeen++;

                    $record = RejectedCheck::firstOrCreate(
                        [
                            'identifier'   => $cuit,
                            'check_number' => $check['nroCheque'],
                            'entity'       => $entity['entidad'],
                        ],
                        [
                            'cause'              => $causal['causal'] ?? '',
                            'rejection_date'     => $check['fechaRechazo'],
                            'amount'             => $check['monto'] ?? 0,
                            'payment_date'       => $check['fechaPago'] ?? null,
                            'fine_payment_date'  => $check['fechaPagoMulta'] ?? null,
                            'fine_status'        => $check['estadoMulta'] ?? null,
                            'personal_account'   => $check['ctaPersonal'] ?? false,
                            'legal_entity_name'  => $check['denomJuridica'] ?? null,
                            'under_review'       => $check['enRevision'] ?? false,
                            'legal_proceeding'   => $check['procesoJud'] ?? false,
                        ]
                    );

                    if ($record->wasRecentlyCreated) {
                        $rowsInserted++;
                    }
                }
            }
        }

        $report = [
            'identifier'    => $cuit,
            'causes'        => count($causales),
            'rows_seen'     => $rowsSeen,
            'rows_inserted' => $rowsInserted,
        ];

        $this->sendEmail($report);

        return $report;
    }

    private function fetchRejectedChecks(string $cuit): array
    {
        try {
            $response = $this->httpClient->get(self::BASE_URL . $cuit, ['http_errors' => false]);
            $data     = json_decode($response->getBody()->getContents(), true) ?? [];

            if ($response->getStatusCode() === 404) {
                return [];
            }

            if ($response->getStatusCode() !== 200) {
                $message = implode(', ', $data['errorMessages'] ?? ['respuesta inesperada del BCRA']);
                throw new \RuntimeException("Error al consultar cheques rechazados del BCRA: {$message}");
            }

            return $data['results']['causales'] ?? [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException('Error al consultar cheques rechazados del BCRA: ' . $e->getMessage());
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
            ? 'Números Rojos – BCRA: nuevos cheques rechazados registrados'
            : 'Números Rojos – BCRA: sin novedades en cheques rechazados';

        $lines   = [];
        $lines[] = 'SINCRONIZACIÓN DE CHEQUES RECHAZADOS (BCRA)';
        $lines[] = str_repeat('─', 60);
        $lines[] = '';
        $lines[] = "CUIT consultado    : {$report['identifier']}";
        $lines[] = "Causales recibidas  : {$report['causes']}";
        $lines[] = "Cheques recibidos   : {$report['rows_seen']}";
        $lines[] = "Cheques nuevos      : {$report['rows_inserted']}";
        $lines[] = '';
        $lines[] = $hasNews
            ? 'Se registraron cheques rechazados nuevos.'
            : 'No se encontraron cheques rechazados nuevos respecto de la última ejecución.';

        $body = implode("\n", $lines);

        Mail::raw($body, function ($message) use ($adminEmail, $subject) {
            $message->to($adminEmail)->subject($subject);
        });
    }
}
