import React from 'react';
import { Target, Zap, Clock, TrendingUp } from 'lucide-react';
import { ProgressBar } from '../UI/ProgressBar';

interface GameHUDProps {
  score: number;
  hits: number;
  totalShots: number;
  accuracy: number;
  streak: number;
  timeRemaining: number;
  totalDuration: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  hits,
  totalShots,
  accuracy,
  streak,
  timeRemaining,
  totalDuration,
}) => {
  const timePercent = (timeRemaining / totalDuration) * 100;
  const timeColor = timeRemaining > 20 ? 'accent' : timeRemaining > 10 ? 'warning' : 'danger';
  const accuracyPct = Math.round(accuracy * 100);

  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-b from-black/60 to-transparent">
        {/* Score */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Score</div>
            <div className="text-xl font-bold text-accent tabular-nums">{score.toLocaleString()}</div>
          </div>
        </div>

        {/* Timer (center) */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 ${timeColor === 'accent' ? 'text-accent' : timeColor === 'warning' ? 'text-warning' : 'text-danger'}`} />
            <span className={`text-3xl font-bold tabular-nums ${
              timeColor === 'accent' ? 'text-text-primary' :
              timeColor === 'warning' ? 'text-warning' : 'text-danger'
            }`}>
              {Math.ceil(timeRemaining)}
            </span>
          </div>
          <div className="w-32">
            <ProgressBar value={timePercent} color={timeColor} size="sm" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-success" />
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Accuracy</div>
              <div className={`text-xl font-bold tabular-nums ${
                accuracyPct >= 80 ? 'text-success' : accuracyPct >= 60 ? 'text-warning' : 'text-danger'
              }`}>
                {accuracyPct}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Streak</div>
              <div className="text-xl font-bold text-warning tabular-nums">{streak}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-text-muted uppercase tracking-wider">Hits</div>
            <div className="text-xl font-bold text-text-primary tabular-nums">
              {hits}/{totalShots}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
