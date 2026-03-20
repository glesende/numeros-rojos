<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Services\BeSoccerService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    private BeSoccerService $besoccerService;

    public function __construct(BeSoccerService $besoccerService)
    {
        $this->besoccerService = $besoccerService;
    }

    private function enrichWithPlayerAvatar(array $contract): array
    {
        if (!empty($contract['external_id'])) {
            $playerData = $this->besoccerService->getPlayerByExternalId($contract['external_id']);
            if ($playerData['success'] ?? false) {
                $contract['player_avatar'] = $playerData['data']['player_avatar'] ?? null;
            }
        }
        return $contract;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Contract::query()
            ->search($request->input('search'))
            ->dateFrom($request->input('date_from'))
            ->dateTo($request->input('date_to'))
            ->validity($request->input('validity'));

        if ($request->has('official')) {
            $query->official(filter_var($request->input('official'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy('expiration_date', $sortDir);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $contracts = $query->paginate($perPage);

        // Enrich contracts with player avatars
        $contractsData = array_map(function ($contract) {
            return $this->enrichWithPlayerAvatar($contract->toArray());
        }, $contracts->items());

        // Aggregates
        $aggQuery = Contract::query()
            ->search($request->input('search'))
            ->dateFrom($request->input('date_from'))
            ->dateTo($request->input('date_to'))
            ->validity($request->input('validity'));

        if ($request->has('official')) {
            $aggQuery->official(filter_var($request->input('official'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $now = Carbon::now();
        $totals = [
            'total_contratos'          => (int) (clone $aggQuery)->count(),
            'promedio_porcentaje_pase'  => round((float) (clone $aggQuery)->avg('club_pass_percentage'), 2),
            'total_salarios_usd'       => (float) (clone $aggQuery)->where('currency', 'USD')->sum('estimated_salary'),
            'total_salarios_ars'       => (float) (clone $aggQuery)->where('currency', 'ARS')->sum('estimated_salary'),
            'total_salarios_eur'       => (float) (clone $aggQuery)->where('currency', 'EUR')->sum('estimated_salary'),
            'contratos_vigentes'       => (int) (clone $aggQuery)->where('expiration_date', '>=', Carbon::now())->count(),
            'contratos_vencidos'       => (int) (clone $aggQuery)->where('expiration_date', '<', Carbon::now())->count(),
            'last_updated_at'          => Contract::max('created_at'),
        ];

        return response()->json([
            'data'    => $contractsData,
            'totals'  => $totals,
            'meta'    => [
                'current_page' => $contracts->currentPage(),
                'last_page'    => $contracts->lastPage(),
                'per_page'     => $contracts->perPage(),
                'total'        => $contracts->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);
        $contractData = $this->enrichWithPlayerAvatar($contract->toArray());

        return response()->json(['data' => $contractData]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->validate($request, [
            'external_id'            => 'nullable|string|max:255',
            'full_name'               => 'required|string|max:255',
            'expiration_date'        => 'required|date',
            'signing_date'           => 'nullable|date',
            'termination_date'       => 'nullable|date',
            'club_pass_percentage'    => 'required|numeric|min:0|max:100',
            'estimated_salary'        => 'nullable|numeric|min:0',
            'currency'                => 'nullable|in:ARS,USD,EUR',
            'clauses'                => 'nullable|array',
            'links'                   => 'nullable|array',
            'links.*.url'             => 'required|url',
            'links.*.official'        => 'required|boolean',
            'loan'                    => 'nullable|array',
            'loan.club'               => 'required_with:loan|string|max:255',
            'loan.until'              => 'nullable|date',
            'loan.clauses'            => 'nullable|array',
        ]);

        $contract = Contract::create($request->only([
            'external_id', 'full_name', 'expiration_date', 'signing_date', 'termination_date',
            'club_pass_percentage', 'estimated_salary', 'currency',
            'clauses', 'links', 'loan',
        ]));

        return response()->json(['data' => $contract], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->validate($request, [
            'external_id'            => 'nullable|string|max:255',
            'full_name'               => 'sometimes|string|max:255',
            'expiration_date'        => 'sometimes|date',
            'signing_date'           => 'nullable|date',
            'termination_date'       => 'nullable|date',
            'club_pass_percentage'    => 'sometimes|numeric|min:0|max:100',
            'estimated_salary'        => 'nullable|numeric|min:0',
            'currency'                => 'nullable|in:ARS,USD,EUR',
            'clauses'                => 'nullable|array',
            'links'                   => 'nullable|array',
            'links.*.url'             => 'required|url',
            'links.*.official'        => 'required|boolean',
            'loan'                    => 'nullable|array',
            'loan.club'               => 'required_with:loan|string|max:255',
            'loan.until'              => 'nullable|date',
            'loan.clauses'            => 'nullable|array',
        ]);

        $contract->update($request->only([
            'external_id', 'full_name', 'expiration_date', 'signing_date', 'termination_date',
            'club_pass_percentage', 'estimated_salary', 'currency',
            'clauses', 'links', 'loan',
        ]));

        return response()->json(['data' => $contract]);
    }

    public function destroy(int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);
        $contract->delete();

        return response()->json(['message' => 'Contrato eliminado'], 200);
    }
}
