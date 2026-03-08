<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    protected $table = 'contracts';

    protected $fillable = [
        'nombre_completo',
        'fecha_firma',
        'fecha_caducidad',
        'porcentaje_pase_club',
        'salario_estimado',
        'moneda',
        'oficial',
        'confidence_level',
        'clausulas',
        'links',
    ];

    protected $casts = [
        'porcentaje_pase_club' => 'decimal:2',
        'salario_estimado'     => 'decimal:2',
        'oficial'              => 'boolean',
        'clausulas'            => 'array',
        'links'                => 'array',
        'fecha_firma'          => 'date',
        'fecha_caducidad'      => 'date',
    ];

    public function scopeOficial($query, ?bool $oficial): mixed
    {
        if ($oficial === null) {
            return $query;
        }
        return $query->where('oficial', $oficial);
    }

    public function scopeFechaDesde($query, ?string $desde): mixed
    {
        if ($desde === null) {
            return $query;
        }
        return $query->where('fecha_firma', '>=', $desde);
    }

    public function scopeFechaHasta($query, ?string $hasta): mixed
    {
        if ($hasta === null) {
            return $query;
        }
        return $query->where('fecha_firma', '<=', $hasta);
    }

    public function scopeBuscar($query, ?string $buscar): mixed
    {
        if ($buscar === null || $buscar === '') {
            return $query;
        }
        return $query->where('nombre_completo', 'like', '%' . $buscar . '%');
    }

    public function scopeVigencia($query, ?string $vigencia): mixed
    {
        if ($vigencia === null || $vigencia === '') {
            return $query;
        }

        $today = now()->startOfDay();

        return match ($vigencia) {
            '6m'  => $query->where('fecha_caducidad', '>=', $today)
                           ->where('fecha_caducidad', '<=', $today->copy()->addMonths(6)),
            '12m' => $query->where('fecha_caducidad', '>=', $today)
                           ->where('fecha_caducidad', '<=', $today->copy()->addMonths(12)),
            '18m' => $query->where('fecha_caducidad', '>=', $today)
                           ->where('fecha_caducidad', '<=', $today->copy()->addMonths(18)),
            default => $query,
        };
    }
}
