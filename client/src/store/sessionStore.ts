import { create } from 'zustand';
import { GameMode, Difficulty } from '../types/game.types';
import { SessionMetrics } from '../types/metrics.types';
import { Recommendation } from '../types/player.types';

export interface StoredSession {
  id: string;
  mode: GameMode;
  difficulty: Difficulty;
  timestamp: string;
  duration: number;
  score: number;
  metrics: SessionMetrics;
  recommendations: Recommendation[];
}

interface SessionStore {
  sessions: StoredSession[];
  currentSession: StoredSession | null;

  addSession: (s: StoredSession) => void;
  setCurrentSession: (s: StoredSession | null) => void;
  loadSessions: () => void;
  saveSessions: () => void;
  getLastN: (n: number) => StoredSession[];
  getBestForMode: (mode: GameMode) => StoredSession | null;
  clearSessions: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSession: null,

  addSession: (s) => {
    set((prev) => {
      const updated = [s, ...prev.sessions].slice(0, 50);
      return { sessions: updated };
    });
    get().saveSessions();
  },

  setCurrentSession: (s) => set({ currentSession: s }),

  loadSessions: () => {
    try {
      const data = localStorage.getItem('aimcoach_sessions');
      if (data) {
        set({ sessions: JSON.parse(data) });
      }
    } catch {
      // ignore
    }
  },

  saveSessions: () => {
    const { sessions } = get();
    localStorage.setItem('aimcoach_sessions', JSON.stringify(sessions));
  },

  getLastN: (n) => {
    return get().sessions.slice(0, n);
  },

  getBestForMode: (mode) => {
    const modeSessions = get().sessions.filter(s => s.mode === mode);
    if (modeSessions.length === 0) return null;
    return modeSessions.reduce((best, s) => s.score > best.score ? s : best);
  },

  clearSessions: () => {
    set({ sessions: [], currentSession: null });
    localStorage.removeItem('aimcoach_sessions');
  },
}));
