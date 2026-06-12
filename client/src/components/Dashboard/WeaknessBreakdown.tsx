import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { Card } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { WeaknessProfile } from '../../types/player.types';

const WEAKNESS_LABELS: Record<keyof WeaknessProfile, string> = {
  overflicking: 'Overflick',
  underflicking: 'Underflick',
  trackingDeviation: 'Tracking',
  jitter: 'Jitter',
  reactionSlowness: 'Reaction',
  precisionIssues: 'Precision',
  speedSacrifice: 'Speed',
};

export const WeaknessBreakdown: React.FC = () => {
  const { weaknesses } = usePlayerStats();

  const radarData = (Object.keys(weaknesses) as Array<keyof WeaknessProfile>).map(key => ({
    subject: WEAKNESS_LABELS[key],
    value: weaknesses[key],
    fullMark: 100,
  }));

  const sortedWeaknesses = (Object.entries(weaknesses) as Array<[keyof WeaknessProfile, number]>)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <div className="text-sm font-semibold text-text-primary mb-4">Weakness Profile</div>
      <div className="flex gap-6">
        {/* Radar */}
        <div className="flex-shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: '#6B6B8A' }}
              />
              <Radar
                name="Weakness"
                dataKey="value"
                stroke="#6C63FF"
                fill="#6C63FF"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar breakdown */}
        <div className="flex-1 space-y-2.5">
          {sortedWeaknesses.map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted">{WEAKNESS_LABELS[key]}</span>
                <span className={`font-semibold ${
                  value > 60 ? 'text-danger' : value > 35 ? 'text-warning' : 'text-success'
                }`}>
                  {Math.round(value)}
                </span>
              </div>
              <ProgressBar
                value={value}
                color={value > 60 ? 'danger' : value > 35 ? 'warning' : 'success'}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
