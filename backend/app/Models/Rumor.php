<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rumor extends Model
{
    protected $table = 'rumors';

    protected $fillable = [
        'external_id',
        'full_name',
        'status',
        'links',
    ];

    protected $casts = [
        'links' => 'array',
    ];

    public function scopeSearch($query, ?string $search): mixed
    {
        if ($search === null || $search === '') {
            return $query;
        }
        return $query->where('full_name', 'like', '%' . $search . '%');
    }
}
