<?php

/** @var \Laravel\Lumen\Routing\Router $router */

// Sitemap (público, sin versión)
$router->get('api/sitemap.xml', ['uses' => 'Api\V1\SitemapController@index']);

$router->group(['prefix' => 'api/v1', 'namespace' => 'Api\V1'], function () use ($router) {

    // Auth
    $router->post('auth/login', 'AuthController@login');

    // Public endpoints
    $router->get('economy', 'EconomyRecordController@index');
    $router->get('economy/monthly-summary', 'EconomyRecordController@monthlySummary');
    $router->get('economy/{id}', 'EconomyRecordController@show');
    $router->get('contracts', 'ContractController@index');
    $router->get('contracts/{id}', 'ContractController@show');

    // Balances (public)
    $router->get('balances', 'BalanceController@index');
    $router->get('balances/evolution', 'BalanceController@evolution');
    $router->get('balances/{id}', 'BalanceController@show');
    $router->get('balances/{id}/download', 'BalanceController@download');

    // Section visibility (public)
    $router->get('settings/sections', 'SettingsController@sections');

    // Stadium (public)
    $router->get('stadium', 'StadiumController@index');

    // Stats (BeSoccer proxy)
    $router->get('standings', 'StatsController@standings');
    $router->get('player/{id}/stats', 'StatsController@playerStats');
    $router->get('player/{id}/matches', 'StatsController@playerMatches');
    $router->get('league/stats', 'StatsController@leagueStats');
    $router->get('team', 'StatsController@team');

    // Admin (protected)
    $router->group(['middleware' => 'jwt.auth', 'prefix' => 'admin'], function () use ($router) {
        // Auth
        $router->get('me', 'AuthController@me');
        $router->post('auth/refresh', 'AuthController@refresh');
        $router->post('auth/logout', 'AuthController@logout');
        $router->post('auth/change-password', 'AuthController@changePassword');

        // Settings
        $router->get('settings', 'SettingsController@index');
        $router->put('settings', 'SettingsController@update');

        // Economy CRUD
        $router->post('economy', 'EconomyRecordController@store');
        $router->put('economy/{id}', 'EconomyRecordController@update');
        $router->delete('economy/{id}', 'EconomyRecordController@destroy');

        // Contracts CRUD
        $router->post('contracts', 'ContractController@store');
        $router->put('contracts/{id}', 'ContractController@update');
        $router->delete('contracts/{id}', 'ContractController@destroy');

        // Balances CRUD
        $router->post('balances', 'BalanceController@store');
        $router->put('balances/{id}', 'BalanceController@update');
        // POST route for file uploads (multipart/form-data support)
        $router->post('balances/{id}/update', 'BalanceController@update');
        $router->delete('balances/{id}', 'BalanceController@destroy');
        $router->post('balances/{id}/analyze', 'BalanceController@analyze');
        $router->post('balances/{id}/apply-analysis', 'BalanceController@applyAnalysis');

        // Balance lines CRUD (manual editing)
        $router->post('balances/{balanceId}/lines', 'BalanceController@storeLine');
        $router->put('balances/{balanceId}/lines/{lineId}', 'BalanceController@updateLine');
        $router->delete('balances/{balanceId}/lines/{lineId}', 'BalanceController@destroyLine');

        // Stadium CRUD
        $router->post('stadium/config', 'StadiumController@storeConfig');
        $router->post('stadium/sectors', 'StadiumController@storeSector');
        $router->put('stadium/sectors/{id}', 'StadiumController@updateSector');
        $router->delete('stadium/sectors/{id}', 'StadiumController@destroySector');
    });
});
