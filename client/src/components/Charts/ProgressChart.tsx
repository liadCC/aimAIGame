import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSessionStore } from '../../store/sessionStore';

export const ProgressChart: React.FC = () => {
  const { sessions } = useSessionStore();

  const data = sessions
    .slice(0, 15)
    .reverse()
    .map((s, i) => ({
      session: `S${i + 1}`,
      score: s.score,
      accuracy: Math.round(s.metrics.accuracy * 100),
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Complete sessions to see your progress
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6C63FF" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="session" stroke="#6B6B8A" tick={{ fontSize: 11 }} />
        <YAxis stroke="#6B6B8A" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '8px' }}
          labelStyle={{ color: '#E0E0FF' }}
          itemStyle={{ color: '#E0E0FF' }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#6C63FF"
          strokeWidth={2}
          fill="url(#scoreGradient)"
          dot={{ fill: '#6C63FF', strokeWidth: 0, r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
