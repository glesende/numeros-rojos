<?php

namespace App\Services;

use App\Models\Setting;
use Carbon\Carbon;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BeSoccerService
{
    private Client $client;
    private ?string $apiKey;
    private array $cacheTtl;
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('besoccer.base_url');
        $this->client = new Client([
            'timeout' => 15,
        ]);
        $settingKey = Setting::get('besoccer_api_key');
        $this->apiKey = $settingKey ?: config('besoccer.api_key') ?: null;
        $this->cacheTtl = config('besoccer.cache_ttl');
    }

    public function isEnabled(): bool
    {
        return Setting::get('data_service', 'disabled') === 'besoccer' && !empty($this->apiKey);
    }

    public function getStandings(array $params = []): array
    {
        if (!$this->isEnabled()) {
            return ['success' => false, 'error' => 'Servicio de datos desactivado'];
        }

        $cacheKey = 'besoccer:standings:' . md5(json_encode($params));

        return Cache::remember($cacheKey, $this->cacheTtl['standings'], function () use ($params) {
            return $this->request('/standings', $params);
        });
    }

    public function getPlayerStats(string $playerId): array
    {
        if (!$this->isEnabled()) {
            return ['success' => false, 'error' => 'Servicio de datos desactivado'];
        }

        $cacheKey = "besoccer:player:{$playerId}:stats";

        return Cache::remember($cacheKey, $this->cacheTtl['player_stats'], function () use ($playerId) {
            return $this->request("/player/{$playerId}/stats");
        });
    }

    public function getLeagueStats(array $params = []): array
    {
        if (!$this->isEnabled()) {
            return ['success' => false, 'error' => 'Servicio de datos desactivado'];
        }

        $cacheKey = 'besoccer:league:stats:' . md5(json_encode($params));

        return Cache::remember($cacheKey, $this->cacheTtl['league_stats'], function () use ($params) {
            return $this->request('/league/stats', $params);
        });
    }

    public function getPlayerByExternalId(string $externalId): array
    {
        if (!$this->isEnabled()) {
            return ['success' => false, 'error' => 'Servicio de datos desactivado'];
        }

        $cacheKey = "besoccer:player:{$externalId}:data";
        $ttl = rand(172800, 432000);

        return Cache::remember($cacheKey, $ttl, function () use ($externalId) {
            return $this->request('/api.php', [
                'format' => 'json',
                'req'    => 'player',
                'id'     => $externalId,
            ]);
        });
    }

    private function request(string $endpoint, array $params = []): array
    {
        try {
            $params['key'] = $this->apiKey;

            $url = rtrim($this->baseUrl, '/') . $endpoint;

            $response = $this->client->get($url, [
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
            'fetched_at' => Carbon::now()->toIso8601String(),
        ];
    }
}
