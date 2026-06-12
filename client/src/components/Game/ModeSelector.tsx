import React from 'react';
import { Crosshair, Activity, Circle, Zap, Flame, Brain } from 'lucide-react';
import clsx from 'clsx';
import { GameMode, Difficulty } from '../../types/game.types';
import { useGameStore } from '../../store/gameStore';
import { useSessionStore } from '../../store/sessionStore';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { MODE_COLORS, MODE_DESCRIPTIONS } from '../../analytics/patterns';

interface ModeCardProps {
  mode: GameMode;
  isSelected: boolean;
  onSelect: () => void;
  bestScore: number;
}

const MODE_ICONS: Record<GameMode, React.ReactNode> = {
  flick: <Crosshair className="w-6 h-6" />,
  tracking: <Activity className="w-6 h-6" />,
  precision: <Circle className="w-6 h-6" />,
  reaction: <Zap className="w-6 h-6" />,
  stress: <Flame className="w-6 h-6" />,
  personalized: <Brain className="w-6 h-6" />,
};

const MODE_NAMES: Record<GameMode, string> = {
  flick: 'Flick',
  tracking: 'Tracking',
  precision: 'Precision',
  reaction: 'Reaction',
  stress: 'Stress Test',
  personalized: 'Personalized',
};

const ModeCard: React.FC<ModeCardProps> = ({ mode, isSelected, onSelect, bestScore }) => {
  const color = MODE_COLORS[mode];

  return (
    <div
      className={clsx(
        'bg-bg-card border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02]',
        isSelected
          ? 'border-[var(--selected-color)] shadow-[0_0_20px_var(--selected-glow)]'
          : 'border-white/5 hover:border-white/15'
      )}
      style={{
        '--selected-color': color,
        '--selected-glow': `${color}40`,
      } as React.CSSProperties}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {MODE_ICONS[mode]}
        </div>
        {isSelected && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold border"
            style={{ color, borderColor: `${color}60`, backgroundColor: `${color}15` }}
          >
            Selected
          </span>
        )}
      </div>

      <div className="font-bold text-text-primary mb-1">{MODE_NAMES[mode]}</div>
      <div className="text-xs text-text-muted mb-3 leading-relaxed">{MODE_DESCRIPTIONS[mode]}</div>

      {bestScore > 0 && (
        <div className="text-xs text-text-muted">
          Best: <span className="font-semibold" style={{ color }}>{bestScore.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

interface ModeSelectorProps {
  onStartGame: () => void;
}

const DURATIONS = [30, 60, 90, 120];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onStartGame }) => {
  const { mode, difficulty, config, setMode, setDifficulty, setConfig } = useGameStore();
  const { getBestForMode } = useSessionStore();

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'elite'];
  const difficultyColors: Record<Difficulty, string> = {
    easy: 'success',
    medium: 'accent',
    hard: 'warning',
    elite: 'danger',
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-1">Select Game Mode</h2>
        <p className="text-text-muted mb-6">Choose your training focus and customize difficulty</p>

        {/* Mode Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {(['flick', 'tracking', 'precision', 'reaction', 'stress', 'personalized'] as GameMode[]).map(m => (
            <ModeCard
              key={m}
              mode={m}
              isSelected={mode === m}
              onSelect={() => setMode(m)}
              bestScore={getBestForMode(m)?.score ?? 0}
            />
          ))}
        </div>

        {/* Difficulty */}
        <div className="bg-bg-surface border border-white/5 rounded-xl p-4 mb-4">
          <div className="text-sm font-semibold text-text-primary mb-3">Difficulty</div>
          <div className="flex gap-2">
            {difficulties.map(d => (
              <button
                key={d}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-semibold capitalize border transition-all duration-150',
                  difficulty === d
                    ? `border-current text-${difficultyColors[d]} bg-${difficultyColors[d]}/15`
                    : 'border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'
                )}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-bg-surface border border-white/5 rounded-xl p-4 mb-6">
          <div className="text-sm font-semibold text-text-primary mb-3">Duration</div>
          <div className="flex gap-2">
            {DURATIONS.map(dur => (
              <button
                key={dur}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-150',
                  config.duration === dur
                    ? 'border-accent text-accent bg-accent/15'
                    : 'border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'
                )}
                onClick={() => setConfig({ duration: dur })}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={onStartGame}>
          <Crosshair className="w-5 h-5" />
          Start Training
        </Button>
      </div>
    </div>
  );
};
