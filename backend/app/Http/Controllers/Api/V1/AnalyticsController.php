<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageView;
use App\Models\VisitOrigin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Métricas de uso propias y sin datos personales. El navegador manda un id aleatorio (localStorage, no una
 * cookie ni nada derivado de la persona); acá solo se guarda su HMAC con la APP_KEY. La IP no se lee ni se guarda.
 */
class AnalyticsController extends Controller
{
    public const SECTIONS = [
        'home', 'economia', 'contratos', 'balances', 'estadisticas', 'estadio',
        'derechos', 'elecciones', 'bcra', 'rumores',
    ];

    private const MAX_EVENTS_PER_MINUTE = 60;

    public function track(Request $request): JsonResponse
    {
        $this->validate($request, [
            'section'    => 'required|string|in:' . implode(',', self::SECTIONS),
            'visitor_id' => ['required', 'string', 'regex:/^[A-Za-z0-9-]{16,64}$/'],
        ]);

        $hash = hash_hmac('sha256', $request->input('visitor_id'), (string) config('app.key'));

        $rateKey = 'analytics:' . substr($hash, 0, 16);
        Cache::add($rateKey, 0, 60);
        if (Cache::increment($rateKey) > self::MAX_EVENTS_PER_MINUTE) {
            return response()->json(['ok' => false], 429);
        }

        $attrs = ['section' => $request->input('section'), 'visitor_hash' => $hash, 'viewed_on' => now()->toDateString()];
        $row   = PageView::firstOrCreate($attrs, ['views' => 0]);
        PageView::where('id', $row->id)->increment('views');

        return response()->json(['ok' => true], 202);
    }

    /**
     * Primera visita de la sesión: página de entrada y utm_source/medium/campaign (opcionales). Los utm que no
     * cumplen el formato simple se ignoran (no se rechaza la visita); sin utm queda como origen directo.
     */
    public function origin(Request $request): JsonResponse
    {
        $this->validate($request, [
            'visitor_id'   => ['required', 'string', 'regex:/^[A-Za-z0-9-]{16,64}$/'],
            'entry_path'   => ['required', 'string', 'regex:/^\/[A-Za-z0-9_\-\/.]{0,118}$/'],
            'utm_source'   => 'nullable|string|max:200',
            'utm_medium'   => 'nullable|string|max:200',
            'utm_campaign' => 'nullable|string|max:200',
        ]);

        $hash = hash_hmac('sha256', $request->input('visitor_id'), (string) config('app.key'));

        $rateKey = 'analytics:' . substr($hash, 0, 16);
        Cache::add($rateKey, 0, 60);
        if (Cache::increment($rateKey) > self::MAX_EVENTS_PER_MINUTE) {
            return response()->json(['ok' => false], 429);
        }

        $attrs = [
            'visitor_hash' => $hash,
            'visited_on'   => now()->toDateString(),
            'source'       => $this->utm($request->input('utm_source')),
            'medium'       => $this->utm($request->input('utm_medium')),
            'campaign'     => $this->utm($request->input('utm_campaign')),
            'entry_path'   => $request->input('entry_path'),
        ];
        $row = VisitOrigin::firstOrCreate($attrs, ['sessions' => 0]);
        VisitOrigin::where('id', $row->id)->increment('sessions');

        return response()->json(['ok' => true], 202);
    }

    private function utm(?string $value): string
    {
        $value = strtolower(trim((string) $value));

        return preg_match('/^[a-z0-9_.\-]{1,50}$/', $value) ? $value : '';
    }

