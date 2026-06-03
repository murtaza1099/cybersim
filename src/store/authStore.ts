import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MASTER_SA_KEY } from '@/data/mockData';
import { useDataStore } from '@/store/dataStore';

type Role = 'super_admin' | 'org_admin' | 'employee';

const rolePaths: Record<Role, string> = {
  super_admin: '/super-admin',
  org_admin: '/org-admin',
  employee: '/dashboard',
};

interface AuthState {
  token: string | null;
  role: Role | null;
  redirectPath: string | null;
  userId: string | null;
  orgId: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  loginAttempts: number;
  lockedUntil: number | null;
  login: (key: string) => Promise<{ success: boolean; error?: string; redirectPath?: string }>;
  logout: () => void;
  checkExpiry: () => boolean;
}

function parsePrefix(key: string): Role | null {
  if (key.startsWith('SA-')) return 'super_admin';
  if (key.startsWith('ORG-')) return 'org_admin';
  if (key.startsWith('EMP-')) return 'employee';
  return null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      redirectPath: null,
      userId: null,
      orgId: null,
      userName: null,
      isAuthenticated: false,
      isHydrated: false,
      setHydrated: (value: boolean) => set({ isHydrated: value }),
      loginAttempts: 0,
      lockedUntil: null,

      login: async (key: string) => {
        const state = get();
        if (state.lockedUntil && Date.now() < state.lockedUntil) {
          const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
          return { success: false, error: `Too many attempts. Try again in ${remaining}s` };
        }

        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));

        const role = parsePrefix(key);
        if (!role) {
          return failAttempt(set, get, 'Invalid access key format');
        }

        const dataStore = useDataStore.getState();

        // Super Admin — single hardcoded master key
        if (role === 'super_admin') {
          if (key !== MASTER_SA_KEY) {
            return failAttempt(set, get, 'Access key not recognized');
          }
          set({
            token: generateToken(),
            role: 'super_admin',
            redirectPath: rolePaths.super_admin,
            userId: 'sa_master',
            orgId: null,
            userName: 'Super Admin',
            isAuthenticated: true,
            loginAttempts: 0,
            lockedUntil: null,
          });
          const next = get();
          console.info('Auth state after login', {
            role: next.role,
            redirectPath: next.redirectPath,
            token: next.token,
            userId: next.userId,
            orgId: next.orgId,
            isAuthenticated: next.isAuthenticated,
          });
          return { success: true, redirectPath: rolePaths.super_admin };
        }

        // Org Admin — validate against dataStore
        if (role === 'org_admin') {
          const org = dataStore.getOrgByKey(key);
          if (!org || org.status !== 'active') {
            return failAttempt(set, get, 'Access key not recognized');
          }
          set({
            token: generateToken(),
            role: 'org_admin',
            redirectPath: rolePaths.org_admin,
            userId: org.id,
            orgId: org.id,
            userName: org.name,
            isAuthenticated: true,
            loginAttempts: 0,
            lockedUntil: null,
          });
          const next = get();
          console.info('Auth state after login', {
            role: next.role,
            redirectPath: next.redirectPath,
            token: next.token,
            userId: next.userId,
            orgId: next.orgId,
            isAuthenticated: next.isAuthenticated,
          });
          return { success: true, redirectPath: rolePaths.org_admin };
        }

        // Employee — validate against dataStore
        if (role === 'employee') {
          const emp = dataStore.getEmployeeByKey(key);
          if (!emp || emp.status !== 'active') {
            return failAttempt(set, get, 'Access key not recognized');
          }
          set({
            token: generateToken(),
            role: 'employee',
            redirectPath: rolePaths.employee,
            userId: emp.id,
            orgId: emp.orgId,
            userName: emp.name,
            isAuthenticated: true,
            loginAttempts: 0,
            lockedUntil: null,
          });
          const next = get();
          console.info('Auth state after login', {
            role: next.role,
            redirectPath: next.redirectPath,
            token: next.token,
            userId: next.userId,
            orgId: next.orgId,
            isAuthenticated: next.isAuthenticated,
          });
          return { success: true, redirectPath: rolePaths.employee };
        }

        return failAttempt(set, get, 'Invalid access key');
      },

      logout: () => {
        set({
          token: null, role: null, redirectPath: null, userId: null, orgId: null,
          userName: null, isAuthenticated: false,
        });
      },

      checkExpiry: () => {
        const state = get();
        if (!state.token) return false;
        // Token format: tok_<timestamp>_<random>
        const parts = state.token.split('_');
        if (parts.length >= 2) {
          const created = parseInt(parts[1], 10);
          if (Date.now() - created > 24 * 60 * 60 * 1000) {
            get().logout();
            return false;
          }
        }
        return true;
      },
    }),
    {
      name: 'cybersim_session',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

function generateToken(): string {
  return `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function failAttempt(
  set: any,
  get: () => AuthState,
  error: string
): { success: false; error: string } {
  const attempts = get().loginAttempts + 1;
  set({
    loginAttempts: attempts,
    lockedUntil: attempts >= 5 ? Date.now() + 30000 : null,
  });
  return { success: false, error };
}
