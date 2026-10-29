<?php

namespace App\Services;

/**
 * Dibuja la tarjeta 1200x630 (og:image) con GD. Devuelve null si no hay GD/FreeType o fuente TTF,
 * para que el llamador caiga a la imagen genérica del sitio.
 */
class ShareCardRenderer
{
    private const W = 1200;
    private const H = 630;

    private const FONT_CANDIDATES = [
        ['/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf'],
        ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'],
    ];

    /** @param array{kicker:string,title:string,figures:array<int,array{label:string,value:string}>,footer:string} $d */
    public static function render(array $d): ?string
    {
        [$bold, $regular] = self::fonts() ?? [null, null];
        if (!$bold || !function_exists('imagecreatetruecolor') || !function_exists('imagettftext')) {
            return null;
        }

        $im = imagecreatetruecolor(self::W, self::H);
        $bg    = imagecolorallocate($im, 17, 17, 17);
        $red   = imagecolorallocate($im, 223, 13, 16);
        $white = imagecolorallocate($im, 255, 255, 255);
        $grey  = imagecolorallocate($im, 163, 163, 163);

        imagefilledrectangle($im, 0, 0, self::W, self::H, $bg);
        imagefilledrectangle($im, 0, 0, 24, self::H, $red);

        imagettftext($im, 26, 0, 80, 100, $red, $bold, $d['kicker']);

        // Título: hasta 2 líneas, achicando si es largo.
        $size = mb_strlen($d['title']) > 28 ? 46 : 62;
        $lines = self::wrap($d['title'], $bold, $size, 1040, 2);
        $y = 190;
        foreach ($lines as $line) {
            imagettftext($im, $size, 0, 80, $y, $white, $bold, $line);
            $y += (int) ($size * 1.3);
        }

        // Cifras (hasta 3 columnas).
        $figs = array_slice($d['figures'], 0, 3);
        $colW = 1040 / max(count($figs), 1);
        foreach ($figs as $i => $f) {
            $x = 80 + (int) ($i * $colW);
            $vs = 44;
            while ($vs > 24 && self::width($f['value'], $bold, $vs) > $colW - 24) {
                $vs -= 4;
            }
            imagettftext($im, $vs, 0, $x, 400, $white, $bold, $f['value']);
            $label = self::wrap($f['label'], $regular, 22, (int) $colW - 24, 2);
            $ly = 445;
            foreach ($label as $l) {
                imagettftext($im, 22, 0, $x, $ly, $grey, $regular, $l);
                $ly += 30;
            }
        }

        if ($d['footer'] !== '') {
            imagettftext($im, 22, 0, 80, 545, $grey, $regular, $d['footer']);
        }
        imagefilledrectangle($im, 80, 565, 1120, 567, $red);
        imagettftext($im, 26, 0, 80, 605, $white, $bold, 'numerosrojos.net');
        $tag = 'Datos abiertos de Independiente';
        imagettftext($im, 22, 0, 1120 - self::width($tag, $regular, 22), 605, $grey, $regular, $tag);

        ob_start();
        imagepng($im, null, 6);
        $png = ob_get_clean();

        return $png === false ? null : $png;
    }

    /** @return array{0:string,1:string}|null */
    private static function fonts(): ?array
    {
        foreach (self::FONT_CANDIDATES as [$b, $r]) {
            if (is_readable($b)) {
                return [$b, is_readable($r) ? $r : $b];
            }
        }

        return null;
    }

    private static function width(string $text, string $font, int $size): int
    {
        $box = imagettfbbox($size, 0, $font, $text);

        return $box ? (int) abs($box[2] - $box[0]) : 0;
    }

    /** @return string[] */
    private static function wrap(string $text, string $font, int $size, int $maxW, int $maxLines): array
    {
        $lines = [];
        $cur = '';
        foreach (preg_split('/\s+/u', trim($text)) as $word) {
            $try = $cur === '' ? $word : "$cur $word";
            if ($cur !== '' && self::width($try, $font, $size) > $maxW) {
                $lines[] = $cur;
                $cur = $word;
            } else {
                $cur = $try;
            }
        }
        if ($cur !== '') {
            $lines[] = $cur;
        }
        if (count($lines) > $maxLines) {
            $lines = array_slice($lines, 0, $maxLines);
            $lines[$maxLines - 1] = rtrim($lines[$maxLines - 1], ' .,') . '…';
        }

        return $lines;
    }
}
