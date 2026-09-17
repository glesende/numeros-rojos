<?php

namespace App\Services;

use App\Models\UsdQuote;
use Carbon\Carbon;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class BcraQuoteSyncService
{
    private const BASE_URL   = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD';
    private const PAGE_LIMIT = 1000;
    private const INITIAL_LOAD_DATE = '2010-01-01';

    private Client $httpClient;

    public function __construct()
    {
        $this->httpClient = new Client(['timeout' => 60]);
    }

    /**
     * Fetches every USD quote between the last one stored (or 2010-01-01 on
     * the very first run) and today, upserting by date.
     *
     * @return array{from: ?string, to: string, fetched: int, inserted: int, updated: int}
     */
    public function run(): array
    {
        $lastDate = UsdQuote::max('quote_date');
        $from     = $lastDate ? Carbon::parse($lastDate)->addDay() : Carbon::parse(self::INITIAL_LOAD_DATE);
        $to       = Carbon::today();

        if ($from->gt($to)) {
            return ['from' => null, 'to' => $to->toDateString(), 'fetched' => 0, 'inserted' => 0, 'updated' => 0];
        }

        $fetched  = 0;
        $inserted = 0;
        $updated  = 0;
        $offset   = 0;

        do {
            $page = $this->fetchPage($from->toDateString(), $to->toDateString(), $offset);

            foreach ($page['results'] as $result) {
                $detalle = $result['detalle'][0] ?? null;
                if (!$detalle || empty($result['fecha'])) {
                    continue;
                }

                $quote = UsdQuote::updateOrCreate(
                    ['quote_date' => $result['fecha']],
                    ['rate' => $detalle['tipoCotizacion']]
                );

                $fetched++;
                $quote->wasRecentlyCreated ? $inserted++ : $updated++;
            }

            $offset += self::PAGE_LIMIT;
        } while ($offset < $page['count']);

        return [
            'from'     => $from->toDateString(),
            'to'       => $to->toDateString(),
            'fetched'  => $fetched,
            'inserted' => $inserted,
            'updated'  => $updated,
        ];
    }

    private function fetchPage(string $from, string $to, int $offset): array
    {
        try {
            $response = $this->httpClient->get(self::BASE_URL, [
                'query' => [
                    'fechaDesde' => $from,
                    'fechaHasta' => $to,
                    'offset'     => $offset,
                    'limit'      => self::PAGE_LIMIT,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true) ?? [];

            return [
                'results' => $data['results'] ?? [],
                'count'   => $data['metadata']['resultset']['count'] ?? 0,
            ];
        } catch (GuzzleException $e) {
            throw new \RuntimeException('Error al consultar cotizaciones del BCRA: ' . $e->getMessage());
        }
    }
}
