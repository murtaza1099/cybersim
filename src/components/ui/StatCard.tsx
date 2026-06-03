import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  suffix?: string;
  trend?: { value: number; up: boolean };
  color?: 'cyan' | 'green' | 'red' | 'amber' | 'purple';
  delay?: number;
}

const colorMap = {
  cyan: 'text-cyan',
  green: 'text-green',
  red: 'text-red',
  amber: 'text-amber',
  purple: 'text-purple',
};

export function StatCard({ icon: Icon, value, label, suffix = '', trend, color = 'cyan', delay = 0 }: StatCardProps) {
  const { ref, isVisible } = useIntersectionObserver();
  const count = useCountUp(value, 1500, isVisible);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="glass-card p-5 group hover:border-cyan/20 transition-all duration-300"
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
      style={{ perspective: 1000 }}
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className={cn('w-5 h-5', colorMap[color])} style={{ filter: `drop-shadow(0 0 8px currentColor)` }} />
        {trend && (
          <span className={cn('text-xs font-mono', trend.up ? 'text-green' : 'text-red')}>
            {trend.up ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div className={cn('text-3xl font-display font-black', colorMap[color])}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-text-secondary text-sm mt-1">{label}</div>
    </motion.div>
  );
}
