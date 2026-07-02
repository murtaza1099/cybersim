import { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, ShieldX, Shield, Trophy, BarChart2, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { NeonButton } from '@/components/ui/NeonButton';
import { LoginShield } from '@/components/three/LoginShield';

const rolePaths: Record<string, string> = { super_admin: '/super-admin', org_admin: '/org-admin', employee: '/dashboard' };

function Corners({ color = 'border-cyan/50' }: { color?: string }) {
  return <>
    <span className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${color}`} />
    <span className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${color}`} />
    <span className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${color}`} />
    <span className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${color}`} />
  </>;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      const role = useAuthStore.getState().role;
      navigate(result.redirectPath || rolePaths[role ?? 'employee']);
    } else {
      const message = result.error || 'Sign in failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#050810]">
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        animation: 'grid-scroll 5s linear infinite',
      }} />
      {/* Radial vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 80% at 30% 50%, transparent 40%, #050810 100%)',
      }} />
      <div className="scan-line absolute inset-0 pointer-events-none" />

      {/* Left — 3D + branding */}
      <div className="hidden lg:flex w-[58%] flex-col items-center justify-center relative">
        <div className="w-full h-[460px]">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-text-muted font-mono text-xs">INITIALIZING 3D CORE...</div>}>
            <LoginShield />
          </Suspense>
        </div>

        <div className="text-center mt-2 px-12">
          <motion.h1 className="font-display font-black text-6xl tracking-tight mb-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            {'CYBERSIM'.split('').map((c, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }} className="neon-text-cyan text-cyan">
                {c}
              </motion.span>
            ))}
          </motion.h1>
          <TypewriterText text="Train. Detect. Defend." />

          <motion.div className="flex gap-3 mt-6 justify-center flex-wrap"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.5 }}>
            {[
              { icon: Shield,    label: '7 Attack Modules' },
              { icon: Trophy,    label: '3 Difficulty Levels' },
              { icon: BarChart2, label: 'Real-time Analytics' },
            ].map(({ icon: Icon, label }, i) => (
              <motion.span key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9 + i * 0.12 }}
                className="relative glass-card px-3 py-1.5 text-xs text-text-secondary flex items-center gap-1.5">
                <Corners color="border-cyan/20" />
                <Icon className="w-3 h-3 text-cyan shrink-0" />
                {label}
              </motion.span>
            ))}
          </motion.div>

          {/* System status row */}
          <motion.div className="flex items-center justify-center gap-6 mt-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>
            {[
              { label: 'UPTIME',          val: '99.9%' },
              { label: 'THREATS BLOCKED', val: '1,247' },
              { label: 'AGENTS ONLINE',   val: '38'    },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="font-display font-black text-base text-cyan">{val}</div>
                <div className="font-display text-[9px] tracking-[0.15em] text-text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right — form, perfectly centered in its column */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-8">
        <motion.div className="w-full max-w-[420px]"
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>

          {/* Status bar */}
          <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-text-muted">
            <Activity className="w-3 h-3 text-green" />
            <span className="text-green">SYSTEM ONLINE</span>
          </div>

          <div className="relative glass-card p-8 border-cyan/20 shadow-[0_0_40px_rgba(0,229,255,0.07)]">
            <Corners />

            {/* Header */}
            <div className="mb-6">
              <span className="font-display text-[10px] tracking-[0.35em] text-cyan/70">ACCESS TERMINAL</span>
              <div className="w-full h-px mt-2 bg-gradient-to-r from-cyan/30 via-cyan/10 to-transparent" />
            </div>

            <div className="mb-7">
              <p className="font-body text-text-secondary font-light text-xl leading-tight">Sign in to</p>
              <p className="font-display font-black text-4xl text-text-primary leading-tight mt-0.5">Your Account</p>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">EMAIL</label>
              <div className="relative mb-4 flex items-center">
                <span className="absolute left-4 font-mono text-xs text-cyan/50 select-none pointer-events-none">@</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@company.com"
                  className={`w-full bg-elevated border rounded-lg pl-10 pr-4 py-3.5 font-mono text-sm tracking-wider text-text-primary placeholder:text-text-muted/40 outline-none transition-all duration-300 ${
                    error
                      ? 'border-red shadow-[0_0_15px_rgba(255,45,107,0.2)]'
                      : 'border-border focus:border-cyan focus:shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                  }`}
                />
              </div>

              <label className="font-display text-[10px] tracking-[0.2em] text-cyan mb-2 block">PASSWORD</label>
              <div className="relative mb-2 flex items-center">
                <span className="absolute left-4 font-mono text-xs text-cyan/50 select-none pointer-events-none">›_</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className={`w-full bg-elevated border rounded-lg pl-10 pr-11 py-3.5 font-mono text-sm tracking-wider text-text-primary placeholder:text-text-muted/40 outline-none transition-all duration-300 ${
                    error
                      ? 'border-red shadow-[0_0_15px_rgba(255,45,107,0.2)]'
                      : 'border-border focus:border-cyan focus:shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-text-muted hover:text-cyan transition-colors">
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
                AUTHENTICATE →
              </NeonButton>
            </form>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  return (
    <motion.p className="text-text-secondary font-light text-lg font-body">
      {text.split('').map((c, i) => (
        <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 + i * 0.05 }}>
          {c}
        </motion.span>
      ))}
    </motion.p>
  );
}
