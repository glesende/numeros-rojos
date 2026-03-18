<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
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

    public function team(Request $request): JsonResponse
    {
        $teamId = $request->query('team') ?: Setting::get('besoccer_team_id');

        if (!$teamId) {
            return response()->json(['success' => false, 'error' => 'ID de equipo no configurado'], 422);
        }

        $data = $this->besoccer->getTeam($teamId);

        if (!($data['success'] ?? false)) {
            return response()->json($data, 502);
        }

        return response()->json($data);
    }

    public function playerMatches(string $id): JsonResponse
    {
        $data = $this->besoccer->getPlayerMatches($id);

        if (!($data['success'] ?? false)) {
            return response()->json($data, 502);
        }

        return response()->json($data);
    }
}
