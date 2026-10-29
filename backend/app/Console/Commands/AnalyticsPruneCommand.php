<?php

namespace App\Console\Commands;

use App\Models\PageView;
use App\Models\VisitOrigin;
use Illuminate\Console\Command;

class AnalyticsPruneCommand extends Command
{
    protected $signature   = 'analytics:prune {--days=90 : Conservar solo los últimos N días}';
    protected $description = 'Borra visitas anónimas (page_views, visit_origins) más viejas que la retención';

    public function handle(): int
    {
        $days    = max(30, (int) $this->option('days'));
        $deleted = PageView::where('viewed_on', '<', now()->subDays($days)->toDateString())->delete();
        $origins = VisitOrigin::where('visited_on', '<', now()->subDays($days)->toDateString())->delete();
        $this->info("page_views borradas: {$deleted}; visit_origins borradas: {$origins}");

        return self::SUCCESS;
    }
}
