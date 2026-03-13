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
        'official',
        'carried_out',
        'links',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'official'    => 'boolean',
        'carried_out' => 'boolean',
        'links'       => 'array',
        'record_date' => 'date',
    ];

    public function scopeOfficial($query, ?bool $official): mixed
    {
        if ($official === null) {
            return $query;
        }
        return $query->where('official', $official);
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
}
