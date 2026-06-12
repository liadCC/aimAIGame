import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Gamepad2 } from 'lucide-react';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Recommendation } from '../../types/player.types';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const TYPE_COLORS = {
  sensitivity: 'accent' as const,
  training: 'cyan' as const,
  habit: 'warning' as const,
  warmup: 'success' as const,
};

const TYPE_LABELS = {
  sensitivity: 'Sensitivity',
  training: 'Training',
  habit: 'Habit',
  warmup: 'Warm-up',
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation: rec }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-white/5">
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={TYPE_COLORS[rec.type]} size="sm">{TYPE_LABELS[rec.type]}</Badge>
            <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'muted'} size="sm">
              {rec.priority}
            </Badge>
            <span className="text-xs text-text-muted ml-auto">{rec.confidence}% confident</span>
          </div>
          <div className="font-semibold text-text-primary text-sm mb-1">{rec.title}</div>
          <div className="text-xs text-text-muted">{rec.description}</div>
        </div>
        <button className="text-text-muted hover:text-text-primary flex-shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
          <p className="text-xs text-text-muted leading-relaxed">{rec.detail}</p>

          {rec.gameSpecific && rec.gameSpecific.length > 0 && (
            <div className="bg-bg-surface rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted mb-2">
                <Gamepad2 className="w-3.5 h-3.5" />
                Game-Specific Settings
              </div>
              <div className="space-y-1.5">
                {rec.gameSpecific.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{g.game}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-danger line-through">{g.from}</span>
                      <span className="text-text-muted">→</span>
                      <span className="text-success font-semibold">{g.to}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
