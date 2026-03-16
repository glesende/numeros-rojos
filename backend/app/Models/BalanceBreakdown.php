<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BalanceBreakdown extends Model
{
    protected $fillable = [
        'balance_id',
        'balance_item_id',
        'balance_subitem_id',
        'amount',
        'currency',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function balance()
    {
        return $this->belongsTo(Balance::class);
    }

    public function item()
    {
        return $this->belongsTo(BalanceItem::class, 'balance_item_id');
    }

    public function subitem()
    {
        return $this->belongsTo(BalanceSubitem::class, 'balance_subitem_id');
    }
}
