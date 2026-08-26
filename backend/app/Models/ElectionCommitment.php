<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ElectionCommitment extends Model
{
    protected $table = 'election_commitments';

    protected $fillable = [
        'election_proposal_id',
        'description',
        'order',
    ];

    public function proposal()
    {
        return $this->belongsTo(ElectionProposal::class, 'election_proposal_id');
    }
}
