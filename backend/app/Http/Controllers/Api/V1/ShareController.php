<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Balance;
use App\Models\BalanceLine;
use App\Models\Contract;
use App\Models\ElectionList;
use App\Models\Setting;
use App\Services\ShareCardRenderer;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * Tarjetas para compartir: HTML mínimo con og:/twitter: tags por página (lo sirve nginx a los
 * crawlers de redes sociales, que no ejecutan JS) e imagen PNG 1200x630 con la cifra principal.
 */
class ShareController extends Controller
{
    public function page(string $type, string $id): Response
    {
        $card = $this->cardFor($type, $id);
        $base = $this->baseUrl();
        $url  = $base . $card['path'];
        $img  = $base . '/api/api/v1/share/' . $type . '/' . $id . '/image.png';

        $e = fn (string $s) => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">'
            . '<title>' . $e($card['title']) . '</title>'
            . '<meta name="description" content="' . $e($card['description']) . '">'
            . '<link rel="canonical" href="' . $e($url) . '">'
            . '<meta property="og:type" content="article">'
            . '<meta property="og:site_name" content="Números Rojos">'
            . '<meta property="og:locale" content="es_AR">'
            . '<meta property="og:title" content="' . $e($card['title']) . '">'
            . '<meta property="og:description" content="' . $e($card['description']) . '">'
            . '<meta property="og:url" content="' . $e($url) . '">'
            . '<meta property="og:image" content="' . $e($img) . '">'
            . '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            . '<meta name="twitter:card" content="summary_large_image">'
            . '<meta name="twitter:title" content="' . $e($card['title']) . '">'
            . '<meta name="twitter:description" content="' . $e($card['description']) . '">'
            . '<meta name="twitter:image" content="' . $e($img) . '">'
            . '<meta http-equiv="refresh" content="0;url=' . $e($url) . '">'
            . '</head><body><h1>' . $e($card['title']) . '</h1><p>' . $e($card['description'])
            . '</p><p><a href="' . $e($url) . '">Ver en Números Rojos</a></p></body></html>';

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'public, max-age=300']);
    }

    public function image(string $type, string $id): Response
    {
        $card = $this->cardFor($type, $id);
        $sig  = md5(json_encode($card['image']));
        $file = "share-cards/{$type}-" . preg_replace('/[^a-z0-9_-]/i', '', $id) . "-{$sig}.png";
        $disk = Storage::disk('local');

        $png = $disk->exists($file) ? $disk->get($file) : ShareCardRenderer::render($card['image']);

        if ($png === null) {
            // Sin GD o sin fuente: cae a la imagen genérica del sitio en lugar de romper la preview.
            return response('', 302, ['Location' => $this->baseUrl() . '/og-image-nr.png', 'Cache-Control' => 'public, max-age=300']);
        }

        if (!$disk->exists($file)) {
            $disk->put($file, $png);
        }

        return response($png, 200, ['Content-Type' => 'image/png', 'Cache-Control' => 'public, max-age=86400']);
    }

    /** @return array{title:string,description:string,path:string,image:array} */
    private function cardFor(string $type, string $id): array
    {
        return match ($type) {
            'balances'  => $this->balanceCard((int) $id),
            'contratos' => $this->contractCard((int) $id),
            'elecciones' => $this->electionCard($id),
            default     => abort(404),
        };
    }

    private function balanceCard(int $id): array
    {
        $b = Balance::findOrFail($id);

        $totals = BalanceLine::where('balance_id', $id)->where('is_total', true)->whereNotNull('amount')
            ->where('level', 1)->orderBy('order')->limit(3)->get();
        $figures = $totals->map(fn ($l) => [
            'label' => $l->name,
            'value' => self::money((float) $l->amount, $l->currency ?: 'ARS'),
        ])->all();

        $desc = "Balance patrimonial del ejercicio {$b->exercise} del Club Atlético Independiente.";
        if ($figures) {
            $desc .= ' ' . implode(' · ', array_map(fn ($f) => "{$f['label']}: {$f['value']}", $figures)) . '.';
        }

        return [
            'title'       => "Balance {$b->exercise} de Independiente | Números Rojos",
            'description' => $desc,
            'path'        => "/balances/{$b->id}",
            'image'       => [
                'kicker'  => 'BALANCE OFICIAL',
                'title'   => "Ejercicio {$b->exercise}",
                'figures' => $figures,
                'footer'  => $b->published_at ? 'Publicado el ' . $b->published_at->format('d/m/Y') : '',
            ],
        ];
    }

    private function contractCard(int $id): array
    {
        $c = Contract::findOrFail($id);
        $end = $c->termination_date ?: $c->expiration_date;

        $figures = [];
        if ((float) $c->estimated_salary > 0) {
            $figures[] = ['label' => 'Salario estimado', 'value' => self::money((float) $c->estimated_salary, $c->currency ?: 'USD')];
        }
        if ($end) {
            $figures[] = ['label' => $c->termination_date ? 'Rescindido' : 'Vencimiento', 'value' => $end->format('d/m/Y')];
        }
        if ((float) $c->club_pass_percentage > 0) {
            $figures[] = ['label' => 'Pase del club', 'value' => rtrim(rtrim(number_format((float) $c->club_pass_percentage, 2, ',', ''), '0'), ',') . '%'];
        }

        $desc = "Contrato de {$c->full_name} en el Club Atlético Independiente.";
        if ($figures) {
            $desc .= ' ' . implode(' · ', array_map(fn ($f) => "{$f['label']}: {$f['value']}", $figures)) . '.';
        }

        return [
            'title'       => "Contrato de {$c->full_name} en Independiente | Números Rojos",
            'description' => $desc,
            'path'        => "/contratos/{$c->id}",
            'image'       => ['kicker' => 'CONTRATO', 'title' => $c->full_name, 'figures' => $figures, 'footer' => ''],
        ];
    }

    private function electionCard(string $slug): array
    {
        if (Setting::get('section_elecciones_enabled', '0') !== '1') {
            abort(404);
        }
        $list = ElectionList::withCount(['candidates', 'proposals'])->where('slug', $slug)->firstOrFail();

        $figures = [
            ['label' => 'Candidatos', 'value' => (string) $list->candidates_count],
            ['label' => 'Propuestas', 'value' => (string) $list->proposals_count],
        ];

        return [
            'title'       => "{$list->name} | Elecciones | Números Rojos",
            'description' => "Candidatos, propuestas, compromisos y metas de {$list->name} para las elecciones de Independiente.",
            'path'        => "/elecciones/{$list->slug}",
            'image'       => ['kicker' => 'ELECCIONES DE INDEPENDIENTE', 'title' => $list->name, 'figures' => $figures, 'footer' => 'Propuestas y compromisos verificables'],
        ];
    }

    /** Monto compacto en es-AR: 1.234 M, 5,2 mil M, etc. */
    private static function money(float $amount, string $currency): string
    {
        $sym = $currency === 'ARS' ? '$' : ($currency === 'USD' ? 'US$' : $currency . ' ');
        $abs = abs($amount);
        $sign = $amount < 0 ? '-' : '';
        if ($abs >= 1e12) {
            $n = number_format($abs / 1e12, 1, ',', '.') . ' billones';
        } elseif ($abs >= 1e9) {
            $n = number_format($abs / 1e6, 0, ',', '.') . ' M';
        } elseif ($abs >= 1e6) {
            $n = number_format($abs / 1e6, 1, ',', '.') . ' M';
        } else {
            $n = number_format($abs, 0, ',', '.');
        }

        return $sign . $sym . str_replace(',0 ', ' ', $n);
    }

    private function baseUrl(): string
    {
        return rtrim(env('FRONTEND_URL', 'https://www.numerosrojos.net'), '/');
    }
}
