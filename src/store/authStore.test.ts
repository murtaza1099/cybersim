import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Supabase client so the lockout logic can be exercised without a
// backend. `vi.hoisted` lets the mock factory reference these spies safely.
const { invoke, verifyOtp } = vi.hoisted(() => ({ invoke: vi.fn(), verifyOtp: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp,
      signInWithPassword: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    functions: { invoke },
    from: vi.fn(),
  },
}));

import { useAuthStore } from './authStore';

describe('authStore lockout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      loginAttempts: 0,
      lockedUntil: null,
      isAuthenticated: false,
      role: null,
    });
    invoke.mockReset();
    // key-login rejects every key -> each login() attempt fails.
    invoke.mockResolvedValue({ data: null, error: { message: 'invalid_key' } });
    verifyOtp.mockReset();
  });

  it('rejects a bad access key and locks out after 5 failed attempts', async () => {
    const { login } = useAuthStore.getState();

    for (let i = 0; i < 4; i++) {
      const r = await login('EMP-BADKEY00');
      expect(r.success).toBe(false);
      expect(r.error).toBe('Invalid access key');
    }

    // 5th failure crosses the threshold and reports the lockout.
    const fifth = await login('EMP-BADKEY00');
    expect(fifth.success).toBe(false);
    expect(fifth.error).toMatch(/Locked/i);
    expect(useAuthStore.getState().lockedUntil).not.toBeNull();

    // 6th attempt is short-circuited by the lock guard — no Edge Function call made.
    invoke.mockClear();
    const sixth = await login('EMP-BADKEY00');
    expect(sixth.error).toMatch(/Too many attempts/i);
    expect(invoke).not.toHaveBeenCalled();
  });
});
