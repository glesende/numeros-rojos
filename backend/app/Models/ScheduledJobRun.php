<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Latido de los procesos automatizados: una fila por ejecución de un comando de sincronización
 * (programada o manual). Ver App\Support\RecordScheduledJobRun.
 */
class ScheduledJobRun extends Model
{
    protected $fillable = ['command', 'status', 'started_at', 'finished_at', 'exit_code'];

    protected $casts = [
        'started_at'  => 'datetime',
        'finished_at' => 'datetime',
    ];
}
