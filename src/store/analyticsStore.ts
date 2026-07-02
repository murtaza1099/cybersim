import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/lib/database.types';

type PointsLedgerRow = Database['public']['Tables']['points_ledger']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];

export interface ActivityFeedItem {
  id: string;
  ts: string;
  kind: 'points' | 'event';
  label: string;
  userId: string | null;
  orgId: string | null;
}

const FEED_LIMIT = 30;

interface AnalyticsState {
  isLoading: boolean;
  isError: boolean;
  totalPoints: number;
  activeAgents: number;
  threatsHandled: number;
  /** Count of `attack_completed` events, keyed by objective point id (as a string). */
  moduleDistribution: Record<string, number>;
  feed: ActivityFeedItem[];

  init: (orgId?: string) => Promise<void>;
  cleanup: () => void;
}

let ledgerChannel: RealtimeChannel | null = null;
let eventsChannel: RealtimeChannel | null = null;
let activeUserIds = new Set<string>();

/** Reads `payload.pointId` from an events row without ever widening to `any`. */
function extractPointId(payload: Json): number | null {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const value = payload.pointId;
  return typeof value === 'number' ? value : null;
}

function extractLabel(payload: Json): string | null {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const value = payload.label;
  return typeof value === 'string' ? value : null;
}

function describeEvent(row: EventRow): string {
  const label = extractLabel(row.payload);
  switch (row.type) {
    case 'attack_completed':
      return `Objective cleared${label ? `: ${label}` : ''}`;
    case 'attack_failed':
      return `Objective failed${label ? `: ${label}` : ''}`;
    default:
      return row.type;
  }
}

function feedItemFromLedger(row: PointsLedgerRow): ActivityFeedItem {
  return {
    id: `pl-${row.id}`,
    ts: row.created_at,
    kind: 'points',
    label: `${row.delta >= 0 ? '+' : ''}${row.delta} pts — ${row.reason ?? 'points awarded'}`,
    userId: row.user_id,
    orgId: row.org_id,
  };
}

function feedItemFromEvent(row: EventRow): ActivityFeedItem {
  return {
    id: `ev-${row.id}`,
    ts: row.created_at,
    kind: 'event',
    label: describeEvent(row),
    userId: row.user_id,
    orgId: row.org_id,
  };
}

/** Pure reducers, exported so the aggregation logic can be unit tested without touching Supabase. */
export function applyLedgerInsert(
  state: Pick<AnalyticsState, 'totalPoints' | 'feed'>,
  row: PointsLedgerRow,
  seenUserIds: Set<string>,
): Pick<AnalyticsState, 'totalPoints' | 'activeAgents' | 'feed'> {
  seenUserIds.add(row.user_id);
  return {
    totalPoints: state.totalPoints + row.delta,
    activeAgents: seenUserIds.size,
    feed: [feedItemFromLedger(row), ...state.feed].slice(0, FEED_LIMIT),
  };
}

export function applyEventInsert(
  state: Pick<AnalyticsState, 'threatsHandled' | 'moduleDistribution' | 'feed'>,
  row: EventRow,
): Pick<AnalyticsState, 'threatsHandled' | 'moduleDistribution' | 'feed'> {
  let threatsHandled = state.threatsHandled;
  const moduleDistribution = { ...state.moduleDistribution };
  if (row.type === 'attack_completed') {
    threatsHandled += 1;
    const pointId = extractPointId(row.payload);
    const key = pointId === null ? 'unknown' : String(pointId);
    moduleDistribution[key] = (moduleDistribution[key] ?? 0) + 1;
  }
  return {
    threatsHandled,
    moduleDistribution,
    feed: [feedItemFromEvent(row), ...state.feed].slice(0, FEED_LIMIT),
  };
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  isLoading: false,
  isError: false,
  totalPoints: 0,
  activeAgents: 0,
  threatsHandled: 0,
  moduleDistribution: {},
  feed: [],

  init: async (orgId) => {
    get().cleanup();
    activeUserIds = new Set();
    set({ isLoading: true, isError: false, totalPoints: 0, activeAgents: 0, threatsHandled: 0, moduleDistribution: {}, feed: [] });

    let ledgerQuery = supabase.from('points_ledger').select('delta, user_id');
    let eventsQuery = supabase.from('events').select('type, payload');
    if (orgId) {
      ledgerQuery = ledgerQuery.eq('org_id', orgId);
      eventsQuery = eventsQuery.eq('org_id', orgId);
    }

    const [ledgerRes, eventsRes] = await Promise.all([ledgerQuery, eventsQuery]);
    if (ledgerRes.error || eventsRes.error) {
      console.error('[analyticsStore] failed to load initial aggregates', ledgerRes.error ?? eventsRes.error);
      set({ isLoading: false, isError: true });
      return;
    }

    let totalPoints = 0;
    for (const row of ledgerRes.data ?? []) {
      totalPoints += row.delta;
      activeUserIds.add(row.user_id);
    }

    let threatsHandled = 0;
    const moduleDistribution: Record<string, number> = {};
    for (const row of eventsRes.data ?? []) {
      if (row.type === 'attack_completed') {
        threatsHandled += 1;
        const pointId = extractPointId(row.payload);
        const key = pointId === null ? 'unknown' : String(pointId);
        moduleDistribution[key] = (moduleDistribution[key] ?? 0) + 1;
      }
    }

    set({
      isLoading: false,
      totalPoints,
      activeAgents: activeUserIds.size,
      threatsHandled,
      moduleDistribution,
    });

    const filter = orgId ? `org_id=eq.${orgId}` : undefined;

    ledgerChannel = supabase
      .channel(orgId ? `points_ledger:org:${orgId}` : 'points_ledger:all')
      .on<PointsLedgerRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'points_ledger', ...(filter ? { filter } : {}) },
        (payload) => set((s) => applyLedgerInsert(s, payload.new, activeUserIds)),
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[analyticsStore] points_ledger realtime subscription failed', err);
        }
      });

    eventsChannel = supabase
      .channel(orgId ? `events:org:${orgId}` : 'events:all')
      .on<EventRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events', ...(filter ? { filter } : {}) },
        (payload) => set((s) => applyEventInsert(s, payload.new)),
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[analyticsStore] events realtime subscription failed', err);
        }
      });
  },

  cleanup: () => {
    if (ledgerChannel) {
      void supabase.removeChannel(ledgerChannel);
      ledgerChannel = null;
    }
    if (eventsChannel) {
      void supabase.removeChannel(eventsChannel);
      eventsChannel = null;
    }
  },
}));
