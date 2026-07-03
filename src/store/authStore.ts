import { create } from 'zustand';
import type { StoreApi } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { useGameStore } from '@/pages/Level1/stores/gameStore';
import { useSimulationStore } from '@/store/simulationStore';

type Role = Database['public']['Enums']['user_role'];

const rolePaths: Record<Role, string> = {
  super_admin: '/super-admin',
  org_admin: '/org-admin',
  employee: '/dashboard',
};

const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectPath?: string;
}

/** Shape returned by the public `key-login` Edge Function. */
interface KeyLoginResponse {
  email: string;
  token: string;
  token_hash?: string;
  type: string;
}

interface AuthState {
  role: Role | null;
  userId: string | null;
  orgId: string | null;
  userName: string | null;
  redirectPath: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  loginAttempts: number;
  lockedUntil: number | null;

  setHydrated: (value: boolean) => void;
  /** Access-key login for org_admin / employee (the `/` page). */
  login: (key: string) => Promise<LoginResult>;
  /** Super-admin email + password login (the `/super-admin` page). */
  superAdminLogin: (email: string, password: string) => Promise<LoginResult>;
  /** Restore auth state from the current Supabase session. */
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

type SetFn = StoreApi<AuthState>['setState'];
type GetFn = StoreApi<AuthState>['getState'];

const CLEARED = {
  isAuthenticated: false,
  role: null,
  userId: null,
  orgId: null,
  userName: null,
  redirectPath: null,
} as const;

function loadProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('role, org_id, full_name, email')
    .eq('id', userId)
    .single();
}

/**
 * Clear Level 1 progress so a newly logged-in (or logged-out) user never
 * inherits the previous player's persisted `cybersim-level1` state. Deliberately
 * NOT called from restoreSession(), so a mid-play page refresh keeps its state.
 */
function resetLevel1Progress() {
  useGameStore.getState().resetGame();
  useSimulationStore.setState({ modulesCleared: [], xp: 0, currentLevel: 1, level1Result: null });
}

function lockGuard(state: AuthState): LoginResult | null {
  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return { success: false, error: `Too many attempts. Try again in ${remaining}s` };
  }
  return null;
}

function fail(set: SetFn, get: GetFn, error: string): LoginResult {
  const attempts = get().loginAttempts + 1;
  set({
    loginAttempts: attempts,
    lockedUntil: attempts >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : null,
  });
  const locked = attempts >= MAX_ATTEMPTS;
  return { success: false, error: locked ? 'Too many attempts. Locked for 30s.' : error };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...CLEARED,
  isHydrated: false,
  loginAttempts: 0,
  lockedUntil: null,

  setHydrated: (value) => set({ isHydrated: value }),

  restoreSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ ...CLEARED, isHydrated: true });
      return;
    }
    const { data: profile, error } = await loadProfile(session.user.id);
    if (error || !profile) {
      set({ ...CLEARED, userId: session.user.id, isHydrated: true });
      return;
    }
    set({
      isAuthenticated: true,
      role: profile.role,
      userId: session.user.id,
      orgId: profile.org_id,
      userName: profile.full_name || profile.email,
      redirectPath: rolePaths[profile.role],
      isHydrated: true,
    });
  },

  login: async (key) => {
    const locked = lockGuard(get());
    if (locked) return locked;

    const trimmed = key.trim();
    if (!trimmed) return fail(set, get, 'Enter your access key');

    // 1. Exchange the ORG-/EMP- key for a one-time token via the public
    //    `key-login` Edge Function. The function returns a generic error for
    //    any bad/unknown key, so we never leak which keys exist.
    const { data, error } = await supabase.functions.invoke<KeyLoginResponse>('key-login', {
      body: { key: trimmed },
    });
    if (error || !data?.email || !data?.token) {
      return fail(set, get, 'Invalid access key');
    }

    // 2. Turn the magic-link OTP into a real Supabase session.
    const { data: verified, error: vErr } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: 'magiclink',
    });
    if (vErr || !verified.user) {
      return fail(set, get, 'Invalid access key');
    }

    // 3. Load the profile for role/org/name and set store state.
    const { data: profile, error: pErr } = await loadProfile(verified.user.id);
    if (pErr || !profile) {
      await supabase.auth.signOut();
      return fail(set, get, 'Could not load your profile');
    }
    if (profile.role === 'super_admin') {
      // Super admins authenticate on the dedicated /super-admin surface.
      await supabase.auth.signOut();
      return { success: false, error: 'Use the super-admin login for this account' };
    }

    // Fresh login → start Level 1 clean (don't inherit a prior player's save).
    if (profile.role === 'employee') resetLevel1Progress();

    set({
      isAuthenticated: true,
      role: profile.role,
      userId: verified.user.id,
      orgId: profile.org_id,
      userName: profile.full_name || profile.email,
      redirectPath: rolePaths[profile.role],
      loginAttempts: 0,
      lockedUntil: null,
    });
    return { success: true, redirectPath: rolePaths[profile.role] };
  },

  superAdminLogin: async (email, password) => {
    const locked = lockGuard(get());
    if (locked) return locked;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) return fail(set, get, 'Invalid email or password');

    const { data: profile, error: pErr } = await loadProfile(data.user.id);
    if (pErr || !profile) {
      await supabase.auth.signOut();
      return fail(set, get, 'Could not load your profile');
    }
    if (profile.role !== 'super_admin') {
      await supabase.auth.signOut();
      return { success: false, error: 'This is not a super-admin account' };
    }

    set({
      isAuthenticated: true,
      role: 'super_admin',
      userId: data.user.id,
      orgId: profile.org_id,
      userName: profile.full_name || profile.email,
      redirectPath: rolePaths.super_admin,
      loginAttempts: 0,
      lockedUntil: null,
    });
    return { success: true, redirectPath: rolePaths.super_admin };
  },

  logout: async () => {
    await supabase.auth.signOut();
    resetLevel1Progress();
    set({ ...CLEARED });
  },
}));
