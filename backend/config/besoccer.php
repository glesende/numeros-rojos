<?php

return [
    'base_url' => env('BESOCCER_BASE_URL', 'https://apiclient.besoccerapps.com/scripts/api'),

    'cache_ttl' => [
        'standings'    => (int) env('CACHE_TTL_STANDINGS', 3600),
        'player_stats' => (int) env('CACHE_TTL_PLAYER_STATS', 1800),
        'league_stats' => (int) env('CACHE_TTL_LEAGUE_STATS', 3600),
        'player_data'  => (int) env('CACHE_TTL_PLAYER_DATA', 86400),
    ],
];
