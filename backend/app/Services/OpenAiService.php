<?php

namespace App\Services;

use App\Models\Balance;
use App\Models\BalanceLine;
use App\Models\Setting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\DB;
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
     * Analyze a balance document (single stage).
     * Returns the parsed hierarchical JSON from the AI for preview.
     * Does NOT persist anything to the database.
     */
    public function analyzeBalance(Balance $balance): array
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

        $maxTokens = match (true) {
            str_contains($model, 'gpt-4o') => 8192,
            $model === 'gpt-4'             => 8192,
            default                        => 4096,
        };

        $existingPaths = BalanceLine::where('balance_id', '!=', $balance->id)
            ->whereNotNull('path')
            ->distinct()
            ->orderBy('path')
            ->pluck('path')
            ->toArray();

        $systemPrompt = <<<PROMPT
Sos un parser contable especializado en estados financieros.

Objetivo:
Extraer datos estructurados de TODOS los estados financieros presentes en el documento, únicamente del ejercicio principal.

Definición:
El ejercicio principal se indica claramente en alguna de las primeras páginas del documento.
Cualquier columna comparativa con otros ejercicios debe ser ignorada completamente. Esos balances se cargarán de forma independiente.

Reglas:

- Extraer TODOS los estados financieros presentes, incluyendo:
  - Estado de Situación Patrimonial
  - Estado de Resultados (Recursos y Gastos)
  - Estado de Flujo de Efectivo
  - Estado de Evolución del Patrimonio Neto

- Cada estado debe ser representado como un nodo raíz independiente dentro de "data"

- Usar nombres normalizados para los nodos raíz:
  - "situacion_patrimonial"
  - "resultados"
  - "estado_flujo"
  - "patrimonio_neto"
  - "otros" (solo si no encaja en los anteriores)

- Extraer SOLO valores del ejercicio principal

- Ignorar completamente:
  - columnas comparativas
  - ejercicios anteriores
  - porcentajes o variaciones

- Si una fila tiene múltiples valores:
  - tomar únicamente el correspondiente al ejercicio principal

- No devolver múltiples fechas

- Mantener estructura jerárquica completa

- No renombrar cuentas (excepto los nodos raíz que deben estar normalizados)

- No agrupar ni resumir

- Marcar "is_total": true en los nodos que representen totales o subtotales

- Montos numéricos sin símbolos ni separadores de miles

- Montos NEGATIVOS para:
  - egresos
  - pasivos
  - pérdidas
  - déficit

Considerar equivalencias:
- "Estado de Recursos y Gastos" = resultados
- "Estado de Ingresos y Egresos" = resultados
- "Estado de Origen y Aplicación de Fondos" = estado_flujo
- "Cash Flow" = estado_flujo

- Si un nodo tiene children, puede o no tener "amount"

- Algunas páginas pueden estar rotadas (orientación horizontal/landscape). Procesarlas igual, rotando la lectura según corresponda.

Debes responder ÚNICAMENTE con un JSON válido, sin texto adicional.
PROMPT;

        if (!empty($existingPaths)) {
            $pathList      = implode("\n", array_map(fn($p) => "- {$p}", $existingPaths));
            $systemPrompt .= <<<PATHS


Paths de referencia (otros balances ya cargados en el sistema):
{$pathList}

Reglas para usar estos paths:
- Son una guía de nomenclatura, no una restricción. Pueden aparecer cuentas nuevas que no estén en esta lista: incluirlas normalmente.
- Antes de crear un nodo con un nombre nuevo, evaluá si semánticamente corresponde a alguno de los paths existentes (puede estar escrito diferente, abreviado, o traducido).
- Si hay equivalencia clara, usar el nombre exacto del path existente para mantener consistencia entre balances.
- Si no hay equivalencia, usar el nombre tal como aparece en el documento.
PATHS;
        }

        $userPrompt = <<<PROMPT
Analizá el documento adjunto y extraé TODOS los estados financieros presentes.

Respondé ÚNICAMENTE con el siguiente JSON (sin texto fuera del JSON):

{
  "fecha": "2024-06-30",
  "moneda": "ARS",
  "data": [
    {
      "name": "situacion_patrimonial",
      "is_total": false,
      "children": [
        {
          "name": "Activo",
          "is_total": false,
          "children": []
        }
      ]
    },
    {
      "name": "resultados",
      "is_total": false,
      "children": [
        {
          "name": "Ingresos",
          "is_total": false,
          "children": []
        }
      ]
    }
  ]
}

Valores aceptados para "estado": situacion_patrimonial, resultados, estado_flujo, otros
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
     * Persist the hierarchical AI result into balance_lines.
     * Deletes all existing lines for this balance first, then inserts recursively.
     */
    public function persistLines(Balance $balance, array $data): void
    {
        DB::transaction(function () use ($balance, $data) {
            BalanceLine::where('balance_id', $balance->id)->delete();

            $order = 0;
            foreach ($data as $node) {
                $this->insertLine($node, $balance->id, null, 1, '', $order);
                $order++;
            }
        });
    }

    /**
     * Recursive helper to insert a single line and all its descendants.
     */
    private function insertLine(array $node, int $balanceId, ?int $parentId, int $level, string $parentPath, int $order): void
    {
        $name = $node['name'] ?? '';
        $path = $parentPath ? ($parentPath . ' > ' . $name) : $name;

        $line = BalanceLine::create([
            'balance_id'      => $balanceId,
            'parent_id'       => $parentId,
            'name'            => $name,
            'normalized_name' => BalanceLine::normalizeName($name),
            'level'           => $level,
            'order'           => $order,
            'amount'          => $node['amount'] ?? null,
            'currency'        => $node['currency'] ?? 'ARS',
            'is_total'        => $node['is_total'] ?? false,
            'path'            => $path,
        ]);

        $childOrder = 0;
        foreach ($node['children'] ?? [] as $child) {
            $this->insertLine($child, $balanceId, $line->id, $level + 1, $path, $childOrder);
            $childOrder++;
        }
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

    private function buildFileContent(string $base64Content, string $mimeType, ?string $filename): array
    {
        if ($mimeType === 'application/pdf') {
            return [
                'type' => 'file',
                'file' => [
                    'filename'  => $filename ?? 'balance.pdf',
                    'file_data' => "data:{$mimeType};base64,{$base64Content}",
                ],
            ];
        }

        if (str_starts_with($mimeType, 'image/')) {
            return [
                'type'      => 'image_url',
                'image_url' => [
                    'url'    => "data:{$mimeType};base64,{$base64Content}",
                    'detail' => 'high',
                ],
            ];
        }

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
