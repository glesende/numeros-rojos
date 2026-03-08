<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Contract::query()
            ->fechaDesde($request->input('fecha_desde'))
            ->fechaHasta($request->input('fecha_hasta'));

        if ($request->has('oficial')) {
            $query->oficial(filter_var($request->input('oficial'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy('fecha_firma', $sortDir);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $contracts = $query->paginate($perPage);

        // Aggregates
        $aggQuery = Contract::query()
            ->fechaDesde($request->input('fecha_desde'))
            ->fechaHasta($request->input('fecha_hasta'));

        if ($request->has('oficial')) {
            $aggQuery->oficial(filter_var($request->input('oficial'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $totals = [
            'total_contratos'          => (int) (clone $aggQuery)->count(),
            'promedio_porcentaje_pase'  => round((float) (clone $aggQuery)->avg('porcentaje_pase_club'), 2),
            'total_salarios_usd'       => (float) (clone $aggQuery)->where('moneda', 'USD')->sum('salario_estimado'),
            'total_salarios_ars'       => (float) (clone $aggQuery)->where('moneda', 'ARS')->sum('salario_estimado'),
            'contratos_vigentes'       => (int) (clone $aggQuery)->where('fecha_caducidad', '>=', Carbon::now())->count(),
            'contratos_vencidos'       => (int) (clone $aggQuery)->where('fecha_caducidad', '<', Carbon::now())->count(),
        ];

        return response()->json([
            'data'    => $contracts->items(),
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

        return response()->json(['data' => $contract]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->validate($request, [
            'nombre_completo'       => 'required|string|max:255',
            'fecha_firma'           => 'required|date',
            'fecha_caducidad'       => 'required|date|after:fecha_firma',
            'porcentaje_pase_club'  => 'required|numeric|min:0|max:100',
            'salario_estimado'      => 'nullable|numeric|min:0',
            'moneda'                => 'nullable|in:ARS,USD',
            'oficial'               => 'required|boolean',
            'confidence_level'      => 'required|in:high,medium,low',
            'clausulas'             => 'nullable|array',
            'links'                 => 'nullable|array',
            'links.*'               => 'url',
        ]);

        $contract = Contract::create($request->only([
            'nombre_completo', 'fecha_firma', 'fecha_caducidad',
            'porcentaje_pase_club', 'salario_estimado', 'moneda',
            'oficial', 'confidence_level', 'clausulas', 'links',
        ]));

        return response()->json(['data' => $contract], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->validate($request, [
            'nombre_completo'       => 'sometimes|string|max:255',
            'fecha_firma'           => 'sometimes|date',
            'fecha_caducidad'       => 'sometimes|date',
            'porcentaje_pase_club'  => 'sometimes|numeric|min:0|max:100',
            'salario_estimado'      => 'nullable|numeric|min:0',
            'moneda'                => 'nullable|in:ARS,USD',
            'oficial'               => 'sometimes|boolean',
            'confidence_level'      => 'sometimes|in:high,medium,low',
            'clausulas'             => 'nullable|array',
            'links'                 => 'nullable|array',
            'links.*'               => 'url',
        ]);

        $contract->update($request->only([
            'nombre_completo', 'fecha_firma', 'fecha_caducidad',
            'porcentaje_pase_club', 'salario_estimado', 'moneda',
            'oficial', 'confidence_level', 'clausulas', 'links',
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
