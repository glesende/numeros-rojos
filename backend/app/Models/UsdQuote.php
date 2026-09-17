<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsdQuote extends Model
{
    protected $fillable = [
        'quote_date',
        'rate',
    ];

    protected $casts = [
        'quote_date' => 'date',
        'rate'       => 'decimal:4',
    ];
}
