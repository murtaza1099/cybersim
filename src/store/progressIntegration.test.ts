import { describe, expect, it, beforeEach } from 'vitest';
import { BADGES } from '@/data/mockData';
import { useDataStore } from './dataStore';
import { useSimulationStore } from './simulationStore';

describe('Level 1 progress integration', () => {
  beforeEach(() => {
    useDataStore.setState({
      organizations: [],
      employees: [],
    });
    useSimulationStore.setState({
      currentLevel: 1,
      modulesCleared: [],
      xp: 0,
    });
  });

  it('stores completed Level 1 results on the employee record', () => {
    const orgKey = useDataStore.getState().addOrganization('Acme');
    const org = useDataStore.getState().getOrgByKey(orgKey);
    const empKey = useDataStore.getState().addEmployee('Dana', 'dana@example.com', org!.id);
    const emp = useDataStore.getState().getEmployeeByKey(empKey)!;

    useDataStore.getState().completeLevel1(emp.id, {
      score: 760,
      status: 'completed',
      completedAttacks: 6,
      failedAttacks: 2,
    });

    const updated = useDataStore.getState().getEmployee(emp.id)!;
    expect(updated.level1Result).toMatchObject({
      score: 760,
      status: 'completed',
      completedAttacks: 6,
      failedAttacks: 2,
    });
    expect(updated.level1Result?.completedAt).toEqual(expect.any(String));
    expect(updated.xp).toBe(760);
    expect(updated.moduleProgress.phishing).toBeGreaterThan(0);
    expect(updated.badges).toHaveLength(6);
    expect(updated.badges.every((badge) => BADGES.some((b) => b.id === badge))).toBe(true);
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
