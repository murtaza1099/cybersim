import { motion } from 'framer-motion';
import { Coins, Users, ShieldCheck, Radio } from 'lucide-react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { timeAgo } from '@/utils/formatters';

/**
 * Live KPI strip + activity feed. Purely presentational — the subscription
 * lifecycle is owned by `useLiveAnalytics`, called once from the top-level
 * dashboard component, so this can mount/unmount per-tab freely.
 */
export function LiveActivityPanel() {
  const totalPoints = useAnalyticsStore((s) => s.totalPoints);
  const activeAgents = useAnalyticsStore((s) => s.activeAgents);
  const threatsHandled = useAnalyticsStore((s) => s.threatsHandled);
  const feed = useAnalyticsStore((s) => s.feed);
  const isLoading = useAnalyticsStore((s) => s.isLoading);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-green animate-pulse" />
        <h2 className="font-display text-sm tracking-wider text-text-secondary">LIVE ACTIVITY</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Coins} value={totalPoints} label="Total Points" color="amber" delay={0} />
        <StatCard icon={Users} value={activeAgents} label="Active Agents" color="cyan" delay={0.05} />
        <StatCard icon={ShieldCheck} value={threatsHandled} label="Threats Handled" color="green" delay={0.1} />
      </div>

      <GlassCard>
        <h3 className="font-display text-sm tracking-wider text-text-secondary mb-4">ACTIVITY FEED</h3>
        {isLoading ? (
          <div className="text-center py-8 text-text-muted text-sm">Loading activity…</div>
        ) : feed.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">No activity yet — it will appear here in real time.</div>
        ) : (
          <ul className="space-y-2 max-h-[320px] overflow-y-auto">
            {feed.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-3 text-sm border-b border-border/40 pb-2 last:border-0"
              >
                <span className="flex items-center gap-2 text-text-primary">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.kind === 'points' ? 'bg-amber' : 'bg-cyan'}`} />
                  {item.label}
                </span>
                <span className="text-text-muted text-xs shrink-0">{timeAgo(item.ts)}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
