<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Visitas anónimas por sección y día. Ver App\Http\Controllers\Api\V1\AnalyticsController y docs/analytics.md. */
class PageView extends Model
{
    protected $fillable = ['section', 'visitor_hash', 'viewed_on', 'views'];

    protected $casts = ['viewed_on' => 'date'];
}
