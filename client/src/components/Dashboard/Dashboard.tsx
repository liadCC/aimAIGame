import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair, Activity, Circle, Zap, Flame, Brain, ChevronRight } from 'lucide-react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { ProgressBar } from '../UI/ProgressBar';
import { StatsOverview } from './StatsOverview';
import { WeaknessBreakdown } from './WeaknessBreakdown';
import { RecommendationCard } from './RecommendationCard';
import { SessionHistory } from './SessionHistory';
import { ProgressChart } from '../Charts/ProgressChart';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { useGameStore } from '../../store/gameStore';
import { GameMode } from '../../types/game.types';
import { MODE_COLORS, MODE_DESCRIPTIONS } from '../../analytics/patterns';

const MODE_ICONS: Record<GameMode, React.ReactNode> = {
  flick: <Crosshair className="w-5 h-5" />,
  tracking: <Activity className="w-5 h-5" />,
  precision: <Circle className="w-5 h-5" />,
  reaction: <Zap className="w-5 h-5" />,
  stress: <Flame className="w-5 h-5" />,
  personalized: <Brain className="w-5 h-5" />,
};

const MODE_NAMES: Record<GameMode, string> = {
  flick: 'Flick',
  tracking: 'Tracking',
  precision: 'Precision',
  reaction: 'Reaction',
  stress: 'Stress Test',
  personalized: 'Personalized AI',
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, rankProgress, recommendations } = usePlayerStats();
  const { setMode } = useGameStore();

  const handleQuickStart = (mode: GameMode) => {
    setMode(mode);
    navigate('/game');
  };

  const rankColors: Record<string, string> = {
    Bronze: '#CD7F32',
    Silver: '#C0C0C0',
    Gold: '#FFD700',
    Platinum: '#00D4FF',
    Diamond: '#B9F2FF',
    Master: '#6C63FF',
    Grandmaster: '#FF6B9D',
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Welcome + Rank */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome back, <span className="text-accent">{profile.name}</span>
            </h1>
            <p className="text-text-muted text-sm">
              {profile.totalSessions === 0
                ? 'Start your first training session to begin your journey'
                : `${profile.totalSessions} sessions completed · Level ${profile.level}`}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-lg font-bold mb-1"
              style={{ color: rankColors[profile.rank] ?? '#E0E0FF' }}
            >
              {profile.rank}
            </div>
            <div className="text-xs text-text-muted mb-1.5">{profile.xp.toLocaleString()} XP</div>
            <div className="w-32">
              <ProgressBar
                value={rankProgress.progress * 100}
                color="accent"
                size="sm"
              />
            </div>
            {rankProgress.nextRank && (
              <div className="text-xs text-text-muted mt-1">
                {rankProgress.xpForNext.toLocaleString()} XP to {rankProgress.nextRank}
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        <div className="grid grid-cols-12 gap-4">
          {/* Left column */}
          <div className="col-span-8 space-y-4">
            {/* Progress Chart */}
            <Card>
              <div className="text-sm font-semibold text-text-primary mb-4">Score Progress</div>
              <ProgressChart />
            </Card>

            {/* Quick Start */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-text-primary">Quick Start</div>
                <button
                  className="text-xs text-accent hover:text-purple-400 flex items-center gap-1"
                  onClick={() => navigate('/game')}
                >
                  All modes <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['flick', 'tracking', 'precision', 'reaction', 'stress', 'personalized'] as GameMode[]).map(mode => {
                  const color = MODE_COLORS[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => handleQuickStart(mode)}
                      className="flex items-center gap-2.5 p-3 bg-bg-surface rounded-lg border border-white/5 hover:border-white/15 transition-all duration-150 hover:scale-[1.02] text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {MODE_ICONS[mode]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-text-primary">{MODE_NAMES[mode]}</div>
                        <div className="text-xs text-text-muted hidden md:block" style={{ fontSize: '10px' }}>
                          {MODE_DESCRIPTIONS[mode].split(' ').slice(0, 4).join(' ')}...
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="col-span-4 space-y-4">
            {/* Weakness */}
            <WeaknessBreakdown />

            {/* Session History */}
            <SessionHistory />
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-text-primary mb-3">AI Recommendations</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.slice(0, 4).map(rec => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
