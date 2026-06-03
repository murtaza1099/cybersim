import { cn } from '@/lib/utils';

type StatusVariant = 'active' | 'inactive' | 'locked' | 'pending' | 'revoked' | 'suspended';

const config: Record<StatusVariant, { dot: string; text: string; bg: string }> = {
  active: { dot: 'bg-green', text: 'text-green', bg: 'bg-green-dim' },
  inactive: { dot: 'bg-red', text: 'text-red', bg: 'bg-red-dim' },
  locked: { dot: 'bg-amber', text: 'text-amber', bg: 'bg-amber-dim' },
  pending: { dot: 'bg-cyan', text: 'text-cyan', bg: 'bg-cyan-dim' },
  revoked: { dot: 'bg-text-muted', text: 'text-text-muted', bg: 'bg-elevated' },
  suspended: { dot: 'bg-red', text: 'text-red', bg: 'bg-red-dim' },
};

export function StatusBadge({ status, className }: { status: StatusVariant; className?: string }) {
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-display tracking-wider uppercase', c.bg, c.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {status}
    </span>
  );
}
