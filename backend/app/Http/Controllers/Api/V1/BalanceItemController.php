<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BalanceItem;
use App\Models\BalanceSubitem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BalanceItemController extends Controller
{
    public function index(): JsonResponse
    {
        $items = BalanceItem::with(['subitems' => function ($q) {
            $q->orderBy('order')->orderBy('name');
        }])
            ->orderBy('order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->validate($request, [
            'name'  => 'required|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $item = BalanceItem::create([
            'name'  => $request->input('name'),
            'order' => $request->input('order', 0),
        ]);

        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = BalanceItem::findOrFail($id);

        $this->validate($request, [
            'name'  => 'sometimes|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $item->fill($request->only(['name', 'order']));
        $item->save();

        return response()->json(['data' => $item]);
    }

    public function destroy(int $id): JsonResponse
    {
        $item = BalanceItem::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Item eliminado'], 200);
    }

    // ---- Subitems ----

    public function storeSubitem(Request $request, int $itemId): JsonResponse
    {
        BalanceItem::findOrFail($itemId);

        $this->validate($request, [
            'name'  => 'required|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $subitem = BalanceSubitem::create([
            'balance_item_id' => $itemId,
            'name'            => $request->input('name'),
            'order'           => $request->input('order', 0),
        ]);

        return response()->json(['data' => $subitem], 201);
    }

    public function updateSubitem(Request $request, int $itemId, int $subitemId): JsonResponse
    {
        BalanceItem::findOrFail($itemId);
        $subitem = BalanceSubitem::where('balance_item_id', $itemId)->findOrFail($subitemId);

        $this->validate($request, [
            'name'  => 'sometimes|string|max:255',
            'order' => 'nullable|integer|min:0',
        ]);

        $subitem->fill($request->only(['name', 'order']));
        $subitem->save();

        return response()->json(['data' => $subitem]);
    }

    public function destroySubitem(int $itemId, int $subitemId): JsonResponse
    {
        BalanceItem::findOrFail($itemId);
        $subitem = BalanceSubitem::where('balance_item_id', $itemId)->findOrFail($subitemId);
        $subitem->delete();

        return response()->json(['message' => 'Subitem eliminado'], 200);
    }
}
