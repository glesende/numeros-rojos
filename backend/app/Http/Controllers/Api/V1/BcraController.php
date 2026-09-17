<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BankDebt;
use App\Models\RejectedCheck;
use App\Models\UsdQuote;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BcraController extends Controller
{
    // BCRA's Central de Deudores reports bank-debt "amount" in thousands of pesos.
    // Rejected-check amounts are reported in full pesos, so this scale does not apply to them.
    private const AMOUNT_SCALE = 1000;

    private const RECORD_SORT_FIELDS = ['period', 'entity', 'amount', 'situation'];

    private const REJECTED_CHECK_CAUSE = 'SIN FONDOS';

    /** @var array<string, UsdQuote|null> */
    private array $quoteCache = [];

    public function debts(Request $request): JsonResponse
    {
        $entity = $request->query('entity');

        $query = BankDebt::query();
        if (!empty($entity)) {
            $query->where('entity', $entity);
        }

        $rows = $query
            ->select('period', DB::raw('SUM(amount) as total_amount'))
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $data = [];
        foreach ($rows as $row) {
            $quote = $this->quoteForPeriod($row->period);

            // Skip periods we can't dollarize yet (no quote available at or before that month).
            if (!$quote) {
                continue;
            }

            $data[] = [
                'period'    => $row->period,
                'total_usd' => round(($row->total_amount * self::AMOUNT_SCALE) / $quote->rate, 2),
            ];
        }

        $entities = BankDebt::query()->distinct()->orderBy('entity')->pluck('entity');

        return response()->json([
            'data'     => $data,
            'entities' => $entities,
            // Always shows every entity for the latest period, regardless of the ?entity filter above.
            'latest'   => $this->latestPeriodBreakdown(),
        ]);
    }

    public function records(Request $request): JsonResponse
    {
        $underReview     = $request->has('under_review') ? filter_var($request->input('under_review'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;
        $legalProceeding = $request->has('legal_proceeding') ? filter_var($request->input('legal_proceeding'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;

        $query = BankDebt::query();

        if ($period = $request->query('period')) {
            $query->where('period', $period);
        }
        if ($entity = $request->query('entity')) {
            $query->where('entity', $entity);
        }
        if ($request->filled('situation')) {
            $query->where('situation', (int) $request->query('situation'));
        }
        if ($underReview !== null) {
            $query->where('under_review', $underReview);
        }
        if ($legalProceeding !== null) {
            $query->where('legal_proceeding', $legalProceeding);
        }

        $sortBy  = in_array($request->input('sort_by'), self::RECORD_SORT_FIELDS) ? $request->input('sort_by') : 'period';
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);
        if ($sortBy !== 'entity') {
            $query->orderBy('entity', 'asc');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $records = $query->paginate($perPage);

        $data = array_map(function (BankDebt $debt) {
            $quote = $this->quoteForPeriod($debt->period);

            return [
                'period'           => $debt->period,
                'entity'           => $debt->entity,
                'amount_ars'       => $debt->amount * self::AMOUNT_SCALE,
                'amount_usd'       => $quote ? round(($debt->amount * self::AMOUNT_SCALE) / $quote->rate, 2) : null,
                'situation'        => $debt->situation,
                'under_review'     => $debt->under_review,
                'legal_proceeding' => $debt->legal_proceeding,
            ];
        }, $records->items());

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
                'per_page'     => $records->perPage(),
                'total'        => $records->total(),
            ],
        ]);
    }

    public function rejectedChecks(Request $request): JsonResponse
    {
        $checks = RejectedCheck::query()
            ->where('cause', self::REJECTED_CHECK_CAUSE)
            ->orderByDesc('rejection_date')
            ->get();

        $rows = $checks->map(fn (RejectedCheck $check) => [
            'rejection_date'   => $check->rejection_date->toDateString(),
            'amount_ars'       => $check->amount,
            'pending'          => $check->payment_date === null,
            'under_review'     => $check->under_review,
            'legal_proceeding' => $check->legal_proceeding,
        ]);

        return response()->json([
            'count'     => $rows->count(),
            // Only pending checks (not yet regularized) count towards the total.
            'total_ars' => $checks->whereNull('payment_date')->sum('amount'),
            'rows'      => $rows,
        ]);
    }

    private function latestPeriodBreakdown(): ?array
    {
        $latestPeriod = BankDebt::max('period');
        if (!$latestPeriod) {
            return null;
        }

        $quote = $this->quoteForPeriod($latestPeriod);

        $rows = BankDebt::query()
            ->where('period', $latestPeriod)
            ->orderBy('entity')
            ->get()
            ->map(fn (BankDebt $debt) => [
                'entity'           => $debt->entity,
                'amount_usd'       => $quote ? round(($debt->amount * self::AMOUNT_SCALE) / $quote->rate, 2) : null,
                'situation'        => $debt->situation,
                'under_review'     => $debt->under_review,
                'legal_proceeding' => $debt->legal_proceeding,
            ]);

        return [
            'period' => $latestPeriod,
            'rows'   => $rows,
        ];
    }

    private function quoteForPeriod(string $period): ?UsdQuote
    {
        $endOfMonth = Carbon::createFromFormat('Ym', $period)->endOfMonth();

        return $this->quoteAsOf($endOfMonth);
    }

    private function quoteAsOf(Carbon $date): ?UsdQuote
    {
        $key = $date->toDateString();

        if (!array_key_exists($key, $this->quoteCache)) {
            $this->quoteCache[$key] = UsdQuote::where('quote_date', '<=', $key)
                ->orderByDesc('quote_date')
                ->first();
        }

        return $this->quoteCache[$key];
    }
}