    /** Admin: visitas, visitantes únicos y % que vuelve por sección en los últimos 7 o 30 días. */
    public function summary(Request $request): JsonResponse
    {
        $days  = (int) $request->query('days', 7);
        $days  = in_array($days, [7, 30], true) ? $days : 7;
        $since = now()->subDays($days - 1)->toDateString();

        // Por (sección, visitante): cuántos días distintos vino y cuántas veces entró.
        $perVisitor = DB::table('page_views')
            ->where('viewed_on', '>=', $since)
            ->groupBy('section', 'visitor_hash')
            ->select('section', 'visitor_hash', DB::raw('COUNT(*) as days_seen'), DB::raw('SUM(views) as views'));

        $rows = DB::query()->fromSub($perVisitor, 'v')
            ->groupBy('section')
            ->select(
                'section',
                DB::raw('SUM(views) as views'),
                DB::raw('COUNT(*) as unique_visitors'),
                DB::raw('SUM(CASE WHEN days_seen >= 2 THEN 1 ELSE 0 END) as returning_visitors')
            )->get()->keyBy('section');

        $sections = collect(self::SECTIONS)->map(function ($section) use ($rows) {
            $r      = $rows->get($section);
            $unique = (int) ($r->unique_visitors ?? 0);
            $ret    = (int) ($r->returning_visitors ?? 0);

            return [
                'section'            => $section,
                'views'              => (int) ($r->views ?? 0),
                'unique_visitors'    => $unique,
                'returning_visitors' => $ret,
                'return_rate'        => $unique > 0 ? round($ret * 100 / $unique, 1) : null,
            ];
        })->sortByDesc('unique_visitors')->values();

        $site = DB::table('page_views')->where('viewed_on', '>=', $since)->select('visitor_hash', DB::raw('COUNT(DISTINCT viewed_on) as d'))->groupBy('visitor_hash')->get();

        return response()->json(['data' => [
            'days'     => $days,
            'origins'  => $this->originsSummary($since),
            'entries'  => $this->entriesSummary($since),
            'since'    => $since,
            'sections' => $sections,
            'site'     => [
                'unique_visitors'    => $site->count(),
                'returning_visitors' => $site->where('d', '>=', 2)->count(),
                'views'              => (int) $sections->sum('views'),
            ],
        ]]);
    }

    /** Por origen (source/campaign): sesiones, visitantes únicos y % que vuelve (2+ días con visitas en la ventana). */
    private function originsSummary(string $since): array
    {
        $returning = DB::table('page_views')->where('viewed_on', '>=', $since)
            ->groupBy('visitor_hash')->havingRaw('COUNT(DISTINCT viewed_on) >= 2')->pluck('visitor_hash')->flip();

        return DB::table('visit_origins')->where('visited_on', '>=', $since)
            ->select('source', 'medium', 'campaign', 'visitor_hash', DB::raw('SUM(sessions) as sessions'))
            ->groupBy('source', 'medium', 'campaign', 'visitor_hash')->get()
            ->groupBy(fn ($r) => $r->source . "\0" . $r->campaign)
            ->map(function ($rows) use ($returning) {
                $unique = $rows->pluck('visitor_hash')->unique();
                $ret    = $unique->filter(fn ($h) => $returning->has($h))->count();

                return [
                    'source'             => $rows[0]->source !== '' ? $rows[0]->source : null,
                    'campaign'           => $rows[0]->campaign !== '' ? $rows[0]->campaign : null,
                    'mediums'            => $rows->pluck('medium')->filter()->unique()->values()->all(),
                    'sessions'           => (int) $rows->sum('sessions'),
                    'unique_visitors'    => $unique->count(),
                    'returning_visitors' => $ret,
                    'return_rate'        => round($ret * 100 / $unique->count(), 1),
                ];
            })->sortByDesc('unique_visitors')->values()->all();
    }

    /** Páginas de entrada más frecuentes (primera página de cada sesión). */
    private function entriesSummary(string $since): array
    {
        return DB::table('visit_origins')->where('visited_on', '>=', $since)
            ->groupBy('entry_path')
            ->select('entry_path', DB::raw('SUM(sessions) as sessions'), DB::raw('COUNT(DISTINCT visitor_hash) as unique_visitors'))
            ->orderByDesc('sessions')->limit(15)->get()
            ->map(fn ($r) => ['entry_path' => $r->entry_path, 'sessions' => (int) $r->sessions, 'unique_visitors' => (int) $r->unique_visitors])
            ->all();
    }
}
