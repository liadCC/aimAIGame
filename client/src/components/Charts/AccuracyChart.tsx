import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSessionStore } from '../../store/sessionStore';
import { GameMode } from '../../types/game.types';

const MODE_COLORS: Record<GameMode, string> = {
  flick: '#6C63FF',
  tracking: '#00D4FF',
  precision: '#00FF88',
  reaction: '#FFB800',
  stress: '#FF4444',
  personalized: '#FF6B9D',
};

export const AccuracyChart: React.FC = () => {
  const { sessions } = useSessionStore();

  const data = sessions
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      session: `S${i + 1}`,
      flick: s.mode === 'flick' ? Math.round(s.metrics.accuracy * 100) : undefined,
      tracking: s.mode === 'tracking' ? Math.round(s.metrics.accuracy * 100) : undefined,
      precision: s.mode === 'precision' ? Math.round(s.metrics.accuracy * 100) : undefined,
      reaction: s.mode === 'reaction' ? Math.round(s.metrics.accuracy * 100) : undefined,
      stress: s.mode === 'stress' ? Math.round(s.metrics.accuracy * 100) : undefined,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No session data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="session" stroke="#6B6B8A" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6B6B8A" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '8px' }}
          labelStyle={{ color: '#E0E0FF' }}
          itemStyle={{ color: '#E0E0FF' }}
          formatter={(v) => [`${v}%`]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B8A' }} />
        {(Object.keys(MODE_COLORS) as GameMode[]).map(mode => (
          <Line
            key={mode}
            type="monotone"
            dataKey={mode}
            stroke={MODE_COLORS[mode]}
            strokeWidth={2}
            dot={{ fill: MODE_COLORS[mode], strokeWidth: 0, r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
