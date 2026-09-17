<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankDebt extends Model
{
    protected $fillable = [
        'identifier',
        'period',
        'entity',
        'amount',
        'situation',
        'under_review',
        'legal_proceeding',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'under_review'     => 'boolean',
        'legal_proceeding' => 'boolean',
    ];
}
