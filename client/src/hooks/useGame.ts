import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { useSessionStore } from '../store/sessionStore';
import { SessionMetrics } from '../types/metrics.types';
import { aimAnalyzer } from '../analytics/AimAnalyzer';
import { generateRecommendations } from '../analytics/RecommendationEngine';
import { StoredSession } from '../store/sessionStore';

export function useGame() {
  const gameStore = useGameStore();
  const playerStore = usePlayerStore();
  const sessionStore = useSessionStore();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initGame = useCallback((canvas: HTMLCanvasElement) => {
    const engine = gameStore.initEngine(canvas);
    const weaknesses = playerStore.weaknesses;
    engine.setWeaknesses(weaknesses);

    engine.on('stateChange', (state: unknown) => {
      gameStore.setState(state as never);
    });

    engine.on('liveMetrics', (metrics: unknown) => {
      gameStore.updateLiveMetrics(metrics as never);
    });

    engine.on('score', (score: unknown) => {
      gameStore.updateScore(score as number);
    });

    engine.on('sessionEnd', (metrics: unknown, score: unknown) => {
      handleSessionEnd(metrics as SessionMetrics, score as number);
    });

    engine.on('countdown', () => {});
  }, []);

  const handleSessionEnd = useCallback((metrics: SessionMetrics, score: number) => {
    const profile = playerStore.profile;
    const weaknesses = aimAnalyzer.analyzeSession(metrics);
    const recommendations = generateRecommendations(weaknesses, metrics, profile);

    // Compute XP
    const xpGained = Math.round(score / 10 + metrics.accuracy * 50);

    // Build session record
    const session: StoredSession = {
      id: uuidv4(),
      mode: gameStore.mode,
      difficulty: gameStore.difficulty,
      timestamp: new Date().toISOString(),
      duration: gameStore.config.duration,
      score,
      metrics,
      recommendations,
    };

    // Update stores
    sessionStore.addSession(session);
    sessionStore.setCurrentSession(session);

    // Update all historical sessions for combined weakness profile
    const allMetrics = sessionStore.getLastN(10).map(s => s.metrics);
    allMetrics.unshift(metrics);
    const combinedWeaknesses = aimAnalyzer.combineProfiles(allMetrics);

    playerStore.updateWeaknesses(combinedWeaknesses);
    playerStore.setRecommendations(recommendations);
    playerStore.addXP(xpGained);

    // Update player profile
    const now = new Date().toISOString();
    const newStreakCount = profile.lastPlayedAt
      ? isYesterday(profile.lastPlayedAt) ? profile.streak + 1 : 1
      : 1;

    playerStore.updateProfile({
      totalSessions: profile.totalSessions + 1,
      totalTimePlayed: profile.totalTimePlayed + gameStore.config.duration,
      lastPlayedAt: now,
      streak: newStreakCount,
    });

    // Check achievements
    playerStore.checkAchievements(
      metrics.accuracy,
      metrics.avgReactionTime,
      gameStore.mode,
      gameStore.difficulty,
      metrics.jitterScore
    );
  }, [gameStore, playerStore, sessionStore]);

  const startGame = useCallback(() => {
    gameStore.startCountdown();
  }, [gameStore]);

  const stopGame = useCallback(() => {
    gameStore.stopGame();
  }, [gameStore]);

  return {
    canvasRef,
    initGame,
    startGame,
    stopGame,
    state: gameStore.state,
    mode: gameStore.mode,
    difficulty: gameStore.difficulty,
    score: gameStore.score,
    timeRemaining: gameStore.timeRemaining,
    currentMetrics: gameStore.currentMetrics,
  };
}

function isYesterday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}
