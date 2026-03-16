<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Balance extends Model
{
    protected $fillable = [
        'exercise',
        'file_path',
        'file_original_name',
        'dollar_reference',
        'published_at',
    ];

    protected $casts = [
        'dollar_reference' => 'decimal:2',
        'published_at'     => 'date',
    ];

    public function breakdowns()
    {
        return $this->hasMany(BalanceBreakdown::class);
    }
}
