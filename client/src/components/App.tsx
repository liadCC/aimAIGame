import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './App/Layout';
import { Dashboard } from './Dashboard/Dashboard';
import { GameView } from './Game/GameView';
import { AccuracyChart } from './Charts/AccuracyChart';
import { ReactionTimeChart } from './Charts/ReactionTimeChart';
import { usePlayerStore } from '../store/playerStore';
import { useSessionStore } from '../store/sessionStore';

const ProfilePage: React.FC = () => {
  const { profile, resetProfile } = usePlayerStore();
  const { clearSessions } = useSessionStore();

  const RANK_COLORS: Record<string, string> = {
    Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#00D4FF',
    Diamond: '#B9F2FF', Master: '#6C63FF', Grandmaster: '#FF6B9D',
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-text-primary">Profile</h1>

        <div className="bg-bg-card border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-text-primary">{profile.name}</div>
              <div className="font-semibold" style={{ color: RANK_COLORS[profile.rank] }}>{profile.rank}</div>
              <div className="text-sm text-text-muted">Level {profile.level} · {profile.xp.toLocaleString()} XP</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center border-t border-white/5 pt-4">
            <div>
              <div className="text-xl font-bold text-accent">{profile.totalSessions}</div>
              <div className="text-xs text-text-muted">Sessions</div>
            </div>
            <div>
              <div className="text-xl font-bold text-accent2">{profile.streak}</div>
              <div className="text-xs text-text-muted">Day Streak</div>
            </div>
            <div>
              <div className="text-xl font-bold text-warning">{Math.round(profile.totalTimePlayed / 60)}m</div>
              <div className="text-xs text-text-muted">Trained</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Achievements</h2>
          <div className="grid grid-cols-2 gap-3">
            {profile.achievements.map(a => (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  a.unlockedAt ? 'border-accent/30 bg-accent/5' : 'border-white/5 opacity-50'
                }`}
              >
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{a.name}</div>
                  <div className="text-xs text-text-muted">{a.description}</div>
                  {a.unlockedAt && (
                    <div className="text-xs text-accent mt-0.5">
                      Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-danger/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-danger mb-3">Danger Zone</h2>
          <div className="flex gap-3">
            <button
              onClick={clearSessions}
              className="px-4 py-2 text-sm border border-warning/40 text-warning rounded-lg hover:bg-warning/10 transition-colors"
            >
              Clear Session History
            </button>
            <button
              onClick={resetProfile}
              className="px-4 py-2 text-sm border border-danger/40 text-danger rounded-lg hover:bg-danger/10 transition-colors"
            >
              Reset Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryPage: React.FC = () => {
  const { sessions } = useSessionStore();

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-4xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-text-primary">Session History</h1>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-card border border-white/5 rounded-xl p-4">
            <div className="text-sm font-semibold text-text-primary mb-3">Accuracy by Mode</div>
            <AccuracyChart />
          </div>
          <div className="bg-bg-card border border-white/5 rounded-xl p-4">
            <div className="text-sm font-semibold text-text-primary mb-3">Reaction Time Distribution</div>
            <ReactionTimeChart />
          </div>
        </div>

        <div className="bg-bg-card border border-white/5 rounded-xl">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="text-sm font-semibold text-text-primary">All Sessions ({sessions.length})</div>
          </div>
          <div className="divide-y divide-white/5">
            {sessions.length === 0 ? (
              <div className="px-5 py-8 text-center text-text-muted text-sm">No sessions yet</div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-bg-surface/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary capitalize">{session.mode}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-white/5 rounded text-text-muted">
                        {session.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(session.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-accent">{session.score.toLocaleString()}</div>
                  <div
                    className={`text-sm font-semibold ${
                      session.metrics.accuracy >= 0.8
                        ? 'text-success'
                        : session.metrics.accuracy >= 0.6
                        ? 'text-warning'
                        : 'text-danger'
                    }`}
                  >
                    {Math.round(session.metrics.accuracy * 100)}%
                  </div>
                  <div className="text-xs text-text-muted">{session.duration}s</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { loadFromLocalStorage } = usePlayerStore();
  const { loadSessions } = useSessionStore();

  useEffect(() => {
    loadFromLocalStorage();
    loadSessions();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="game" element={<GameView />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
