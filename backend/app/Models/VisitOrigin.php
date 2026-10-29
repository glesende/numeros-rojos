<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Primera visita de cada sesión con sus utm (anónimo). Ver AnalyticsController::origin y docs/analytics.md. */
class VisitOrigin extends Model
{
    protected $fillable = ['visitor_hash', 'visited_on', 'source', 'medium', 'campaign', 'entry_path', 'sessions'];

    protected $casts = ['visited_on' => 'date'];
}
