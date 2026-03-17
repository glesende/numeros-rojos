<?php

namespace App\Services;

use App\Models\Balance;
use App\Models\Setting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Storage;

class OpenAiService
{
    private Client $client;

    // Available models for selection in admin UI
    public const MODELS = [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
    ];

    public function __construct()
    {
        $this->client = new Client(['timeout' => 180]);
    }

    /**
     * Analyze a balance document in two stages:
     * Stage 1: Evaluate existing catalog against the document (what's missing?)
     * Stage 2: Professional breakdown of every figure into items/subitems
     */
    public function analyzeBalance(Balance $balance, array $items): array
    {
        $apiKey = Setting::get('openai_api_key');
        $model  = Setting::get('openai_model', 'gpt-4o');

        if (empty($apiKey)) {
            throw new \RuntimeException('OpenAI API Key no configurada');
        }

        $filePath = Storage::disk('local')->path($balance->file_path);

        if (!file_exists($filePath)) {
            throw new \RuntimeException('Archivo del balance no encontrado');
        }

        $fileContent    = base64_encode(file_get_contents($filePath));
        $mimeType       = $this->detectMimeType($filePath);
        $fileAttachment = $this->buildFileContent($fileContent, $mimeType, $balance->file_original_name);

        // Stage 1: Evaluate existing catalog vs document
        $stage1 = $this->evaluateCatalog($apiKey, $model, $fileAttachment, $items, $balance->exercise);

        // Build enriched catalog: existing items + stage 1 suggestions
        $enrichedItems = $this->mergeWithSuggestions($items, $stage1);

        // Stage 2: Professional and exhaustive breakdown using enriched catalog
        $stage2 = $this->generateBreakdown($apiKey, $model, $fileAttachment, $enrichedItems, $balance->exercise);

        $notes = implode(' ', array_filter([
            $stage1['catalog_assessment'] ?? '',
            $stage2['notes'] ?? '',
        ]));

        return [
            'stage1'       => $stage1,
            'stage2'       => $stage2,
            // Backward-compatible fields
            'breakdown'    => $stage2['breakdown'] ?? [],
            'new_items'    => $stage1['new_items'] ?? [],
            'new_subitems' => $stage1['new_subitems'] ?? [],
            'notes'        => trim($notes),
        ];
    }

    /**
     * Stage 1: Evaluate whether the existing catalog of items/subitems covers
     * all financial concepts present in the balance document.
     * Returns suggestions for new items and subitems to create.
     */
    private function evaluateCatalog(
        string $apiKey,
        string $model,
        array $fileAttachment,
        array $items,
        string $exercise
    ): array {
        $itemsList = $this->buildItemsList($items);

        $systemPrompt = <<<PROMPT
Eres un experto en contabilidad de clubes de fútbol argentinos, con profundo conocimiento de las normas de la Asociación del Fútbol Argentino (AFA) y la CONEAU.
Tu tarea es evaluar si el catálogo de categorías contables existente es suficiente para representar TODOS los conceptos financieros presentes en el balance adjunto.
Debes responder ÚNICAMENTE con un JSON válido, sin texto adicional ni explicaciones fuera del JSON.
PROMPT;

        $userPrompt = <<<PROMPT
Analiza el balance del ejercicio {$exercise} y evaluá si el catálogo actual cubre todos sus conceptos financieros.

Catálogo actual de items y subitems:
{$itemsList}

Respondé ÚNICAMENTE con el siguiente JSON (sin texto fuera del JSON):
{
  "new_items": ["nombre del item nuevo 1", "nombre del item nuevo 2"],
  "new_subitems": [
    {"item": "nombre del item padre existente", "name": "nombre del subitem nuevo"}
  ],
  "catalog_assessment": "evaluación concisa del catálogo: qué conceptos del balance no tienen representación adecuada",
  "notes": "observaciones adicionales relevantes para el desglose"
}

Criterios para sugerir nuevos items:
- Solo sugerir si el concepto NO puede encajar razonablemente en ningún item existente
- Usar nomenclatura estándar de contabilidad de clubes de fútbol argentinos
- Los items deben permitir comparación histórica entre ejercicios
- No duplicar ni fragmentar en exceso: preferir subitems sobre items nuevos cuando sea posible
- Si el catálogo es suficiente, devolver arrays vacíos
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            [
                'role'    => 'user',
                'content' => [
                    ['type' => 'text', 'text' => $userPrompt],
                    $fileAttachment,
                ],
            ],
        ];

