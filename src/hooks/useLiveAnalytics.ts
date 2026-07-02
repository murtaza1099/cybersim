import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAnalyticsStore } from '@/store/analyticsStore';

/**
 * Owns the Supabase Realtime subscription lifecycle for live points_ledger /
 * events analytics (KPI strip, activity feed, module distribution chart).
 * Call once from the top-level dashboard component — not per-tab — so
 * switching tabs doesn't tear down and re-establish the socket.
 */
export function useLiveAnalytics(orgId?: string) {
  const isError = useAnalyticsStore((s) => s.isError);

  useEffect(() => {
    void useAnalyticsStore.getState().init(orgId);
    return () => useAnalyticsStore.getState().cleanup();
  }, [orgId]);

  useEffect(() => {
    if (isError) toast.error('Failed to load live activity data.');
  }, [isError]);
}
