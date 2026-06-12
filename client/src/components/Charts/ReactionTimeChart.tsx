import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSessionStore } from '../../store/sessionStore';

const BINS = [
  { label: '<200ms', min: 0, max: 200 },
  { label: '200-400ms', min: 200, max: 400 },
  { label: '400-600ms', min: 400, max: 600 },
  { label: '600-800ms', min: 600, max: 800 },
  { label: '>800ms', min: 800, max: Infinity },
];

const BIN_COLORS = ['#00FF88', '#6C63FF', '#00D4FF', '#FFB800', '#FF4444'];

export const ReactionTimeChart: React.FC = () => {
  const { sessions } = useSessionStore();

  const allReactionTimes = sessions
    .slice(0, 20)
    .flatMap(s => s.metrics.clickEvents.filter(e => e.hit && e.reactionTime > 0).map(e => e.reactionTime));

  const binCounts = BINS.map(bin => ({
    label: bin.label,
    count: allReactionTimes.filter(rt => rt >= bin.min && rt < bin.max).length,
  }));

  if (allReactionTimes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No reaction time data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={binCounts} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" stroke="#6B6B8A" tick={{ fontSize: 10 }} />
        <YAxis stroke="#6B6B8A" tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '8px' }}
          labelStyle={{ color: '#E0E0FF' }}
          itemStyle={{ color: '#E0E0FF' }}
          formatter={(v) => [v, 'Shots']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {binCounts.map((_, index) => (
            <Cell key={index} fill={BIN_COLORS[index]} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
