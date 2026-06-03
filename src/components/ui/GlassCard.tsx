import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'green' | 'red' | 'amber' | 'purple' | 'none';
  animate?: boolean;
}

export function GlassCard({ children, className, glow = 'none', animate = true, ...props }: GlassCardProps) {
  const glowBorder: Record<string, string> = {
    cyan: 'border-cyan/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]',
    green: 'border-green/30 shadow-[0_0_20px_rgba(0,255,135,0.1)]',
    red: 'border-red/30 shadow-[0_0_20px_rgba(255,45,107,0.1)]',
    amber: 'border-amber/30 shadow-[0_0_20px_rgba(255,184,0,0.1)]',
    purple: 'border-purple/30 shadow-[0_0_20px_rgba(157,78,221,0.1)]',
    none: '',
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('glass-card p-6', glow !== 'none' && glowBorder[glow], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
