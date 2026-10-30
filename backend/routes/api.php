<?php

use Illuminate\Support\Facades\Route;

// Sitemap (público, sin versión)
Route::get('api/sitemap.xml', ['uses' => 'Api\V1\SitemapController@index']);

Route::group(['prefix' => 'api/v1', 'namespace' => 'Api\V1'], function () {

    // Auth
    Route::post('auth/login', 'AuthController@login');

    // Public endpoints
    Route::get('economy', 'EconomyRecordController@index');
    Route::get('economy/monthly-summary', 'EconomyRecordController@monthlySummary');
    Route::get('economy/overdue-evolution', 'EconomyRecordController@overdueEvolution');
    Route::get('economy/{id}', 'EconomyRecordController@show');
    Route::get('share/{type}/{id}', 'ShareController@page');
    Route::get('share/{type}/{id}/image.png', 'ShareController@image');
    Route::get('contracts', 'ContractController@index');
    Route::get('contracts/stats', 'ContractController@stats');
    Route::get('contracts/recent-moves', 'ContractController@recentMoves');
    Route::get('contracts/representatives', 'ContractController@representatives');
    Route::get('contracts/{id}', 'ContractController@show');
    Route::get('rights', 'RightController@index');
    Route::get('rights/{id}', 'RightController@show');
    Route::get('rumors', 'RumorController@index');
    Route::get('rumors/{id}', 'RumorController@show');
    Route::get('markets', 'MarketController@index');
    Route::get('elections', 'ElectionController@index');
    Route::get('elections/token/{token}', 'ElectionController@showByToken');
    Route::get('elections/slug/{slug}', 'ElectionController@showBySlug');
    Route::get('elections/lists/{id}/logo', 'ElectionController@logo');
    Route::get('elections/candidates/{id}/photo', 'ElectionController@candidatePhoto');
    Route::get('elections/candidates/{id}/cv', 'ElectionController@candidateCv');

    // Balances (public)
    Route::get('balances', 'BalanceController@index');
    Route::get('balances/evolution', 'BalanceController@evolution');
    Route::get('balances/{id}', 'BalanceController@show');
    Route::get('balances/{id}/download', 'BalanceController@download');

    // Section visibility (public)
    Route::get('settings/sections', 'SettingsController@sections');

    // BCRA (public)
    Route::get('bcra/debts', 'BcraController@debts');
    Route::get('bcra/debts/records', 'BcraController@records');
    Route::get('bcra/checks', 'BcraController@rejectedChecks');

    // Stadium (public)
    Route::get('stadium', 'StadiumController@index');

    // Contact
    Route::post('contact', 'ContactController@send');

    // Stats (BeSoccer proxy)
    Route::get('player/{id}/stats', 'StatsController@playerStats');
    Route::get('player/{id}/matches', 'StatsController@playerMatches');
    Route::get('player/{id}', 'StatsController@playerData');
    Route::get('league/stats', 'StatsController@leagueStats');
    Route::get('team', 'StatsController@team');

    // Refresh no necesita jwt.auth: acepta tokens expirados por diseño
    Route::post('admin/auth/refresh', ['uses' => 'Api\V1\AuthController@refresh']);

    // Admin (protected)
    Route::group(['middleware' => 'jwt.auth', 'prefix' => 'admin'], function () {
        // Auth
        Route::get('me', 'AuthController@me');
        Route::post('auth/logout', 'AuthController@logout');
        Route::post('auth/change-password', 'AuthController@changePassword');

        // Settings
        Route::get('settings', 'SettingsController@index');
        Route::put('settings', 'SettingsController@update');

        // Economy CRUD
        Route::post('economy', 'EconomyRecordController@store');
        Route::put('economy/{id}', 'EconomyRecordController@update');
        Route::delete('economy/{id}', 'EconomyRecordController@destroy');

        // Contracts CRUD
        Route::post('contracts', 'ContractController@store');
        Route::put('contracts/{id}', 'ContractController@update');
        Route::delete('contracts/{id}', 'ContractController@destroy');
        Route::post('contracts/{id}/save-as-change', 'ContractController@saveAsChange');

        // Rights CRUD
        Route::post('rights', 'RightController@store');
        Route::put('rights/{id}', 'RightController@update');
        Route::delete('rights/{id}', 'RightController@destroy');

        // Players (extra data hydrated onto BeSoccer squad)
        Route::get('players', 'PlayerController@adminIndex');
        Route::get('players/{id}/extra', 'PlayerController@show');
        Route::put('players/{id}/extra', 'PlayerController@updateExtra');

        // Rumors CRUD
        Route::post('rumors', 'RumorController@store');
        Route::put('rumors/{id}', 'RumorController@update');
        Route::delete('rumors/{id}', 'RumorController@destroy');

        // Markets CRUD
        Route::post('markets', 'MarketController@store');
        Route::put('markets/{id}', 'MarketController@update');
        Route::delete('markets/{id}', 'MarketController@destroy');
        Route::post('markets/{id}/activate', 'MarketController@activate');
        Route::post('markets/deactivate', 'MarketController@deactivate');

        // Balances CRUD
        Route::post('balances', 'BalanceController@store');
        Route::put('balances/{id}', 'BalanceController@update');
        // POST route for file uploads (multipart/form-data support)
        Route::post('balances/{id}/update', 'BalanceController@update');
        Route::delete('balances/{id}', 'BalanceController@destroy');
        Route::post('balances/{id}/analyze', 'BalanceController@analyze');
        Route::post('balances/{id}/apply-analysis', 'BalanceController@applyAnalysis');

        // Balance items (for admin configuration)
        Route::get('balances/items', 'BalanceController@allBalanceItems');

        // Balance lines CRUD (manual editing)
        Route::post('balances/{balanceId}/lines', 'BalanceController@storeLine');
        Route::post('balances/{balanceId}/lines/reorder', 'BalanceController@reorderLines');
        Route::put('balances/{balanceId}/lines/{lineId}', 'BalanceController@updateLine');
        Route::delete('balances/{balanceId}/lines/{lineId}', 'BalanceController@destroyLine');

        // Stadium CRUD
        Route::post('stadium/config', 'StadiumController@storeConfig');
        Route::post('stadium/sectors', 'StadiumController@storeSector');
        Route::put('stadium/sectors/{id}', 'StadiumController@updateSector');
        Route::delete('stadium/sectors/{id}', 'StadiumController@destroySector');

        // Elections CRUD
        Route::get('elections', 'ElectionController@adminIndex');
        Route::post('elections/lists', 'ElectionController@storeList');
        Route::post('elections/lists/{id}/update', 'ElectionController@updateList');
        Route::delete('elections/lists/{id}', 'ElectionController@destroyList');
        Route::post('elections/lists/{listId}/candidates', 'ElectionController@storeCandidate');
        Route::post('elections/candidates/{id}/update', 'ElectionController@updateCandidate');
        Route::delete('elections/candidates/{id}', 'ElectionController@destroyCandidate');
        Route::post('elections/lists/{listId}/proposals', 'ElectionController@storeProposal');
        Route::put('elections/proposals/{id}', 'ElectionController@updateProposal');
        Route::delete('elections/proposals/{id}', 'ElectionController@destroyProposal');
        Route::post('elections/proposals/{proposalId}/commitments', 'ElectionController@storeCommitment');
        Route::put('elections/commitments/{id}', 'ElectionController@updateCommitment');
        Route::delete('elections/commitments/{id}', 'ElectionController@destroyCommitment');

        // Twitter accounts CRUD
        Route::get('twitter/accounts', 'TwitterController@index');
        Route::post('twitter/accounts', 'TwitterController@store');
        Route::put('twitter/accounts/{id}', 'TwitterController@update');
        Route::delete('twitter/accounts/{id}', 'TwitterController@destroy');
    });
});
