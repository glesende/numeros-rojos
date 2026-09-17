<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RejectedCheck extends Model
{
    protected $fillable = [
        'identifier',
        'check_number',
        'entity',
        'cause',
        'rejection_date',
        'amount',
        'payment_date',
        'fine_payment_date',
        'fine_status',
        'personal_account',
        'legal_entity_name',
        'under_review',
        'legal_proceeding',
    ];

    protected $casts = [
        'rejection_date'    => 'date',
        'payment_date'      => 'date',
        'fine_payment_date' => 'date',
        'amount'            => 'decimal:2',
        'personal_account'  => 'boolean',
        'under_review'      => 'boolean',
        'legal_proceeding'  => 'boolean',
    ];
}
