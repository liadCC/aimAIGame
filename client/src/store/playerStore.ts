import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { PlayerProfile, Recommendation, WeaknessProfile, Rank } from '../types/player.types';
import { RANK_XP_THRESHOLDS } from '../analytics/patterns';

const RANKS: Rank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'];

function computeRank(xp: number): Rank {
  let rank: Rank = 'Bronze';
  for (const r of RANKS) {
    if (xp >= RANK_XP_THRESHOLDS[r]) rank = r;
  }
  return rank;
}

function computeLevel(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

const DEFAULT_WEAKNESSES: WeaknessProfile = {
  overflicking: 0,
  underflicking: 0,
  trackingDeviation: 0,
  jitter: 0,
  reactionSlowness: 0,
  precisionIssues: 0,
  speedSacrifice: 0,
};

const DEFAULT_PROFILE: PlayerProfile = {
  id: uuidv4(),
  name: 'Player',
  rank: 'Bronze',
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayedAt: null,
  totalSessions: 0,
  totalTimePlayed: 0,
  achievements: [
    { id: 'first_blood', name: 'First Blood', description: 'Complete your first session', icon: '🩸', unlockedAt: null },
    { id: 'sharp_shooter', name: 'Sharp Shooter', description: '90%+ accuracy in any session', icon: '🎯', unlockedAt: null },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Average reaction time under 250ms', icon: '⚡', unlockedAt: null },
    { id: 'consistent', name: 'Consistent', description: 'Complete a 7-day streak', icon: '🔥', unlockedAt: null },
    { id: 'flick_master', name: 'Flick Master', description: '95%+ accuracy in Flick mode (hard+)', icon: '🌟', unlockedAt: null },
    { id: 'ghost_aim', name: 'Ghost Aim', description: 'Jitter score below 0.5', icon: '👻', unlockedAt: null },
  ],
};

interface PlayerStore {
  profile: PlayerProfile;
  weaknesses: WeaknessProfile;
  recommendations: Recommendation[];

  updateProfile: (updates: Partial<PlayerProfile>) => void;
  addXP: (amount: number) => void;
  updateWeaknesses: (w: WeaknessProfile) => void;
  setRecommendations: (r: Recommendation[]) => void;
  checkAchievements: (sessionAccuracy: number, sessionAvgRT: number, sessionMode: string, sessionDifficulty: string, jitterScore: number) => string[];
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  resetProfile: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  weaknesses: DEFAULT_WEAKNESSES,
  recommendations: [],

  updateProfile: (updates) => {
    set((prev) => {
      const updated = { ...prev.profile, ...updates };
      return { profile: updated };
    });
    get().saveToLocalStorage();
  },

  addXP: (amount) => {
    set((prev) => {
      const newXP = prev.profile.xp + amount;
      const newRank = computeRank(newXP);
      const newLevel = computeLevel(newXP);
      return {
        profile: {
          ...prev.profile,
          xp: newXP,
          rank: newRank,
          level: newLevel,
        }
      };
    });
    get().saveToLocalStorage();
  },

  updateWeaknesses: (w) => {
    set({ weaknesses: w });
    localStorage.setItem('aimcoach_weaknesses', JSON.stringify(w));
  },

  setRecommendations: (r) => {
    set({ recommendations: r });
  },

  checkAchievements: (sessionAccuracy, sessionAvgRT, sessionMode, sessionDifficulty, jitterScore) => {
    const profile = get().profile;
    const newlyUnlocked: string[] = [];
    const now = new Date().toISOString();

    const updatedAchievements = profile.achievements.map(a => {
      if (a.unlockedAt) return a;

      let unlock = false;
      switch (a.id) {
        case 'first_blood':
          unlock = profile.totalSessions >= 1;
          break;
        case 'sharp_shooter':
          unlock = sessionAccuracy >= 0.9;
          break;
        case 'speed_demon':
          unlock = sessionAvgRT > 0 && sessionAvgRT < 250;
          break;
        case 'consistent':
          unlock = profile.streak >= 7;
          break;
        case 'flick_master':
          unlock = sessionMode === 'flick' &&
            (sessionDifficulty === 'hard' || sessionDifficulty === 'elite') &&
            sessionAccuracy >= 0.95;
          break;
        case 'ghost_aim':
          unlock = jitterScore > 0 && jitterScore < 0.5;
          break;
      }

      if (unlock) {
        newlyUnlocked.push(a.id);
        return { ...a, unlockedAt: now };
      }
      return a;
    });

    if (newlyUnlocked.length > 0) {
      set((prev) => ({
        profile: { ...prev.profile, achievements: updatedAchievements }
      }));
      get().saveToLocalStorage();
    }

    return newlyUnlocked;
  },

  loadFromLocalStorage: () => {
    try {
      const profileData = localStorage.getItem('aimcoach_player');
      const weaknessData = localStorage.getItem('aimcoach_weaknesses');

      if (profileData) {
        set({ profile: JSON.parse(profileData) });
      }
      if (weaknessData) {
        set({ weaknesses: JSON.parse(weaknessData) });
      }
    } catch {
      // ignore parse errors
    }
  },

  saveToLocalStorage: () => {
    const { profile } = get();
    localStorage.setItem('aimcoach_player', JSON.stringify(profile));
  },

  resetProfile: () => {
    const freshProfile = { ...DEFAULT_PROFILE, id: uuidv4() };
    set({ profile: freshProfile, weaknesses: DEFAULT_WEAKNESSES, recommendations: [] });
    localStorage.setItem('aimcoach_player', JSON.stringify(freshProfile));
    localStorage.removeItem('aimcoach_weaknesses');
  },
}));
