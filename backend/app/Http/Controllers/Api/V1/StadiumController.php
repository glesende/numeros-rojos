<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StadiumConfig;
use App\Models\StadiumMatch;
use App\Models\StadiumSector;
use App\Models\TicketPrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StadiumController extends Controller
{
    // ─── Public ──────────────────────────────────────────────────────────────

    /**
     * Returns stadium config with sectors and upcoming/recent matches with ticket prices.
     */
    public function index(): JsonResponse
    {
        $stadium = StadiumConfig::with(['sectors'])->first();

        $matches = StadiumMatch::with(['ticketPricesWithSectors'])
            ->orderBy('match_date', 'desc')
            ->get()
            ->map(function (StadiumMatch $match) {
                return [
                    'id'          => $match->id,
                    'opponent'    => $match->opponent,
                    'match_date'  => $match->match_date,
                    'match_time'  => $match->match_time,
                    'competition' => $match->competition,
                    'is_home'     => $match->is_home,
                    'prices'      => $match->ticketPricesWithSectors->map(function (TicketPrice $tp) {
                        return [
                            'id'         => $tp->id,
                            'sector_id'  => $tp->stadium_sector_id,
                            'sector'     => $tp->sector ? ['id' => $tp->sector->id, 'name' => $tp->sector->name] : null,
                            'price'      => $tp->price,
                            'currency'   => $tp->currency,
                        ];
                    }),
                ];
            });

        return response()->json([
            'data' => [
                'stadium' => $stadium,
                'matches' => $matches,
            ],
        ]);
    }

    // ─── Admin: Stadium config ────────────────────────────────────────────────

    public function storeConfig(Request $request): JsonResponse
    {
        // Only one stadium config allowed; if exists, update it
        $this->validate($request, [
            'name' => 'required|string|max:255',
            'link' => 'nullable|url|max:500',
        ]);

        $stadium = StadiumConfig::first();

        if ($stadium) {
            $stadium->update($request->only(['name', 'link']));
        } else {
            $stadium = StadiumConfig::create($request->only(['name', 'link']));
        }

        return response()->json(['data' => $stadium->load('sectors')]);
    }

    // ─── Admin: Sectors ───────────────────────────────────────────────────────

    public function storeSector(Request $request): JsonResponse
    {
        $this->validate($request, [
            'name'     => 'required|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'order'    => 'sometimes|integer|min:0',
        ]);

        $stadium = StadiumConfig::firstOrFail();

        $sector = $stadium->sectors()->create([
            'name'     => $request->input('name'),
            'capacity' => $request->input('capacity'),
            'order'    => $request->input('order', 0),
        ]);

        return response()->json(['data' => $sector], 201);
    }

    public function updateSector(Request $request, int $id): JsonResponse
    {
        $sector = StadiumSector::findOrFail($id);

        $this->validate($request, [
            'name'     => 'sometimes|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'order'    => 'sometimes|integer|min:0',
        ]);

        $sector->update($request->only(['name', 'capacity', 'order']));

        return response()->json(['data' => $sector]);
    }

    public function destroySector(int $id): JsonResponse
    {
        $sector = StadiumSector::findOrFail($id);
        $sector->delete();

        return response()->json(['message' => 'Sector eliminado'], 200);
    }

    // ─── Admin: Matches ───────────────────────────────────────────────────────

    public function storeMatch(Request $request): JsonResponse
    {
        $this->validate($request, [
            'opponent'    => 'required|string|max:255',
            'match_date'  => 'required|date',
            'match_time'  => 'nullable|date_format:H:i',
            'competition' => 'nullable|string|max:255',
            'is_home'     => 'sometimes|boolean',
            'prices'      => 'nullable|array',
            'prices.*.sector_id' => 'required|exists:stadium_sectors,id',
            'prices.*.price'     => 'required|numeric|min:0',
            'prices.*.currency'  => 'required|in:ARS,USD,EUR',
        ]);

        $match = StadiumMatch::create($request->only(['opponent', 'match_date', 'match_time', 'competition', 'is_home']));

        if ($request->filled('prices')) {
            foreach ($request->input('prices') as $priceData) {
                TicketPrice::create([
                    'stadium_match_id'  => $match->id,
                    'stadium_sector_id' => $priceData['sector_id'],
                    'price'             => $priceData['price'],
                    'currency'          => $priceData['currency'],
                ]);
            }
        }

        return response()->json(['data' => $match->load('ticketPricesWithSectors')], 201);
    }

    public function updateMatch(Request $request, int $id): JsonResponse
    {
        $match = StadiumMatch::findOrFail($id);

        $this->validate($request, [
            'opponent'    => 'sometimes|string|max:255',
            'match_date'  => 'sometimes|date',
            'match_time'  => 'nullable|date_format:H:i',
            'competition' => 'nullable|string|max:255',
            'is_home'     => 'sometimes|boolean',
            'prices'      => 'nullable|array',
            'prices.*.sector_id' => 'required|exists:stadium_sectors,id',
            'prices.*.price'     => 'required|numeric|min:0',
            'prices.*.currency'  => 'required|in:ARS,USD,EUR',
        ]);

        $match->update($request->only(['opponent', 'match_date', 'match_time', 'competition', 'is_home']));

        if ($request->has('prices')) {
            // Replace all prices for this match
            $match->ticketPrices()->delete();
            foreach ($request->input('prices', []) as $priceData) {
                TicketPrice::create([
                    'stadium_match_id'  => $match->id,
                    'stadium_sector_id' => $priceData['sector_id'],
                    'price'             => $priceData['price'],
                    'currency'          => $priceData['currency'],
                ]);
            }
        }

        return response()->json(['data' => $match->load('ticketPricesWithSectors')]);
    }

    public function destroyMatch(int $id): JsonResponse
    {
        $match = StadiumMatch::findOrFail($id);
        $match->delete();

        return response()->json(['message' => 'Partido eliminado'], 200);
    }

    public function showMatch(int $id): JsonResponse
    {
        $match = StadiumMatch::with('ticketPricesWithSectors')->findOrFail($id);

        return response()->json([
            'data' => [
                'id'          => $match->id,
                'opponent'    => $match->opponent,
                'match_date'  => $match->match_date,
                'match_time'  => $match->match_time,
                'competition' => $match->competition,
                'is_home'     => $match->is_home,
                'prices'      => $match->ticketPricesWithSectors->map(function (TicketPrice $tp) {
                    return [
                        'id'        => $tp->id,
                        'sector_id' => $tp->stadium_sector_id,
                        'sector'    => $tp->sector ? ['id' => $tp->sector->id, 'name' => $tp->sector->name] : null,
                        'price'     => $tp->price,
                        'currency'  => $tp->currency,
                    ];
                }),
            ],
        ]);
    }
}
