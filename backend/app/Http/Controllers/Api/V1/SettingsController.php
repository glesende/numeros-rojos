<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->validate($request, [
            'data_service'     => 'sometimes|in:disabled,besoccer',
            'besoccer_api_key' => 'sometimes|nullable|string',
            'openai_api_key'   => 'sometimes|nullable|string',
            'openai_model'     => 'sometimes|nullable|string|max:100',
        ]);

        foreach ($request->only(['data_service', 'besoccer_api_key', 'openai_api_key', 'openai_model']) as $key => $value) {
            Setting::set($key, $value);
        }

        $settings = Setting::all()->pluck('value', 'key');
        return response()->json(['data' => $settings]);
    }
}
