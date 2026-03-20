<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EconomyRecord extends Model
{
    use HasFactory;

    protected $table = 'economy_records';

    protected $fillable = [
        'description',
        'comments',
        'entity',
        'type',
        'amount',
        'currency',
        'record_date',
        'carried_out',
        'links',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'carried_out' => 'boolean',
        'links'       => 'array',
        'record_date' => 'date',
    ];

    public function scopeOfficial($query, ?bool $official): mixed
    {
        if ($official === null) {
            return $query;
        }
        if ($official) {
            return $query->whereJsonContains('links', ['official' => true]);
        }
        return $query->whereRaw("(links IS NULL OR NOT JSON_CONTAINS(COALESCE(links, '[]'), '{\"official\":true}'))");
    }

    public function scopeType($query, ?string $type): mixed
    {
        if ($type === null) {
            return $query;
        }
        return $query->where('type', $type);
    }

    public function scopeDateFrom($query, ?string $from): mixed
    {
        if ($from === null) {
            return $query;
        }
        return $query->where('record_date', '>=', $from);
    }

    public function scopeDateTo($query, ?string $to): mixed
    {
        if ($to === null) {
            return $query;
        }
        return $query->where('record_date', '<=', $to);
    }

    public function scopeCarriedOut($query, ?bool $carriedOut): mixed
    {
        if ($carriedOut === null) {
            return $query;
        }
        return $query->where('carried_out', $carriedOut);
    }

    public function scopeSearch($query, ?string $search): mixed
    {
        if ($search === null || $search === '') {
            return $query;
        }
        return $query->where(function ($q) use ($search) {
            $q->where('description', 'like', '%' . $search . '%')
              ->orWhere('entity', 'like', '%' . $search . '%');
        });
    }

    public function scopeCurrency($query, ?string $currency): mixed
    {
        if ($currency === null) {
            return $query;
        }
        return $query->where('currency', $currency);
    }
}