        return $this->callOpenAi($apiKey, $model, $messages, 2048);
    }

    /**
     * Stage 2: Generate a complete and professional financial breakdown.
     * Every monetary figure in the document must be captured.
     * Uses the enriched catalog (existing + stage 1 suggestions).
     */
    private function generateBreakdown(
        string $apiKey,
        string $model,
        array $fileAttachment,
        array $items,
        string $exercise
    ): array {
        $itemsList = $this->buildItemsList($items);

        // Allow larger output for models that support it
        $maxTokens = match (true) {
            str_contains($model, 'gpt-4o') => 8192,
            $model === 'gpt-4'             => 8192,
            default                        => 4096,
        };

        $systemPrompt = <<<PROMPT
Eres un experto contable especializado en balances de clubes de fútbol argentinos.
Tu misión es extraer el desglose financiero COMPLETO, PRECISO y EXHAUSTIVO del balance adjunto.
Cada cifra del documento DEBE ser capturada correctamente para garantizar comparación histórica entre ejercicios.
No omitir ningún dato. Priorizar la completitud sobre la brevedad.
Debes responder ÚNICAMENTE con un JSON válido, sin texto adicional ni explicaciones fuera del JSON.
PROMPT;

        $userPrompt = <<<PROMPT
Realizá un análisis PROFESIONAL y EXHAUSTIVO del balance del ejercicio {$exercise}.

Catálogo disponible de items y subitems (usá los nombres EXACTAMENTE como aparecen):
{$itemsList}

Respondé ÚNICAMENTE con el siguiente JSON (sin texto fuera del JSON):
{
  "breakdown": [
    {
      "item": "nombre exacto del item del catálogo",
      "subitem": "nombre exacto del subitem del catálogo o null",
      "amount": 1234567.89,
      "currency": "ARS"
    }
  ],
  "notes": "porcentaje estimado del balance capturado y observaciones importantes sobre el análisis"
}

Requisitos obligatorios:
- Extraer CADA cifra monetaria del documento, sin excepción
- Usar nombres EXACTOS del catálogo (sin variaciones, abreviaciones ni traducciones)
- Montos numéricos sin símbolos ni separadores de miles (ej: 1234567.89, no $1.234.567,89)
- Montos NEGATIVOS para egresos, pasivos, pérdidas y déficit
- Moneda ARS, USD o EUR según corresponda al documento
- Si un concepto aparece en múltiples secciones (ingresos y egresos separados), registrar cada uno por separado
- Registrar subtotales y totales solo si representan conceptos distintos no cubiertos por los ítems individuales
- Ante la duda en la categorización, asignar al item más específico disponible
- Es preferible más filas que perder datos
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            [
                'role'    => 'user',
                'content' => [
                    ['type' => 'text', 'text' => $userPrompt],
                    $fileAttachment,
                ],
            ],
        ];

        return $this->callOpenAi($apiKey, $model, $messages, $maxTokens);
    }

    /**
     * Merge existing items catalog with stage 1 suggestions.
     * New items and subitems are added as virtual entries (id = null)
     * so stage 2 can reference them by name.
     */
    private function mergeWithSuggestions(array $items, array $stage1Result): array
    {
        $newItems    = $stage1Result['new_items'] ?? [];
        $newSubitems = $stage1Result['new_subitems'] ?? [];

        foreach ($newItems as $newItemName) {
            $exists = array_filter($items, fn ($item) => strtolower($item['name']) === strtolower($newItemName));
            if (empty($exists)) {
                $items[] = ['id' => null, 'name' => $newItemName, 'subitems' => []];
            }
        }

        foreach ($newSubitems as $newSubitem) {
            $parentName = $newSubitem['item'] ?? '';
            $subName    = $newSubitem['name'] ?? '';

            foreach ($items as &$item) {
                if (strtolower($item['name']) === strtolower($parentName)) {
                    $subExists = array_filter(
                        $item['subitems'],
                        fn ($s) => strtolower($s['name']) === strtolower($subName)
                    );
                    if (empty($subExists)) {
                        $item['subitems'][] = ['id' => null, 'name' => $subName];
                    }
                    break;
                }
            }
            unset($item);
        }

        return $items;
    }

    private function callOpenAi(string $apiKey, string $model, array $messages, int $maxTokens = 4096): array
    {
        try {
            $response = $this->client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type'  => 'application/json',
                ],
                'json' => [
                    'model'           => $model,
                    'messages'        => $messages,
                    'response_format' => ['type' => 'json_object'],
                    'max_tokens'      => $maxTokens,
                ],
            ]);

            $data    = json_decode($response->getBody()->getContents(), true);
            $content = $data['choices'][0]['message']['content'] ?? '{}';

            return json_decode($content, true) ?? [];
        } catch (GuzzleException $e) {
            throw new \RuntimeException('Error al llamar a OpenAI: ' . $e->getMessage());
        }
    }

    private function buildItemsList(array $items): string
    {
        if (empty($items)) {
            return '(sin items configurados)';
        }

        $lines = [];
        foreach ($items as $item) {
            $lines[] = "- {$item['name']}";
            if (!empty($item['subitems'])) {
                foreach ($item['subitems'] as $sub) {
                    $lines[] = "  - {$sub['name']}";
                }
            }
        }

        return implode("\n", $lines);
    }

    private function buildFileContent(string $base64Content, string $mimeType, ?string $filename): array
    {
        // PDF: send as file content (supported by GPT-4o)
        if ($mimeType === 'application/pdf') {
            return [
                'type' => 'file',
                'file' => [
                    'filename'  => $filename ?? 'balance.pdf',
                    'file_data' => "data:{$mimeType};base64,{$base64Content}",
                ],
            ];
        }

        // Images: send as image_url
        if (str_starts_with($mimeType, 'image/')) {
            return [
                'type'      => 'image_url',
                'image_url' => [
                    'url'    => "data:{$mimeType};base64,{$base64Content}",
                    'detail' => 'high',
                ],
            ];
        }

        // Other file types: send as decoded text
        return [
            'type' => 'text',
            'text' => "Contenido del archivo:\n" . base64_decode($base64Content),
        ];
    }

    private function detectMimeType(string $filePath): string
    {
        if (function_exists('mime_content_type')) {
            $type = mime_content_type($filePath);
            if ($type) {
                return $type;
            }
        }

        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        return match ($ext) {
            'pdf'  => 'application/pdf',
            'xls'  => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'doc'  => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            default => 'application/octet-stream',
        };
    }
}
