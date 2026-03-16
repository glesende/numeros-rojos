<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BalanceSubitem extends Model
{
    protected $fillable = ['balance_item_id', 'name', 'order'];

    public function item()
    {
        return $this->belongsTo(BalanceItem::class, 'balance_item_id');
    }
}
