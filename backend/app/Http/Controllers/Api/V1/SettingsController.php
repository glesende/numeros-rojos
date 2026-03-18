<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    private const SECTION_KEYS = [
        'section_economia_enabled',
        'section_contratos_enabled',
        'section_balances_enabled',
    ];

    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json(['data' => $settings]);
    }

    public function sections(): JsonResponse
    {
        $settings = Setting::whereIn('key', self::SECTION_KEYS)->pluck('value', 'key');

        $result = [];
        foreach (self::SECTION_KEYS as $key) {
            $result[$key] = ($settings->get($key, '1') === '1');
        }

        return response()->json(['data' => $result]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->validate($request, [
            'data_service'               => 'sometimes|in:disabled,besoccer',
            'besoccer_api_key'           => 'sometimes|nullable|string',
            'besoccer_team_id'           => 'sometimes|nullable|string|max:50',
            'openai_api_key'             => 'sometimes|nullable|string',
            'openai_model'               => 'sometimes|nullable|string|max:100',
            'section_economia_enabled'   => 'sometimes|boolean',
            'section_contratos_enabled'  => 'sometimes|boolean',
            'section_balances_enabled'   => 'sometimes|boolean',
        ]);

        $allowed = [
            'data_service', 'besoccer_api_key', 'besoccer_team_id', 'openai_api_key', 'openai_model',
            'section_economia_enabled', 'section_contratos_enabled', 'section_balances_enabled',
        ];

        foreach ($request->only($allowed) as $key => $value) {
            // Normalize booleans to '1'/'0' strings for storage
            if (in_array($key, self::SECTION_KEYS)) {
                $value = $value ? '1' : '0';
            }
            Setting::set($key, $value);
        }

        $settings = Setting::all()->pluck('value', 'key');
        return response()->json(['data' => $settings]);
    }
}
