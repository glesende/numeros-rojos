<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EconomyRecord extends Model
{
    use HasFactory;

    protected $table = 'economy_records';

    protected $fillable = [
        'descripcion',
        'tipo',
        'monto',
        'moneda',
        'fecha',
        'oficial',
        'confidence_level',
        'links',
    ];

    protected $casts = [
        'monto'   => 'decimal:2',
        'oficial'  => 'boolean',
        'links'    => 'array',
        'fecha'    => 'date',
    ];

    public function scopeOficial($query, ?bool $oficial): mixed
    {
        if ($oficial === null) {
            return $query;
        }
        return $query->where('oficial', $oficial);
    }

    public function scopeTipo($query, ?string $tipo): mixed
    {
        if ($tipo === null) {
            return $query;
        }
        return $query->where('tipo', $tipo);
    }

    public function scopeFechaDesde($query, ?string $desde): mixed
    {
        if ($desde === null) {
            return $query;
        }
        return $query->where('fecha', '>=', $desde);
    }

    public function scopeFechaHasta($query, ?string $hasta): mixed
    {
        if ($hasta === null) {
            return $query;
        }
        return $query->where('fecha', '<=', $hasta);
    }
}
