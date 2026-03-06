<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EconomyRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EconomyRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EconomyRecord::query()
            ->oficial($request->boolean('oficial', null) !== false ? $request->input('oficial') : null)
            ->tipo($request->input('tipo'))
            ->fechaDesde($request->input('fecha_desde'))
            ->fechaHasta($request->input('fecha_hasta'));

        if ($request->has('oficial')) {
            $query->oficial(filter_var($request->input('oficial'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy('fecha', $sortDir);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $records = $query->paginate($perPage);

        // Aggregates
        $aggregateQuery = EconomyRecord::query()
            ->tipo($request->input('tipo'))
            ->fechaDesde($request->input('fecha_desde'))
            ->fechaHasta($request->input('fecha_hasta'));

        if ($request->has('oficial')) {
            $aggregateQuery->oficial(filter_var($request->input('oficial'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $totals = [
            'total_cobros_ars' => (float) (clone $aggregateQuery)->where('tipo', 'cobro')->where('moneda', 'ARS')->sum('monto'),
            'total_pagos_ars'  => (float) (clone $aggregateQuery)->where('tipo', 'pago')->where('moneda', 'ARS')->sum('monto'),
            'total_cobros_usd' => (float) (clone $aggregateQuery)->where('tipo', 'cobro')->where('moneda', 'USD')->sum('monto'),
            'total_pagos_usd'  => (float) (clone $aggregateQuery)->where('tipo', 'pago')->where('moneda', 'USD')->sum('monto'),
            'balance_ars'      => 0,
            'balance_usd'      => 0,
            'cantidad'         => (int) (clone $aggregateQuery)->count(),
        ];

        $totals['balance_ars'] = $totals['total_cobros_ars'] - $totals['total_pagos_ars'];
        $totals['balance_usd'] = $totals['total_cobros_usd'] - $totals['total_pagos_usd'];

        return response()->json([
            'data'    => $records->items(),
            'totals'  => $totals,
            'meta'    => [
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
                'per_page'     => $records->perPage(),
                'total'        => $records->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $record = EconomyRecord::findOrFail($id);

        return response()->json(['data' => $record]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->validate($request, [
            'descripcion'       => 'required|string',
            'tipo'              => 'required|in:cobro,pago',
            'monto'             => 'required|numeric|min:0',
            'moneda'            => 'required|in:ARS,USD',
            'fecha'             => 'required|date',
            'oficial'           => 'required|boolean',
            'confidence_level'  => 'required|in:high,medium,low',
            'links'             => 'nullable|array',
            'links.*'           => 'url',
        ]);

        $record = EconomyRecord::create($request->only([
            'descripcion', 'tipo', 'monto', 'moneda',
            'fecha', 'oficial', 'confidence_level', 'links',
        ]));

        return response()->json(['data' => $record], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = EconomyRecord::findOrFail($id);

        $this->validate($request, [
            'descripcion'       => 'sometimes|string',
            'tipo'              => 'sometimes|in:cobro,pago',
            'monto'             => 'sometimes|numeric|min:0',
            'moneda'            => 'sometimes|in:ARS,USD',
            'fecha'             => 'sometimes|date',
            'oficial'           => 'sometimes|boolean',
            'confidence_level'  => 'sometimes|in:high,medium,low',
            'links'             => 'nullable|array',
            'links.*'           => 'url',
        ]);

        $record->update($request->only([
            'descripcion', 'tipo', 'monto', 'moneda',
            'fecha', 'oficial', 'confidence_level', 'links',
        ]));

        return response()->json(['data' => $record]);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = EconomyRecord::findOrFail($id);
        $record->delete();

        return response()->json(['message' => 'Registro eliminado'], 200);
    }
}
