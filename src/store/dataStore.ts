import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ATTACK_MODULES, BADGES } from '@/data/mockData';
import type { Level1Result } from '@/store/simulationStore';
import type { Json, Database } from '@/lib/database.types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  status: 'active' | 'suspended';
  /** Short human login key (e.g. "ORG-1A2B3C4D"). */
  orgKey: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
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
  /** Employee login key (e.g. "EMP-1A2B3C4D"); null for legacy rows. */
  accessKey: string | null;
}

/** Employee + login key returned by the create-employee Edge Function. */
export interface CreatedEmployee {
  id: string;
  name: string;
  email: string;
  empKey: string;
}

/** Shape returned by the create-org Edge Function. */
interface CreateOrgResponse {
  org: OrganizationRow;
  orgKey: string;
}

/** Shape returned by the create-employee Edge Function. */
interface CreateEmployeeResponse {
  employee: ProfileRow;
  empKey: string;
}

interface DataState {
  organizations: Organization[];
  employees: Employee[];

  // Reads (populate the in-memory cache from Supabase)
  refreshOrganizations: () => Promise<void>;
  refreshEmployees: (orgId?: string) => Promise<void>;
  refreshEmployee: (userId: string) => Promise<void>;

  // Writes
  addOrganization: (name: string) => Promise<Organization>;
  updateOrgStatus: (orgId: string, status: 'active' | 'suspended') => Promise<void>;
  addEmployee: (
    name: string,
    email: string,
    orgId: string,
    jobRole?: string,
    age?: number,
    gender?: string,
  ) => Promise<CreatedEmployee>;
  updateEmployeeProgress: (empId: string, moduleId: string, score: number) => Promise<void>;
  completeLevel1: (empId: string, result: Level1Result) => Promise<void>;

  // Sync selectors over the cache
  getOrg: (orgId: string) => Organization | undefined;
  getEmployee: (empId: string) => Employee | undefined;
}

export interface Level1Derivation {
  completedCount: number;
  failedCount: number;
  normalizedScore: number;
  earnedBadgeIds: string[];
}

/** Pure derivation of Level 1 progress (score → %, completed count, badges). */
export function deriveLevel1Progress(
  result: Pick<Level1Result, 'score' | 'completedAttacks' | 'failedAttacks'>,
): Level1Derivation {
  const completedCount = Math.max(0, Math.min(result.completedAttacks ?? 0, ATTACK_MODULES.length));
  const failedCount = Math.max(0, result.failedAttacks ?? 0);
  const normalizedScore = Math.max(0, Math.min(100, Math.round((result.score / 940) * 100)));
  const earnedBadgeIds = ATTACK_MODULES.slice(0, completedCount)
    .map((m) => BADGES.find((b) => b.module === m.id)?.id)
    .filter((id): id is string => Boolean(id));
  return { completedCount, failedCount, normalizedScore, earnedBadgeIds };
}

const ORG_SELECT = 'id, name, status, created_at, org_key';

const EMPLOYEE_SELECT =
  'id, full_name, email, org_id, job_role, age, gender, level, xp, status, last_active, access_key, ' +
  'module_progress(module_id, score), badges_earned(badge_id), level1_results(score, details, completed_at)';

function mapOrg(row: {
  id: string;
  name: string;
  status: string;
  created_at: string;
  org_key: string;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    status: row.status === 'suspended' ? 'suspended' : 'active',
    createdAt: row.created_at,
    orgKey: row.org_key,
  };
}

type EmployeeRow = {
  id: string;
  full_name: string;
  email: string | null;
  org_id: string | null;
  job_role: string | null;
  age: number | null;
  gender: string | null;
  level: number;
  xp: number;
  status: string;
  last_active: string | null;
  access_key: string | null;
  module_progress: { module_id: string; score: number }[];
  badges_earned: { badge_id: string }[];
  level1_results: { score: number; details: unknown; completed_at: string }[];
};

function assembleEmployee(row: EmployeeRow): Employee {
  const moduleProgress: Record<string, number> = Object.fromEntries(
    ATTACK_MODULES.map((m) => [m.id, 0]),
  );
  for (const mp of row.module_progress) moduleProgress[mp.module_id] = mp.score;

  const latest = [...row.level1_results].sort((a, b) =>
    (b.completed_at ?? '').localeCompare(a.completed_at ?? ''),
  )[0];

  let level1Result: Level1Result | undefined;
  if (latest) {
    const details = (latest.details ?? {}) as Partial<Level1Result>;
    level1Result = {
      score: latest.score,
      status: details.status ?? 'completed',
      completedAttacks: details.completedAttacks,
      failedAttacks: details.failedAttacks,
      pcSubAttackResults: details.pcSubAttackResults,
      completedAt: latest.completed_at,
    };
  }

  return {
    id: row.id,
    name: row.full_name || row.email || 'Employee',
    email: row.email ?? '',
    level: row.level,
    orgId: row.org_id ?? '',
    moduleProgress,
    level1Result,
    xp: row.xp,
    badges: row.badges_earned.map((b) => b.badge_id),
    lastActive: row.last_active ?? '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    jobRole: row.job_role ?? undefined,
    age: row.age ?? undefined,
    gender: row.gender ?? undefined,
    accessKey: row.access_key,
  };
}

