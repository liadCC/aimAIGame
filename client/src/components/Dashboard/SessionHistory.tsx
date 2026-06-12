import React from 'react';
import { Clock, Target } from 'lucide-react';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { useSessionStore } from '../../store/sessionStore';
import { MODE_COLORS } from '../../analytics/patterns';
import { GameMode } from '../../types/game.types';

export const SessionHistory: React.FC = () => {
  const { sessions } = useSessionStore();
  const recent = sessions.slice(0, 8);

  if (recent.length === 0) {
    return (
      <Card>
        <div className="text-sm font-semibold text-text-primary mb-3">Recent Sessions</div>
        <div className="text-sm text-text-muted text-center py-6">
          No sessions yet. Start training to see your history!
        </div>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <div className="text-sm font-semibold text-text-primary mb-3 px-2 pt-1">Recent Sessions</div>
      <div className="space-y-1">
        {recent.map(session => {
          const color = MODE_COLORS[session.mode as GameMode] ?? '#6C63FF';
          const accuracy = Math.round(session.metrics.accuracy * 100);
          const date = new Date(session.timestamp);
          const timeAgo = formatTimeAgo(date);

          return (
            <div
              key={session.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-surface transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary capitalize">{session.mode}</span>
                  <Badge variant="muted" size="sm">{session.difficulty}</Badge>
                </div>
                <div className="text-xs text-text-muted">{timeAgo}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold" style={{ color }}>{session.score.toLocaleString()}</div>
                <div className={`text-xs ${accuracy >= 80 ? 'text-success' : accuracy >= 60 ? 'text-warning' : 'text-danger'}`}>
                  {accuracy}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
