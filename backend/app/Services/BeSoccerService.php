<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BeSoccerService
{
    private Client $client;
    private string $apiKey;
    private array $cacheTtl;

    public function __construct()
    {
        $this->client = new Client([
            'base_uri' => config('besoccer.base_url'),
            'timeout'  => 15,
        ]);
        $this->apiKey = config('besoccer.api_key');
        $this->cacheTtl = config('besoccer.cache_ttl');
    }

    public function getStandings(array $params = []): array
    {
        $cacheKey = 'besoccer:standings:' . md5(json_encode($params));

        return Cache::remember($cacheKey, $this->cacheTtl['standings'], function () use ($params) {
            return $this->request('/standings', $params);
        });
    }

    public function getPlayerStats(string $playerId): array
    {
        $cacheKey = "besoccer:player:{$playerId}:stats";

        return Cache::remember($cacheKey, $this->cacheTtl['player_stats'], function () use ($playerId) {
            return $this->request("/player/{$playerId}/stats");
        });
    }

    public function getLeagueStats(array $params = []): array
    {
        $cacheKey = 'besoccer:league:stats:' . md5(json_encode($params));

        return Cache::remember($cacheKey, $this->cacheTtl['league_stats'], function () use ($params) {
            return $this->request('/league/stats', $params);
        });
    }

    private function request(string $endpoint, array $params = []): array
    {
        try {
            $params['key'] = $this->apiKey;

            $response = $this->client->get($endpoint, [
                'query' => $params,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return $this->transformResponse($data);
        } catch (GuzzleException $e) {
            Log::error("BeSoccer API error: {$e->getMessage()}", [
                'endpoint' => $endpoint,
                'params'   => $params,
            ]);

            return [
                'success' => false,
                'error'   => 'No se pudo obtener datos de BeSoccer',
                'detail'  => app()->environment('local') ? $e->getMessage() : null,
            ];
        }
    }

    private function transformResponse(?array $data): array
    {
        if ($data === null) {
            return [
                'success' => false,
                'error'   => 'Respuesta vacía de BeSoccer',
            ];
        }

        return [
            'success'    => true,
            'data'       => $data['result'] ?? $data['data'] ?? $data,
            'source'     => 'besoccer',
            'cached'     => false,
            'fetched_at' => now()->toIso8601String(),
        ];
    }
}