async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_SELECT)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapOrg);
}

async function fetchEmployees(orgId?: string): Promise<Employee[]> {
  let query = supabase.from('profiles').select(EMPLOYEE_SELECT).eq('role', 'employee');
  if (orgId) query = query.eq('org_id', orgId);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as EmployeeRow[]).map(assembleEmployee);
}

/** Extracts the JSON error body an Edge Function returns on a non-2xx status. */
async function edgeErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const ctx = error.context;
  if (ctx instanceof Response) {
    try {
      const body = (await ctx.json()) as { error?: string };
      if (body?.error) return body.error;
    } catch {
      /* fall through to the generic message */
    }
  }
  return error.message;
}

export const useDataStore = create<DataState>((set, get) => ({
  organizations: [],
  employees: [],

  refreshOrganizations: async () => {
    set({ organizations: await fetchOrganizations() });
  },

  refreshEmployees: async (orgId) => {
    set({ employees: await fetchEmployees(orgId) });
  },

  refreshEmployee: async (userId) => {
    const employees = await fetchEmployees();
    set({ employees });
    const self = employees.find((e) => e.id === userId);
    if (self?.orgId) {
      const { data } = await supabase
        .from('organizations')
        .select(ORG_SELECT)
        .eq('id', self.orgId)
        .maybeSingle();
      if (data) set({ organizations: [mapOrg(data)] });
    }
  },

  addOrganization: async (name) => {
    // The create-org Edge Function (super_admin only) creates the org, mints a
    // unique ORG- key, and provisions the org_admin auth user.
    const { data, error } = await supabase.functions.invoke<CreateOrgResponse>('create-org', {
      body: { name },
    });
    if (error) throw new Error(await edgeErrorMessage(error));
    if (!data?.org) throw new Error('Organization creation returned no data');
    const org = mapOrg(data.org);
    set((s) => ({ organizations: [...s.organizations, org] }));
    return org;
  },

  updateOrgStatus: async (orgId, status) => {
    const { error } = await supabase.from('organizations').update({ status }).eq('id', orgId);
    if (error) throw new Error(error.message);
    set((s) => ({
      organizations: s.organizations.map((o) => (o.id === orgId ? { ...o, status } : o)),
    }));
  },

  addEmployee: async (name, email, orgId, jobRole, age, gender) => {
    // The create-employee Edge Function (org_admin only) creates the employee
    // auth user in the caller's org and assigns a unique EMP- access key. The
    // caller's org is derived from their JWT server-side; orgId here is only
    // used to refresh the correct slice of the local cache.
    const { data, error } = await supabase.functions.invoke<CreateEmployeeResponse>('create-employee', {
      body: {
        full_name: name,
        email: email || undefined,
        job_role: jobRole,
        age,
        gender,
      },
    });
    if (error) throw new Error(await edgeErrorMessage(error));
    if (!data?.employee || !data?.empKey) throw new Error('Employee creation returned no data');
    await get().refreshEmployees(orgId);
    return {
      id: data.employee.id,
      name: data.employee.full_name || name,
      email: data.employee.email ?? (email || ''),
      empKey: data.empKey,
    };
  },

  updateEmployeeProgress: async (empId, moduleId, score) => {
    const { error } = await supabase
      .from('module_progress')
      .upsert(
        { user_id: empId, module_id: moduleId, score, completed_at: new Date().toISOString() },
        { onConflict: 'user_id,module_id' },
      );
    if (error) throw new Error(error.message);
  },

  completeLevel1: async (empId, result) => {
    const { completedCount, failedCount, normalizedScore, earnedBadgeIds } = deriveLevel1Progress(result);
    const completedAt = result.completedAt ?? new Date().toISOString();

    const { error: l1Err } = await supabase.from('level1_results').insert({
      user_id: empId,
      score: result.score,
      details: {
        status: result.status,
        completedAttacks: completedCount,
        failedAttacks: failedCount,
        pcSubAttackResults: result.pcSubAttackResults ?? [],
      } as unknown as Json,
      completed_at: completedAt,
    });
    if (l1Err) throw new Error(l1Err.message);

    const progressRows = ATTACK_MODULES.map((m) => ({
      user_id: empId,
      module_id: m.id,
      score: normalizedScore,
      completed_at: completedAt,
    }));
    const { error: mpErr } = await supabase
      .from('module_progress')
      .upsert(progressRows, { onConflict: 'user_id,module_id' });
    if (mpErr) throw new Error(mpErr.message);

    if (earnedBadgeIds.length > 0) {
      const badgeRows = earnedBadgeIds.map((id) => ({ user_id: empId, badge_id: id }));
      const { error: bErr } = await supabase
        .from('badges_earned')
        .upsert(badgeRows, { onConflict: 'user_id,badge_id' });
      if (bErr) throw new Error(bErr.message);
    }

    if (result.status === 'completed') {
      const { error: lvlErr } = await supabase
        .from('profiles')
        .update({ level: 2 })
        .eq('id', empId)
        .lt('level', 2);
      if (lvlErr) throw new Error(lvlErr.message);
    }

    await get().refreshEmployee(empId);
  },

  getOrg: (orgId) => get().organizations.find((o) => o.id === orgId),
  getEmployee: (empId) => get().employees.find((e) => e.id === empId),
}));
