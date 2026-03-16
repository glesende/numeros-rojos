<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Balance;
use App\Models\BalanceBreakdown;
use App\Models\BalanceItem;
use App\Models\BalanceSubitem;
use App\Services\OpenAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BalanceController extends Controller
{
    public function index(): JsonResponse
    {
        $balances = Balance::orderBy('published_at', 'desc')
            ->orderBy('exercise', 'desc')
            ->get()
            ->map(function (Balance $balance) {
                return [
                    'id'                 => $balance->id,
                    'exercise'           => $balance->exercise,
                    'dollar_reference'   => (float) $balance->dollar_reference,
                    'published_at'       => $balance->published_at?->toDateString(),
                    'has_file'           => !empty($balance->file_path),
                    'file_original_name' => $balance->file_original_name,
                    'created_at'         => $balance->created_at->toDateTimeString(),
                ];
            });

        return response()->json(['data' => $balances]);
    }

    public function show(int $id): JsonResponse
    {
        $balance = Balance::findOrFail($id);

        $breakdowns = BalanceBreakdown::with(['item', 'subitem'])
            ->where('balance_id', $id)
            ->get()
            ->map(function (BalanceBreakdown $bd) {
                return [
                    'id'         => $bd->id,
                    'item_id'    => $bd->balance_item_id,
                    'item_name'  => $bd->item?->name,
                    'subitem_id' => $bd->balance_subitem_id,
                    'subitem_name' => $bd->subitem?->name,
                    'amount'     => (float) $bd->amount,
                    'currency'   => $bd->currency,
                ];
            });

        return response()->json([
            'data' => [
                'id'                 => $balance->id,
                'exercise'           => $balance->exercise,
                'dollar_reference'   => (float) $balance->dollar_reference,
                'published_at'       => $balance->published_at?->toDateString(),
                'has_file'           => !empty($balance->file_path),
                'file_original_name' => $balance->file_original_name,
                'breakdown'          => $breakdowns,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->validate($request, [
            'exercise'         => 'required|string|max:50',
            'dollar_reference' => 'nullable|numeric|min:0',
            'published_at'     => 'nullable|date',
            'file'             => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:20480',
        ]);

        $filePath         = null;
        $fileOriginalName = null;

        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $file             = $request->file('file');
            $fileOriginalName = $file->getClientOriginalName();
            $filePath         = $file->store('balances', 'local');
        }

        $balance = Balance::create([
            'exercise'           => $request->input('exercise'),
            'dollar_reference'   => $request->input('dollar_reference'),
            'published_at'       => $request->input('published_at'),
            'file_path'          => $filePath,
            'file_original_name' => $fileOriginalName,
        ]);

        return response()->json(['data' => $balance], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $balance = Balance::findOrFail($id);

        $this->validate($request, [
            'exercise'         => 'sometimes|string|max:50',
            'dollar_reference' => 'nullable|numeric|min:0',
            'published_at'     => 'nullable|date',
            'file'             => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:20480',
        ]);

        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            // Delete old file
            if ($balance->file_path) {
                Storage::disk('local')->delete($balance->file_path);
            }
            $file = $request->file('file');
            $balance->file_original_name = $file->getClientOriginalName();
            $balance->file_path          = $file->store('balances', 'local');
        }

        $balance->fill($request->only(['exercise', 'dollar_reference', 'published_at']));
        $balance->save();

        return response()->json(['data' => $balance]);
    }

    public function destroy(int $id): JsonResponse
    {
        $balance = Balance::findOrFail($id);

        if ($balance->file_path) {
            Storage::disk('local')->delete($balance->file_path);
        }

        $balance->delete();

        return response()->json(['message' => 'Balance eliminado'], 200);
    }

    public function download(int $id)
    {
        $balance = Balance::findOrFail($id);

        if (!$balance->file_path || !Storage::disk('local')->exists($balance->file_path)) {
            return response()->json(['error' => 'Archivo no disponible'], 404);
        }

        $path     = Storage::disk('local')->path($balance->file_path);
        $fileName = $balance->file_original_name ?: basename($balance->file_path);

        return response()->download($path, $fileName);
    }

    public function analyze(int $id): JsonResponse
    {
        $balance = Balance::findOrFail($id);

        if (!$balance->file_path || !Storage::disk('local')->exists($balance->file_path)) {
            return response()->json(['error' => 'El balance no tiene archivo adjunto'], 422);
        }

        $items = BalanceItem::with('subitems')->orderBy('order')->orderBy('name')->get();

        $service = new OpenAiService();

        $result = $service->analyzeBalance($balance, $items->toArray());

        return response()->json(['data' => $result]);
    }

    // --------------------------------------------------------
    // Breakdown CRUD (nested under balance)
    // --------------------------------------------------------

    public function storeBreakdown(Request $request, int $balanceId): JsonResponse
    {
        Balance::findOrFail($balanceId);

        $this->validate($request, [
            'balance_item_id'    => 'required|exists:balance_items,id',
            'balance_subitem_id' => 'nullable|exists:balance_subitems,id',
            'amount'             => 'required|numeric',
            'currency'           => 'required|in:ARS,USD,EUR',
        ]);

        $bd = BalanceBreakdown::create([
            'balance_id'         => $balanceId,
            'balance_item_id'    => $request->input('balance_item_id'),
            'balance_subitem_id' => $request->input('balance_subitem_id'),
            'amount'             => $request->input('amount'),
            'currency'           => $request->input('currency', 'ARS'),
        ]);

        $bd->load(['item', 'subitem']);

        return response()->json(['data' => [
            'id'           => $bd->id,
            'item_id'      => $bd->balance_item_id,
            'item_name'    => $bd->item?->name,
            'subitem_id'   => $bd->balance_subitem_id,
            'subitem_name' => $bd->subitem?->name,
            'amount'       => (float) $bd->amount,
            'currency'     => $bd->currency,
        ]], 201);
    }

    public function updateBreakdown(Request $request, int $balanceId, int $breakdownId): JsonResponse
    {
        Balance::findOrFail($balanceId);
        $bd = BalanceBreakdown::where('balance_id', $balanceId)->findOrFail($breakdownId);

        $this->validate($request, [
            'balance_item_id'    => 'sometimes|exists:balance_items,id',
            'balance_subitem_id' => 'nullable|exists:balance_subitems,id',
            'amount'             => 'sometimes|numeric',
            'currency'           => 'sometimes|in:ARS,USD,EUR',
        ]);

        $bd->fill($request->only(['balance_item_id', 'balance_subitem_id', 'amount', 'currency']));
        $bd->save();
        $bd->load(['item', 'subitem']);

        return response()->json(['data' => [
            'id'           => $bd->id,
            'item_id'      => $bd->balance_item_id,
            'item_name'    => $bd->item?->name,
            'subitem_id'   => $bd->balance_subitem_id,
            'subitem_name' => $bd->subitem?->name,
            'amount'       => (float) $bd->amount,
            'currency'     => $bd->currency,
        ]]);
    }

    public function destroyBreakdown(int $balanceId, int $breakdownId): JsonResponse
    {
        Balance::findOrFail($balanceId);
        $bd = BalanceBreakdown::where('balance_id', $balanceId)->findOrFail($breakdownId);
        $bd->delete();

        return response()->json(['message' => 'Registro eliminado'], 200);
    }

    // --------------------------------------------------------
    // Evolution chart data (public)
    // --------------------------------------------------------

    public function evolution(Request $request): JsonResponse
    {
        $currency = $request->input('currency', 'ARS');

        // Get all items with subitems
        $items = BalanceItem::with('subitems')->orderBy('order')->orderBy('name')->get();

        // Get all balances ordered by exercise
        $balances = Balance::orderBy('published_at')->orderBy('exercise')->get();

        if ($balances->isEmpty()) {
            return response()->json(['data' => ['exercises' => [], 'series' => []]]);
        }

        // Get all breakdowns for the requested currency
        $breakdowns = BalanceBreakdown::where('currency', $currency)
            ->whereIn('balance_id', $balances->pluck('id'))
            ->with(['item', 'subitem'])
            ->get();

        $exercises = $balances->pluck('exercise')->toArray();

        // Build series: one per item (aggregated, no subitem filter)
        $series = [];
        foreach ($items as $item) {
            $values = [];
            foreach ($balances as $balance) {
                $total = $breakdowns
                    ->where('balance_id', $balance->id)
                    ->where('balance_item_id', $item->id)
                    ->sum('amount');
                $values[] = round((float) $total, 2);
            }
            // Only include items that have at least one non-zero value
            if (array_sum(array_map('abs', $values)) > 0) {
                $series[] = [
                    'id'     => $item->id,
                    'name'   => $item->name,
                    'values' => $values,
                ];
            }
        }

        return response()->json([
            'data' => [
                'exercises' => $exercises,
                'currency'  => $currency,
                'series'    => $series,
            ],
        ]);
    }
}
