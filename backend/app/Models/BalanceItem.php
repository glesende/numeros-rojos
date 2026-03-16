<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BalanceItem extends Model
{
    protected $fillable = ['name', 'order'];

    public function subitems()
    {
        return $this->hasMany(BalanceSubitem::class)->orderBy('order')->orderBy('name');
    }

    public function breakdowns()
    {
        return $this->hasMany(BalanceBreakdown::class);
    }
}
