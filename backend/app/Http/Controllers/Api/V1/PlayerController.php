<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\PlayerExtra;
use App\Models\Right;
use App\Models\Rumor;
use App\Models\Setting;
use App\Services\BeSoccerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PlayerController extends Controller
{
    private BeSoccerService $besoccer;

    public function __construct(BeSoccerService $besoccer)
    {
        $this->besoccer = $besoccer;
    }

    public function adminIndex(): JsonResponse
    {
        $teamId = Setting::get('besoccer_team_id');

        if (!$teamId) {
            return response()->json(['success' => false, 'error' => 'ID de equipo no configurado'], 422);
        }

        $data = $this->besoccer->getTeam($teamId);

        if (!($data['success'] ?? false)) {
            return response()->json($data, 502);
        }

        $squad = $data['data']['team']['squad'] ?? [];

        $squadIds = array_values(array_filter(array_map(fn ($p) => (string) ($p['id'] ?? ''), $squad)));
        $allExtras = PlayerExtra::all()->keyBy('besoccer_player_id');
        $allIds = array_values(array_unique(array_merge($squadIds, $allExtras->keys()->all())));

        // Determine, per player id, in which other admin sections it's referenced —
        // used both for the per-section badges and the "Ninguno" cleanup filter.
        $squadSet     = array_flip($squadIds);
        $contractSet  = array_flip(Contract::whereIn('external_id', $allIds)->distinct()->pluck('external_id')->all());
        $rumorSet     = array_flip(Rumor::whereIn('external_id', $allIds)->distinct()->pluck('external_id')->all());
        $rightSet     = array_flip(Right::whereIn('external_id', $allIds)->distinct()->pluck('external_id')->all());

        // "Vigente" mirrors the definition used in the Contratos admin section: the
        // player's current (non-historical) contract hasn't expired or been terminated.
        $now = Carbon::now();
        $vigenteSet = array_flip(
            Contract::whereNull('parent_id')
                ->whereIn('external_id', $allIds)
                ->where('expiration_date', '>=', $now)
                ->where(function ($q) use ($now) {
                    $q->whereNull('termination_date')
                      ->orWhere('termination_date', '>=', $now);
                })
                ->distinct()
                ->pluck('external_id')
                ->all()
        );

        $buildSections = fn (string $id) => [
            'plantel'   => isset($squadSet[$id]),
            'contratos' => isset($contractSet[$id]),
            'mercado'   => isset($rumorSet[$id]),
            'derechos'  => isset($rightSet[$id]),
        ];

        $players = array_map(function ($player) use ($allExtras, $buildSections, $vigenteSet) {
            $id = (string) ($player['id'] ?? '');
            $extra = $allExtras->get($id);
            $player['representative']     = $extra->representative ?? null;
            $player['representative_url'] = $extra->representative_url ?? null;
            $player['is_academy']         = $extra->is_academy ?? false;
            $player['reviewed']           = $extra->reviewed ?? false;
            $player['sections']           = $buildSections($id);
            $player['contract_vigente']   = isset($vigenteSet[$id]);
            return $player;
        }, $squad);

        // player_extras also accumulates rows for players referenced from Contratos, Derechos
        // y Rumores (o abiertos alguna vez en la modal pública de jugador) que no están en el
        // plantel actual (transferidos, préstamos afuera, rumores de otros clubes, etc). Surface
        // those too so they remain reachable for review.
        $orphanExtras = $allExtras->reject(fn ($extra) => isset($squadSet[$extra->besoccer_player_id]));

        foreach ($orphanExtras as $extra) {
            $playerData = $this->besoccer->getPlayerData($extra->besoccer_player_id);
            $info = ($playerData['success'] ?? false) ? $playerData['data'] : [];

            $players[] = [
                'id'                  => $extra->besoccer_player_id,
                'nick'                => $info['nick'] ?? $extra->besoccer_player_id,
                'image'               => $info['player_avatar'] ?? null,
                'pos1'                => $info['pos1'] ?? null,
                'representative'      => $extra->representative,
                'representative_url'  => $extra->representative_url,
                'is_academy'          => $extra->is_academy,
                'reviewed'            => $extra->reviewed,
                'sections'            => $buildSections($extra->besoccer_player_id),
                'contract_vigente'    => isset($vigenteSet[$extra->besoccer_player_id]),
            ];
        }

        usort($players, fn ($a, $b) => (int) $a['reviewed'] <=> (int) $b['reviewed']);

        return response()->json(['success' => true, 'data' => ['squad' => $players]]);
    }

    public function show(string $id): JsonResponse
    {
        $extra = PlayerExtra::where('besoccer_player_id', $id)->first();

        return response()->json(['data' => [
            'representative'     => $extra->representative ?? null,
            'representative_url' => $extra->representative_url ?? null,
            'is_academy'         => $extra->is_academy ?? false,
        ]]);
    }

    public function updateExtra(Request $request, string $id): JsonResponse
    {
        $this->validate($request, [
            'representative'     => 'nullable|string|max:255',
            'representative_url' => 'nullable|url|max:500',
            'is_academy'         => 'boolean',
        ]);

        $extra = PlayerExtra::updateOrCreate(
            ['besoccer_player_id' => $id],
            $request->only(['representative', 'representative_url', 'is_academy']) + ['reviewed' => true]
        );

        $this->besoccer->forgetPlayerData($id);

        return response()->json(['data' => $extra]);
    }
}
