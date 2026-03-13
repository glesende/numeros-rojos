<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    protected $table = 'contracts';

    protected $fillable = [
        'external_id',
        'full_name',
        'expiration_date',
        'club_pass_percentage',
        'estimated_salary',
        'currency',
        'official',
        'clauses',
        'links',
    ];

    protected $casts = [
        'club_pass_percentage' => 'decimal:2',
        'estimated_salary'     => 'decimal:2',
        'official'             => 'boolean',
        'clauses'             => 'array',
        'links'               => 'array',
        'expiration_date'     => 'date',
    ];

    public function scopeOfficial($query, ?bool $official): mixed
    {
        if ($official === null) {
            return $query;
        }
        return $query->where('official', $official);
    }

    public function scopeDateFrom($query, ?string $from): mixed
    {
        if ($from === null) {
            return $query;
        }
        return $query->where('expiration_date', '>=', $from);
    }

    public function scopeDateTo($query, ?string $to): mixed
    {
        if ($to === null) {
            return $query;
        }
        return $query->where('expiration_date', '<=', $to);
    }

    public function scopeSearch($query, ?string $search): mixed
    {
        if ($search === null || $search === '') {
            return $query;
        }
        return $query->where('full_name', 'like', '%' . $search . '%');
    }

    public function scopeValidity($query, ?string $validity): mixed
    {
        if ($validity === null || $validity === '') {
            return $query;
        }

        $today = now()->startOfDay();

        return match ($validity) {
            '6m'  => $query->where('expiration_date', '>=', $today)
                           ->where('expiration_date', '<=', $today->copy()->addMonths(6)),
            '12m' => $query->where('expiration_date', '>=', $today)
                           ->where('expiration_date', '<=', $today->copy()->addMonths(12)),
            '18m' => $query->where('expiration_date', '>=', $today)
                           ->where('expiration_date', '<=', $today->copy()->addMonths(18)),
            default => $query,
        };
    }
}
