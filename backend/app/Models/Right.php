<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Right extends Model
{
    use HasFactory;

    protected $table = 'rights';

    protected $fillable = [
        'external_id',
        'full_name',
        'clauses',
    ];

    protected $casts = [
        'clauses' => 'array',
    ];

    public function scopeSearch($query, ?string $search): mixed
    {
        if ($search === null || $search === '') {
            return $query;
        }
        return $query->where('full_name', 'like', '%' . $search . '%');
    }
}
