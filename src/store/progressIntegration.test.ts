import { describe, expect, it, beforeEach } from 'vitest';
import { BADGES } from '@/data/mockData';
import { deriveLevel1Progress } from './dataStore';
import { useSimulationStore } from './simulationStore';

describe('deriveLevel1Progress (pure)', () => {
  it('normalises the score, clamps counts, and derives badges', () => {
    const d = deriveLevel1Progress({ score: 760, completedAttacks: 6, failedAttacks: 2 });
    expect(d.completedCount).toBe(6);
    expect(d.failedCount).toBe(2);
    // 760 / 940 ≈ 81%
    expect(d.normalizedScore).toBe(81);
    expect(d.earnedBadgeIds).toHaveLength(6);
    expect(d.earnedBadgeIds.every((id) => BADGES.some((b) => b.id === id))).toBe(true);
  });

  it('clamps completed attacks to the number of modules and floors negatives', () => {
    const d = deriveLevel1Progress({ score: -50, completedAttacks: 99, failedAttacks: -3 });
    expect(d.completedCount).toBe(7);
    expect(d.failedCount).toBe(0);
    expect(d.normalizedScore).toBe(0);
    expect(d.earnedBadgeIds).toHaveLength(7);
  });
});

describe('Level 1 session summary', () => {
  beforeEach(() => {
    useSimulationStore.setState({
      currentLevel: 1,
      modulesCleared: [],
      xp: 0,
    });
  });

  it('updates the session-level simulation summary without duplicating modules', () => {
    useSimulationStore.getState().completeLevel1({
      score: 500,
      status: 'completed',
      completedAttacks: 3,
      failedAttacks: 5,
    });
    useSimulationStore.getState().completeLevel1({
      score: 500,
      status: 'completed',
      completedAttacks: 3,
      failedAttacks: 5,
    });

    expect(useSimulationStore.getState().modulesCleared).toHaveLength(3);
    expect(useSimulationStore.getState().xp).toBe(500);
  });
});
