import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Displays a login key (ORG-/EMP-) with reveal/hide and copy-to-clipboard.
 * Masked by default so keys aren't shoulder-surfed from a dashboard table.
 * Blue/cyan theme to match the rest of the app.
 */
export function KeyReveal({ value, className = '' }: { value: string | null; className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className="font-mono text-xs text-text-muted">—</span>;
  }

  const masked = `${value.slice(0, 4)}${'•'.repeat(Math.max(4, value.length - 4))}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Key copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy key');
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 bg-elevated border border-border rounded-lg px-3 py-1.5 ${className}`}
    >
      <code className="font-mono text-xs text-cyan tracking-wider break-all">
        {revealed ? value : masked}
      </code>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? 'Hide key' : 'Reveal key'}
        className="text-text-muted hover:text-cyan transition-colors shrink-0"
      >
        {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy key"
        className="text-text-muted hover:text-cyan transition-colors shrink-0"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
