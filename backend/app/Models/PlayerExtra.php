<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlayerExtra extends Model
{
    use HasFactory;

    protected $table = 'player_extras';

    protected $fillable = [
        'besoccer_player_id',
        'representative',
        'representative_url',
        'is_academy',
        'reviewed',
    ];

    protected $casts = [
        'is_academy' => 'boolean',
        'reviewed'   => 'boolean',
    ];
}
