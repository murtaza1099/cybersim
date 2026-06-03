import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function NeonButton({ children, className, variant = 'primary', size = 'md', loading, disabled, ...props }: NeonButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-br from-cyan/15 to-cyan/5 border-cyan text-cyan shadow-[0_0_20px_rgba(0,229,255,0.15),0_0_60px_rgba(0,229,255,0.05)] hover:from-cyan/25 hover:to-cyan/10 hover:shadow-[0_0_30px_rgba(0,229,255,0.3),0_0_80px_rgba(0,229,255,0.1)]',
    ghost: 'bg-transparent border-text-muted/30 text-text-secondary hover:border-cyan/50 hover:text-cyan',
    danger: 'bg-gradient-to-br from-red/15 to-red/5 border-red text-red shadow-[0_0_20px_rgba(255,45,107,0.15)] hover:from-red/25 hover:to-red/10',
  };

  const sizes: Record<string, string> = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-7 py-3 text-[12px]',
    lg: 'px-8 py-4 text-[13px]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'font-display font-bold uppercase tracking-[0.1em] border rounded-lg transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          VERIFYING...
        </span>
      ) : children}
    </motion.button>
  );
}
