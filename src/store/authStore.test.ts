import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Supabase client so the lockout logic can be exercised without a
// backend. `vi.hoisted` lets the mock factory reference these spies safely.
const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword,
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
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
    signInWithPassword.mockReset();
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } });
  });

  it('rejects bad credentials and locks out after 5 failed attempts', async () => {
    const { login } = useAuthStore.getState();

    for (let i = 0; i < 4; i++) {
      const r = await login('a@b.com', 'wrong');
      expect(r.success).toBe(false);
      expect(r.error).toBe('Invalid email or password');
    }

    // 5th failure crosses the threshold and reports the lockout.
    const fifth = await login('a@b.com', 'wrong');
    expect(fifth.success).toBe(false);
    expect(fifth.error).toMatch(/Locked/i);
    expect(useAuthStore.getState().lockedUntil).not.toBeNull();

    // 6th attempt is short-circuited by the lock guard — no sign-in call made.
    signInWithPassword.mockClear();
    const sixth = await login('a@b.com', 'wrong');
    expect(sixth.error).toMatch(/Too many attempts/i);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
