import { useMemo } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSessionStore } from '../store/sessionStore';
import { RANK_XP_THRESHOLDS } from '../analytics/patterns';
import { Rank } from '../types/player.types';

const RANKS: Rank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'];

export function usePlayerStats() {
  const { profile, weaknesses, recommendations } = usePlayerStore();
  const { sessions } = useSessionStore();

  const stats = useMemo(() => {
    const recentSessions = sessions.slice(0, 10);
    const avgAccuracy = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.metrics.accuracy, 0) / recentSessions.length
      : 0;
    const avgReactionTime = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.metrics.avgReactionTime, 0) / recentSessions.length
      : 0;

    return {
      avgAccuracy,
      avgReactionTime,
      totalSessions: profile.totalSessions,
      totalTimePlayed: profile.totalTimePlayed,
      streak: profile.streak,
    };
  }, [sessions, profile]);

  const rankProgress = useMemo(() => {
    const currentRankIdx = RANKS.indexOf(profile.rank);
    const currentRankXP = RANK_XP_THRESHOLDS[profile.rank] ?? 0;
    const nextRank = RANKS[currentRankIdx + 1] as Rank | undefined;
    const nextRankXP = nextRank ? RANK_XP_THRESHOLDS[nextRank] : null;

    const progress = nextRankXP
      ? Math.min(1, (profile.xp - currentRankXP) / (nextRankXP - currentRankXP))
      : 1;

    return {
      currentRank: profile.rank,
      nextRank: nextRank ?? null,
      progress,
      xpForNext: nextRankXP ? nextRankXP - profile.xp : 0,
      currentXP: profile.xp,
    };
  }, [profile]);

  const modeStats = useMemo(() => {
    const modes = ['flick', 'tracking', 'precision', 'reaction', 'stress', 'personalized'] as const;
    return modes.map(mode => {
      const modeSessions = sessions.filter(s => s.mode === mode);
      const best = modeSessions.reduce((b, s) => s.score > (b?.score ?? 0) ? s : b, null as typeof sessions[0] | null);
      const avgAcc = modeSessions.length > 0
        ? modeSessions.reduce((sum, s) => sum + s.metrics.accuracy, 0) / modeSessions.length
        : 0;
      return {
        mode,
        sessions: modeSessions.length,
        bestScore: best?.score ?? 0,
        avgAccuracy: avgAcc,
      };
    });
  }, [sessions]);

  return {
    profile,
    weaknesses,
    recommendations,
    stats,
    rankProgress,
    modeStats,
    recentSessions: sessions.slice(0, 5),
  };
}
