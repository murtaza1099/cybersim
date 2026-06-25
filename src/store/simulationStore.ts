import { create } from 'zustand';
import { ATTACK_MODULES } from '@/data/mockData';

// Per-PC-sub-attack outcome from the Main Workstation session, so Org Admin
// analytics can show which specific threat an employee failed (e.g. BEC) rather
// than a lumped "PC attacks: 60%".
export interface PcSubAttackResult {
  id: string;
  label: string;
  passed: boolean;
}

export interface Level1Result {
  score: number;
  status: 'completed' | 'failed' | 'in-progress';
  completedAttacks?: number;
  failedAttacks?: number;
  completedAt?: string;
  pcSubAttackResults?: PcSubAttackResult[];
}

interface SimulationState {
  currentLevel: number;
  modulesCleared: string[];
  xp: number;
  level1Result: Level1Result | null;
  setLevel: (level: number) => void;
  clearModule: (moduleId: string) => void;
  addXp: (amount: number) => void;
  completeLevel1: (result: Level1Result) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  currentLevel: 1,
  modulesCleared: ['phishing', 'tailgating'],
  xp: 1250,
  level1Result: null,
  setLevel: (level) => set({ currentLevel: level }),
  clearModule: (moduleId) =>
    set((s) => ({ modulesCleared: Array.from(new Set([...s.modulesCleared, moduleId])) })),
  addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
  completeLevel1: (result) =>
    set((s) => {
      const completedCount = Math.max(0, Math.min(result.completedAttacks ?? 0, ATTACK_MODULES.length));
      const clearedFromLevel = ATTACK_MODULES.slice(0, completedCount).map((module) => module.id);
      const previousScore = s.level1Result?.score ?? 0;

      return {
        currentLevel: result.status === 'completed' ? Math.max(s.currentLevel, 2) : s.currentLevel,
        modulesCleared: Array.from(new Set([...s.modulesCleared, ...clearedFromLevel])),
        xp: Math.max(0, s.xp - previousScore + result.score),
        level1Result: {
          ...result,
          completedAt: result.completedAt ?? new Date().toISOString(),
        },
      };
    }),
}));
