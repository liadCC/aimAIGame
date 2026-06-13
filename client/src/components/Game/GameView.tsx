import React, { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameHUD } from './GameHUD';
import { ModeSelector } from './ModeSelector';
import { SessionResults } from './SessionResults';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import { useSessionStore, StoredSession } from '../../store/sessionStore';
import { SessionMetrics } from '../../types/metrics.types';
import { aimAnalyzer } from '../../analytics/AimAnalyzer';
import { generateRecommendations } from '../../analytics/RecommendationEngine';

export const GameView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineInitialized = useRef(false);

  const { state, mode, difficulty, config, score, timeRemaining, currentMetrics, initEngine, destroyEngine, startCountdown } = useGameStore();
  const { weaknesses, profile, addXP, updateWeaknesses, setRecommendations, updateProfile, checkAchievements } = usePlayerStore();
  const { addSession, setCurrentSession, getLastN } = useSessionStore();

  const handleSessionEnd = useCallback((metrics: SessionMetrics, finalScore: number) => {
    const recs = generateRecommendations(weaknesses, metrics, profile);
    const xpGained = Math.round(finalScore / 10 + metrics.accuracy * 50);

    const session: StoredSession = {
      id: uuidv4(),
      mode,
      difficulty,
      timestamp: new Date().toISOString(),
      duration: config.duration,
      score: finalScore,
      metrics,
      recommendations: recs,
    };

    addSession(session);
    setCurrentSession(session);

    const allMetrics = getLastN(10).map(s => s.metrics);
    allMetrics.unshift(metrics);
    const combined = aimAnalyzer.combineProfiles(allMetrics);
    updateWeaknesses(combined);
    setRecommendations(recs);
    addXP(xpGained);

    const now = new Date().toISOString();
    const lastPlayed = profile.lastPlayedAt;
    const isYesterday = lastPlayed ? (() => {
      const d = new Date(lastPlayed);
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return d.toDateString() === y.toDateString();
    })() : false;
    const newStreak = lastPlayed ? (isYesterday ? profile.streak + 1 : 1) : 1;

    updateProfile({
      totalSessions: profile.totalSessions + 1,
      totalTimePlayed: profile.totalTimePlayed + config.duration,
      lastPlayedAt: now,
      streak: newStreak,
    });

    checkAchievements(metrics.accuracy, metrics.avgReactionTime, mode, difficulty, metrics.jitterScore);
  }, [weaknesses, profile, mode, difficulty, config, addSession, setCurrentSession, getLastN, updateWeaknesses, setRecommendations, addXP, updateProfile, checkAchievements]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || engineInitialized.current) return;
    engineInitialized.current = true;

    const engine = initEngine(canvas);
    engine.setWeaknesses(weaknesses);
    // Dev-only hook for automated/E2E testing; stripped from production builds.
    if (import.meta.env.DEV) {
      (window as unknown as { __aimEngine?: unknown }).__aimEngine = engine;
    }

    engine.on('stateChange', (newState: unknown) => {
      useGameStore.getState().setState(newState as never);
    });

    engine.on('liveMetrics', (metrics: unknown) => {
      useGameStore.getState().updateLiveMetrics(metrics as never);
    });

    engine.on('score', (s: unknown) => {
      useGameStore.getState().updateScore(s as number);
    });

    engine.on('sessionEnd', (metrics: unknown, finalScore: unknown) => {
      handleSessionEnd(metrics as SessionMetrics, finalScore as number);
    });

    return () => {
      engineInitialized.current = false;
      destroyEngine();
    };
  }, []);

  // Update weaknesses in engine when they change
  useEffect(() => {
    const engine = useGameStore.getState().engine;
    if (engine) {
      engine.setWeaknesses(weaknesses);
    }
  }, [weaknesses]);

  const handleStartGame = useCallback(() => {
    const store = useGameStore.getState();
    const engine = store.engine;
    if (!engine) return;
    engine.setConfig(store.config);
    engine.setWeaknesses(weaknesses);
    store.startCountdown();
  }, [weaknesses]);

  const hits = (currentMetrics as Record<string, number>).hits ?? 0;
  const totalShots = (currentMetrics as Record<string, number>).totalShots ?? 0;
  const accuracy = (currentMetrics as Record<string, number>).accuracy ?? 0;
  const currentStreak = (currentMetrics as Record<string, number>).currentStreak ?? 0;

  const isGameActive = state === 'playing' || state === 'countdown';

  return (
    <div className="relative w-full h-full bg-bg-primary overflow-hidden">
      {/* Canvas - always in DOM */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          cursor: 'none',
          display: 'block',
          opacity: state === 'idle' ? 0.3 : 1,
        }}
      />

      {/* HUD overlay during game */}
      {isGameActive && (
        <GameHUD
          score={score}
          hits={hits}
          totalShots={totalShots}
          accuracy={accuracy}
          streak={currentStreak}
          timeRemaining={timeRemaining}
          totalDuration={config.duration}
        />
      )}

      {/* Mode Selector Overlay (idle state) */}
      {state === 'idle' && (
        <div className="absolute inset-0 z-20 overflow-hidden">
          <ModeSelector onStartGame={handleStartGame} />
        </div>
      )}

      {/* Results Overlay */}
      {state === 'results' && (
        <div className="absolute inset-0 z-20 bg-bg-primary overflow-y-auto">
          <SessionResults />
        </div>
      )}
    </div>
  );
};
