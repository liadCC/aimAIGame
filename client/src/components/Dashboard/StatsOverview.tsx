import React from 'react';
import { Target, Zap, Calendar, Flame } from 'lucide-react';
import { Card } from '../UI/Card';
import { usePlayerStats } from '../../hooks/usePlayerStats';

export const StatsOverview: React.FC = () => {
  const { stats } = usePlayerStats();
  const avgAccPct = Math.round(stats.avgAccuracy * 100);

  const statCards = [
    {
      label: 'Avg Accuracy',
      value: stats.totalSessions > 0 ? `${avgAccPct}%` : '—',
      icon: <Target className="w-5 h-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
      desc: stats.totalSessions > 0
        ? avgAccPct >= 80 ? 'Excellent' : avgAccPct >= 65 ? 'Good' : 'Needs work'
        : 'No data yet',
    },
    {
      label: 'Avg Reaction',
      value: stats.avgReactionTime > 0 ? `${Math.round(stats.avgReactionTime)}ms` : '—',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-accent2',
      bgColor: 'bg-accent2/10',
      desc: stats.avgReactionTime > 0
        ? stats.avgReactionTime < 250 ? 'Elite speed' : stats.avgReactionTime < 400 ? 'Good' : 'Room to improve'
        : 'No data yet',
    },
    {
      label: 'Sessions',
      value: stats.totalSessions.toString(),
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      desc: `${Math.round(stats.totalTimePlayed / 60)}min total`,
    },
    {
      label: 'Win Streak',
      value: stats.streak > 0 ? `${stats.streak} days` : '0',
      icon: <Flame className="w-5 h-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      desc: stats.streak >= 7 ? 'On fire!' : stats.streak >= 3 ? 'Keep it up' : 'Build your streak',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map(stat => (
        <Card key={stat.label} className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${stat.bgColor} ${stat.color} flex-shrink-0`}>
            {stat.icon}
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{stat.desc}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};
