import { create } from 'zustand';
import { GameState, GameMode, GameConfig, Difficulty } from '../types/game.types';
import { SessionMetrics } from '../types/metrics.types';
import { GameEngine } from '../game/GameEngine';

interface GameStore {
  state: GameState;
  mode: GameMode;
  difficulty: Difficulty;
  config: GameConfig;
  currentMetrics: Partial<SessionMetrics & { timeRemaining: number; currentStreak: number }>;
  engine: GameEngine | null;
  score: number;
  timeRemaining: number;

  setState: (s: GameState) => void;
  setMode: (m: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setConfig: (c: Partial<GameConfig>) => void;
  initEngine: (canvas: HTMLCanvasElement) => GameEngine;
  destroyEngine: () => void;
  startCountdown: () => void;
  stopGame: () => void;
  updateLiveMetrics: (m: Partial<SessionMetrics> & { timeRemaining?: number; currentStreak?: number }) => void;
  updateScore: (score: number) => void;
}

const DEFAULT_CONFIG: GameConfig = {
  mode: 'flick',
  difficulty: 'medium',
  duration: 60,
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: 'idle',
  mode: 'flick',
  difficulty: 'medium',
  config: DEFAULT_CONFIG,
  currentMetrics: {},
  engine: null,
  score: 0,
  timeRemaining: 60,

  setState: (s) => set({ state: s }),
  setMode: (m) => set((prev) => ({ mode: m, config: { ...prev.config, mode: m } })),
  setDifficulty: (d) => set((prev) => ({ difficulty: d, config: { ...prev.config, difficulty: d } })),
  setConfig: (c) => set((prev) => ({ config: { ...prev.config, ...c } })),

  initEngine: (canvas) => {
    const existing = get().engine;
    if (existing) existing.destroy();
    const engine = new GameEngine(canvas);
    set({ engine });
    return engine;
  },

  destroyEngine: () => {
    const engine = get().engine;
    if (engine) engine.destroy();
    set({ engine: null });
  },

  startCountdown: () => {
    const { engine, config } = get();
    if (!engine) return;
    engine.setConfig(config);
    set({ state: 'countdown', score: 0, currentMetrics: {}, timeRemaining: config.duration });
    engine.startCountdown();
  },

  stopGame: () => {
    const { engine } = get();
    if (engine) engine.stopGame();
  },

  updateLiveMetrics: (m) => set((prev) => ({
    currentMetrics: { ...prev.currentMetrics, ...m },
    timeRemaining: m.timeRemaining ?? prev.timeRemaining,
  })),

  updateScore: (score) => set({ score }),
}));
