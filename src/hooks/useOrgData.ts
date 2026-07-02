import { useQuery } from '@tanstack/react-query';
import { useDataStore } from '@/store/dataStore';

/**
 * React Query wrappers around the Supabase-backed data store. The store holds
 * the single in-memory cache (so charts reading it stay reactive); these hooks
 * drive the fetch lifecycle and expose loading/error states for the dashboards.
 */

export function useOrganizations() {
  const organizations = useDataStore((s) => s.organizations);
  const refreshOrganizations = useDataStore((s) => s.refreshOrganizations);
  const query = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      await refreshOrganizations();
      return true as const;
    },
  });
  return {
    organizations,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

export function useEmployees(orgId?: string) {
  const employees = useDataStore((s) => s.employees);
  const refreshEmployees = useDataStore((s) => s.refreshEmployees);
  const query = useQuery({
    queryKey: ['employees', orgId ?? 'all'],
    queryFn: async () => {
      await refreshEmployees(orgId);
      return true as const;
    },
  });
  return {
    employees,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

export function useEmployee(userId: string) {
  const employee = useDataStore((s) => (userId ? s.getEmployee(userId) : undefined));
  const refreshEmployee = useDataStore((s) => s.refreshEmployee);
  const query = useQuery({
    queryKey: ['employee', userId],
    queryFn: async () => {
      await refreshEmployee(userId);
      return true as const;
    },
    enabled: Boolean(userId),
  });
  return {
    employee,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
