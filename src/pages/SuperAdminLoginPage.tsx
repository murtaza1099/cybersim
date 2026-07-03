import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldX, Lock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { NeonButton } from '@/components/ui/NeonButton';

function Corners({ color = 'border-cyan/50' }: { color?: string }) {
  return <>
    <span className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${color}`} />
    <span className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${color}`} />
    <span className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${color}`} />
    <span className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${color}`} />
  </>;
}

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const superAdminLogin = useAuthStore((s) => s.superAdminLogin);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    const result = await superAdminLogin(email, password);
    setLoading(false);

    if (result.success) {
      navigate(result.redirectPath ?? '/super-admin');
    } else {
      const message = result.error ?? 'Sign in failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050810] p-6">
      {/* Cyan grid + vignette — same surface language as the main app */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        animation: 'grid-scroll 5s linear infinite',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 70% at 50% 40%, transparent 45%, #050810 100%)',
      }} />
      <div className="scan-line absolute inset-0 pointer-events-none" />

      <motion.div className="w-full max-w-[420px] relative"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-cyan/70 justify-center">
          <Lock className="w-3 h-3" />
          <span className="tracking-[0.25em]">RESTRICTED ACCESS</span>
        </div>

        <div className="relative glass-card p-8 border-cyan/20 shadow-[0_0_40px_rgba(0,229,255,0.07)]">
          <Corners />

          <div className="mb-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-cyan/10 border border-cyan/25 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-cyan" />
            </div>
            <span className="font-display text-[10px] tracking-[0.35em] text-cyan/70">SUPER ADMIN CONSOLE</span>
            <p className="font-display font-black text-3xl text-text-primary leading-tight mt-1">Secure Sign In</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">EMAIL</label>
            <input
              type="email" autoComplete="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@company.com"
              className={`w-full bg-elevated border rounded-lg px-4 py-3.5 mb-4 font-mono text-sm text-text-primary placeholder:text-text-muted/40 outline-none transition-all duration-300 ${
                error
                  ? 'border-red shadow-[0_0_15px_rgba(255,45,107,0.2)]'
                  : 'border-border focus:border-cyan focus:shadow-[0_0_20px_rgba(0,229,255,0.15)]'
              }`}
            />

            <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">PASSWORD</label>
            <div className="relative flex items-center mb-2">
              <input
                type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className={`w-full bg-elevated border rounded-lg px-4 pr-11 py-3.5 font-mono text-sm text-text-primary placeholder:text-text-muted/40 outline-none transition-all duration-300 ${
                  error
                    ? 'border-red shadow-[0_0_15px_rgba(255,45,107,0.2)]'
                    : 'border-border focus:border-cyan focus:shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                }`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-text-muted hover:text-cyan transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 text-red text-sm mb-3">
                  <ShieldX className="w-4 h-4 shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            <NeonButton type="submit" loading={loading} className="w-full mt-3" size="lg">
              SIGN IN →
            </NeonButton>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
