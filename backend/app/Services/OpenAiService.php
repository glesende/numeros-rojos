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
        $this->client = new Client(['timeout' => 120]);
    }

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

        $fileContent  = base64_encode(file_get_contents($filePath));
        $mimeType     = $this->detectMimeType($filePath);

        $itemsList = $this->buildItemsList($items);

        $systemPrompt = <<<PROMPT
Eres un asistente experto en análisis de balances contables de clubes de fútbol argentinos.
Tu tarea es analizar el documento de balance proporcionado y extraer el desglose financiero.
Debes responder ÚNICAMENTE con un JSON válido, sin texto adicional.
PROMPT;

        $userPrompt = <<<PROMPT
Analiza el balance adjunto y extrae el desglose financiero completo.

Lista de items y subitems existentes:
{$itemsList}

Responde con el siguiente JSON:
{
  "breakdown": [
    {
      "item": "nombre del item (existente o nuevo)",
      "subitem": "nombre del subitem (opcional, existente o nuevo, null si no aplica)",
      "amount": 1234567.89,
      "currency": "ARS"
    }
  ],
  "new_items": ["nombre del item nuevo 1", "nombre del item nuevo 2"],
  "new_subitems": [
    {"item": "nombre del item padre", "name": "nombre del subitem nuevo"}
  ],
  "notes": "observaciones opcionales sobre el análisis"
}

Reglas:
- Usa los nombres exactos de los items/subitems existentes cuando correspondan
- Si un concepto no existe, agrégalo a new_items o new_subitems
- Los montos deben ser numéricos (sin símbolos de moneda ni separadores de miles)
- La moneda debe ser ARS, USD o EUR
- Si un monto es negativo (egreso/pasivo), usa un número negativo
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            [
                'role'    => 'user',
                'content' => [
                    ['type' => 'text', 'text' => $userPrompt],
                    $this->buildFileContent($fileContent, $mimeType, $balance->file_original_name),
                ],
            ],
        ];

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
                    'max_tokens'      => 4096,
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
        // PDF and documents: send as file content (supported by GPT-4o)
        if (in_array($mimeType, ['application/pdf'])) {
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

        // Other file types: send as text content (decoded)
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
