<?php

return [
    'api_key'  => env('BESOCCER_API_KEY', ''),
    'base_url' => env('BESOCCER_BASE_URL', 'https://apiv3.besoccer.com'),

    'cache_ttl' => [
        'standings'    => (int) env('CACHE_TTL_STANDINGS', 3600),
        'player_stats' => (int) env('CACHE_TTL_PLAYER_STATS', 1800),
        'league_stats' => (int) env('CACHE_TTL_LEAGUE_STATS', 3600),
    ],
];
