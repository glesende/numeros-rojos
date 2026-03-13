<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EconomyRecord;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EconomyRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EconomyRecord::query()
            ->official($request->boolean('official', null) !== false ? $request->input('official') : null)
            ->type($request->input('type'))
            ->dateFrom($request->input('date_from'))
            ->dateTo($request->input('date_to'));

        if ($request->has('official')) {
            $query->official(filter_var($request->input('official'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy('record_date', $sortDir);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $records = $query->paginate($perPage);

        // Aggregates
        $aggregateQuery = EconomyRecord::query()
            ->type($request->input('type'))
            ->dateFrom($request->input('date_from'))
            ->dateTo($request->input('date_to'));

        if ($request->has('official')) {
            $aggregateQuery->official(filter_var($request->input('official'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        $totals = [
            'total_cobros_ars' => (float) (clone $aggregateQuery)->where('type', 'cobro')->where('currency', 'ARS')->sum('amount'),
            'total_pagos_ars'  => (float) (clone $aggregateQuery)->where('type', 'pago')->where('currency', 'ARS')->sum('amount'),
            'total_cobros_usd' => (float) (clone $aggregateQuery)->where('type', 'cobro')->where('currency', 'USD')->sum('amount'),
            'total_pagos_usd'  => (float) (clone $aggregateQuery)->where('type', 'pago')->where('currency', 'USD')->sum('amount'),
            'total_cobros_eur' => (float) (clone $aggregateQuery)->where('type', 'cobro')->where('currency', 'EUR')->sum('amount'),
            'total_pagos_eur'  => (float) (clone $aggregateQuery)->where('type', 'pago')->where('currency', 'EUR')->sum('amount'),
            'balance_ars'      => 0,
            'balance_usd'      => 0,
            'balance_eur'      => 0,
            'cantidad'         => (int) (clone $aggregateQuery)->count(),
        ];

        $totals['balance_ars'] = $totals['total_cobros_ars'] - $totals['total_pagos_ars'];
        $totals['balance_usd'] = $totals['total_cobros_usd'] - $totals['total_pagos_usd'];
        $totals['balance_eur'] = $totals['total_cobros_eur'] - $totals['total_pagos_eur'];

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

    public function monthlySummary(): JsonResponse
    {
        $today = Carbon::today();
        $from  = $today->copy()->subMonths(24)->startOfMonth();
        $to    = $today->copy()->addMonths(24)->endOfMonth();

        $rows = EconomyRecord::query()
            ->select(
                DB::raw("DATE_FORMAT(record_date, '%Y-%m') AS month_key"),
                DB::raw("YEAR(record_date) AS year"),
                DB::raw("MONTH(record_date) AS month_num"),
                'currency',
                'type',
                DB::raw('SUM(amount) AS total')
            )
            ->whereBetween('record_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('month_key', 'year', 'month_num', 'currency', 'type')
            ->orderBy('month_key')
            ->get();

        // Build a map of all months in range (past 24 + next 24)
        $months = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $key = $cursor->format('Y-m');
            $months[$key] = [
                'month'         => $key,
                'year'          => (int) $cursor->year,
                'month_num'     => (int) $cursor->month,
                'month_label'   => $cursor->locale('es')->isoFormat('MMM YY'),
                'ingresos_ars'  => 0.0,
                'egresos_ars'   => 0.0,
                'ingresos_usd'  => 0.0,
                'egresos_usd'   => 0.0,
                'ingresos_eur'  => 0.0,
                'egresos_eur'   => 0.0,
                'balance_ars'   => 0.0,
                'balance_usd'   => 0.0,
                'balance_eur'   => 0.0,
            ];
            $cursor->addMonth();
        }

        foreach ($rows as $row) {
            $key = $row->month_key;
            if (!isset($months[$key])) {
                continue;
            }
            $currency = strtolower($row->currency);
            $field    = $row->type === 'cobro' ? "ingresos_{$currency}" : "egresos_{$currency}";
            $months[$key][$field] += (float) $row->total;
        }

        // Compute balances
        foreach ($months as &$m) {
            $m['balance_ars'] = $m['ingresos_ars'] - $m['egresos_ars'];
            $m['balance_usd'] = $m['ingresos_usd'] - $m['egresos_usd'];
            $m['balance_eur'] = $m['ingresos_eur'] - $m['egresos_eur'];
        }
        unset($m);

        return response()->json(['data' => array_values($months)]);
    }

    public function show(int $id): JsonResponse
    {
        $record = EconomyRecord::findOrFail($id);

        return response()->json(['data' => $record]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->validate($request, [
            'description'    => 'required|string',
            'type'           => 'required|in:cobro,pago',
            'amount'         => 'required|numeric|min:0',
            'currency'       => 'required|in:ARS,USD,EUR',
            'record_date'    => 'required|date',
            'official'       => 'required|boolean',
            'carried_out'    => 'sometimes|boolean',
            'links'          => 'nullable|array',
            'links.*'        => 'url',
        ]);

        $record = EconomyRecord::create($request->only([
            'description', 'type', 'amount', 'currency',
            'record_date', 'official', 'carried_out', 'links',
        ]));

        return response()->json(['data' => $record], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = EconomyRecord::findOrFail($id);

        $this->validate($request, [
            'description'    => 'sometimes|string',
            'type'          => 'sometimes|in:cobro,pago',
            'amount'        => 'sometimes|numeric|min:0',
            'currency'      => 'sometimes|in:ARS,USD,EUR',
            'record_date'   => 'sometimes|date',
            'official'      => 'sometimes|boolean',
            'carried_out'   => 'sometimes|boolean',
            'links'         => 'nullable|array',
            'links.*'       => 'url',
        ]);

        $record->update($request->only([
            'description', 'type', 'amount', 'currency',
            'record_date', 'official', 'carried_out', 'links',
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
