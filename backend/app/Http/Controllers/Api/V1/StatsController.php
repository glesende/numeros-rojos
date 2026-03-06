<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\BeSoccerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    private BeSoccerService $besoccer;

    public function __construct(BeSoccerService $besoccer)
    {
        $this->besoccer = $besoccer;
    }

    public function standings(Request $request): JsonResponse
    {
        $params = $request->only(['league', 'season', 'round']);
        $data = $this->besoccer->getStandings($params);

        if (!($data['success'] ?? false)) {
            return response()->json($data, 502);
        }

        return response()->json($data);
    }

    public function playerStats(string $id): JsonResponse
    {
        $data = $this->besoccer->getPlayerStats($id);

        if (!($data['success'] ?? false)) {
            return response()->json($data, 502);
        }

        return response()->json($data);
    }

    public function leagueStats(Request $request): JsonResponse
    {
        $params = $request->only(['league', 'season']);
        $data = $this->besoccer->getLeagueStats($params);

        if (!($data['success'] ?? false)) {
            return response()->json($data, 502);
        }

        return response()->json($data);
    }
}
