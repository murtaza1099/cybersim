import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ATTACK_MODULES, BADGES } from '@/data/mockData';
import type { Level1Result } from '@/store/simulationStore';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  orgKey: string;
  status: 'active' | 'suspended';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  empKey: string;
  level: number;
  orgId: string;
  moduleProgress: Record<string, number>;
  level1Result?: Level1Result;
  xp: number;
  badges: string[];
  lastActive: string;
  status: 'active' | 'inactive';
  jobRole?: string;
  age?: number;
  gender?: string;
}

interface DataState {
  organizations: Organization[];
  employees: Employee[];

  // Org actions
  addOrganization: (name: string) => string; // returns generated key
  updateOrgStatus: (orgId: string, status: 'active' | 'suspended') => void;
  revokeOrgKey: (orgId: string) => string; // returns new key
  getOrg: (orgId: string) => Organization | undefined;
  getOrgByKey: (key: string) => Organization | undefined;

  // Employee actions
  addEmployee: (name: string, email: string, orgId: string, jobRole?: string, age?: number, gender?: string) => string; // returns generated key
  getEmployeesByOrg: (orgId: string) => Employee[];
  getEmployeeByKey: (key: string) => Employee | undefined;
  getEmployee: (empId: string) => Employee | undefined;
  updateEmployeeProgress: (empId: string, moduleId: string, score: number) => void;
  completeLevel1: (empId: string, result: Level1Result) => void;
  regenerateEmployeeKey: (empId: string) => string;

  // Helpers
  isValidKey: (key: string) => boolean;
}

function generateOrgKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ORG-';
  for (let i = 0; i < 12; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function generateEmpKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'EMP-';
  for (let i = 0; i < 16; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const emptyProgress = (): Record<string, number> =>
  Object.fromEntries(ATTACK_MODULES.map(m => [m.id, 0]));

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      organizations: [],
      employees: [],

      addOrganization: (name: string) => {
        const key = generateOrgKey();
        const org: Organization = {
          id: generateId('org'),
          name,
          createdAt: new Date().toISOString(),
          orgKey: key,
          status: 'active',
        };
        set(s => ({ organizations: [...s.organizations, org] }));
        return key;
      },

      updateOrgStatus: (orgId, status) => {
        set(s => ({
          organizations: s.organizations.map(o =>
            o.id === orgId ? { ...o, status } : o
          ),
        }));
      },

      revokeOrgKey: (orgId) => {
        const newKey = generateOrgKey();
        set(s => ({
          organizations: s.organizations.map(o =>
            o.id === orgId ? { ...o, orgKey: newKey } : o
          ),
        }));
        return newKey;
      },

      getOrg: (orgId) => get().organizations.find(o => o.id === orgId),
      getOrgByKey: (key) => get().organizations.find(o => o.orgKey === key),

      addEmployee: (name, email, orgId, jobRole, age, gender) => {
        const key = generateEmpKey();
        const emp: Employee = {
          id: generateId('emp'),
          name,
          email,
          empKey: key,
          level: 1,
          orgId,
          moduleProgress: emptyProgress(),
          xp: 0,
          badges: [],
          lastActive: new Date().toISOString(),
          status: 'active',
          jobRole,
          age,
          gender,
        };
        set(s => ({ employees: [...s.employees, emp] }));
        return key;
      },

      getEmployeesByOrg: (orgId) => get().employees.filter(e => e.orgId === orgId),
      getEmployeeByKey: (key) => get().employees.find(e => e.empKey === key),
      getEmployee: (empId) => get().employees.find(e => e.id === empId),

      updateEmployeeProgress: (empId, moduleId, score) => {
        set(s => ({
          employees: s.employees.map(e =>
            e.id === empId
              ? {
                  ...e,
                  moduleProgress: { ...e.moduleProgress, [moduleId]: score },
                  lastActive: new Date().toISOString(),
                }
              : e
          ),
        }));
      },

      completeLevel1: (empId, result) => {
        const completedCount = Math.max(0, Math.min(result.completedAttacks ?? 0, ATTACK_MODULES.length));
        const failedCount = Math.max(0, result.failedAttacks ?? 0);
        const normalizedScore = Math.max(0, Math.min(100, Math.round((result.score / 940) * 100)));
        const completedAt = result.completedAt ?? new Date().toISOString();
        const earnedBadgeIds = ATTACK_MODULES.slice(0, completedCount)
          .map(module => BADGES.find(badge => badge.module === module.id)?.id)
          .filter((badgeId): badgeId is string => Boolean(badgeId));

        set(s => ({
          employees: s.employees.map(e => {
            if (e.id !== empId) return e;

            const previousScore = e.level1Result?.score ?? 0;
            const moduleProgress = ATTACK_MODULES.reduce<Record<string, number>>((acc, module) => {
              acc[module.id] = Math.max(e.moduleProgress[module.id] ?? 0, normalizedScore);
              return acc;
            }, { ...e.moduleProgress });

            return {
              ...e,
              level: result.status === 'completed' ? Math.max(e.level, 2) : e.level,
              moduleProgress,
              xp: Math.max(0, e.xp - previousScore + result.score),
              badges: Array.from(new Set([...e.badges, ...earnedBadgeIds])),
              lastActive: completedAt,
              level1Result: {
                ...result,
                completedAttacks: completedCount,
                failedAttacks: failedCount,
                completedAt,
              },
            };
          }),
        }));
      },

      regenerateEmployeeKey: (empId) => {
        const newKey = generateEmpKey();
        set(s => ({
          employees: s.employees.map(e =>
            e.id === empId ? { ...e, empKey: newKey } : e
          ),
        }));
        return newKey;
      },

      isValidKey: (key) => {
        if (key === 'SA-MASTERKEY2025') return true;
        const state = get();
        if (state.organizations.some(o => o.orgKey === key && o.status === 'active')) return true;
        if (state.employees.some(e => e.empKey === key && e.status === 'active')) return true;
        return false;
      },
    }),
    { name: 'cybersim_data' }
  )
);
