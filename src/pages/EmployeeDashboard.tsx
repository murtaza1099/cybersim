import { Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Zap, Shield, Target, Award, Lock, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { StatCard } from '@/components/ui/StatCard';
import { ThreatRadarChart } from '@/components/charts/ThreatRadarChart';
import { DashboardGlobe } from '@/components/three/DashboardGlobe';
import { ATTACK_MODULES, BADGES } from '@/data/mockData';
import { useAuthStore } from '@/store/authStore';
import { useEmployee } from '@/hooks/useOrgData';

function Corners({ color = 'border-cyan/40' }: { color?: string }) {
  return <>
    <span className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${color}`} />
    <span className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${color}`} />
    <span className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l ${color}`} />
    <span className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${color}`} />
  </>;
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const { employee: emp, isError } = useEmployee(userId || '');
  useEffect(() => {
    if (isError) toast.error('Failed to load your training data.');
  }, [isError]);
  const moduleProgress = emp?.moduleProgress || {};
  const xp = emp?.xp || 0;
  const badges = emp?.badges || [];
  // "Cleared" is derived from the logged-in employee's REAL module_progress:
  // a module counts only if its score > 0. A first-time employee has none,
  // so XP / badges / cleared all read 0 — no placeholder numbers.
  const clearedModuleIds = ATTACK_MODULES.filter(m => (moduleProgress[m.id] || 0) > 0).map(m => m.id);
  const clearedCount = clearedModuleIds.length;
  const avgScore = (() => {
    const scores = Object.values(moduleProgress).filter((v): v is number => typeof v === 'number' && v > 0);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  })();
  const progressPct = Math.round((clearedCount / 7) * 100);

  return (
    <div className="min-h-screen">
      <TopNav />

      {/* Hero */}
      <section className="relative h-[62vh] overflow-hidden">
        <div className="absolute inset-0">
          <Suspense fallback={<div className="h-full bg-[#050810]" />}>
            <DashboardGlobe />
          </Suspense>
        </div>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(transparent, hsl(var(--bg-void)))' }} />

        <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none">
          {/* Mission card */}
          <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }} className="pointer-events-auto">
            <div className="relative glass-card p-6 w-[380px] border-cyan/25 shadow-[0_0_40px_rgba(0,229,255,0.08)]">
              <Corners />
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-green animate-pulse" />
                <span className="font-display text-[9px] tracking-[0.25em] text-green">MISSION ACTIVE</span>
              </div>
              <h2 className="font-display font-black text-5xl text-cyan neon-text-cyan mt-1">LEVEL 1</h2>
              <p className="text-text-secondary text-sm mt-0.5">Security Fundamentals</p>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-display text-[10px] tracking-wider text-text-muted">PROGRESS</span>
                  <span className="font-mono text-xs text-cyan">{clearedCount}/7</span>
                </div>
                <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-cyan to-green rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[10px] text-text-muted">{progressPct}% complete</span>
                  <span className="font-mono text-[10px] text-text-muted">{7 - clearedCount} remaining</span>
                </div>
              </div>

              <NeonButton size="sm" className="w-full mt-5" onClick={() => navigate('/simulation/level-1')}>
                <ChevronRight className="w-3 h-3 mr-1 inline" />ENTER SIMULATION
              </NeonButton>
            </div>
          </motion.div>

          {/* Threat vectors */}
          <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }} className="pointer-events-auto">
            <div className="relative glass-card p-5 w-[260px]">
              <Corners color="border-cyan/20" />
              <span className="font-display text-[9px] tracking-[0.2em] text-text-muted block mb-3">ACTIVE THREAT VECTORS</span>
              <div className="space-y-1.5">
                {ATTACK_MODULES.map(m => {
                  const cleared = clearedModuleIds.includes(m.id);
                  return (
                    <div key={m.id} className={`flex items-center gap-2.5 py-1 px-2 rounded transition-colors ${cleared ? 'opacity-50' : 'bg-elevated/40'}`}>
                      <span className={`text-base ${!cleared ? 'animate-pulse' : ''}`}>{m.icon}</span>
                      <span className={`text-xs flex-1 ${cleared ? 'line-through text-text-muted' : 'text-text-primary'}`}>{m.name}</span>
                      {cleared
                        ? <span className="text-green text-[10px] font-mono">✓</span>
                        : <span className="text-cyan text-[10px]">⚡</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-10 py-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Zap} value={xp} label="XP Earned" color="amber" delay={0} />
          <StatCard icon={Shield} value={clearedCount} label="Attacks Cleared" color="cyan" delay={0.08} />
          <StatCard icon={Target} value={avgScore} suffix="%" label="Avg Score" color="green" delay={0.16} />
          <StatCard icon={Award} value={badges.length} label="Badges Earned" color="purple" delay={0.24} />
        </div>
      </section>

      {/* Training Progression */}
      <section className="px-10 py-6">
        <SectionHeader title="TRAINING PROGRESSION" sub="Level 2 unlocks after clearing all 7 attacks" />
        <div className="grid grid-cols-3 gap-5">
          <LevelCard level={1} title="Security Fundamentals" difficulty={1} unlocked
            description="Navigate TechCorp HQ. Respond to 8 real cybersecurity threats. Clear visual cues guide your choices."
            onStart={() => navigate('/simulation/level-1')} />
          <LevelCard level={2} title="Advanced Threats" difficulty={2} unlocked={false} accentColor="amber"
            description="Same office. Smarter attackers. Subtler cues. You'll need to think before you act." />
          <LevelCard level={3} title="Expert Scenarios" difficulty={3} unlocked={false} accentColor="purple"
            description="Multi-step chained attacks. Phishing triggers vishing follow-up. No obvious red flags." />
        </div>
      </section>

      {/* Radar + Activity */}
      <section className="px-10 py-6">
        <div className="grid grid-cols-2 gap-5">
          <GlassCard>
            <SectionHeader title="THREAT RESPONSE PROFILE" compact />
            <ThreatRadarChart scores={moduleProgress} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <ProfileGroup label="STRENGTHS" color="green" colorDim="bg-green-dim text-green"
                modules={ATTACK_MODULES.filter(m => (moduleProgress[m.id] || 0) >= 70)}
                emptyText="Complete attacks to build your profile" />
              <ProfileGroup label="NEEDS WORK" color="red" colorDim="bg-red-dim text-red"
                modules={ATTACK_MODULES.filter(m => { const s = moduleProgress[m.id] || 0; return s > 0 && s < 70; })} />
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="RECENT ACTIVITY" compact />
            <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {[{ color: 'bg-cyan', time: 'Now', text: 'Logged in — Welcome back, Agent' }].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }} className="flex items-start gap-3 pl-1">
                  <div className={`w-3.5 h-3.5 rounded-full ${item.color} mt-0.5 shrink-0 ${i === 0 ? 'animate-pulse' : ''}`} />
                  <div>
                    <span className="text-[10px] text-text-muted font-mono">{item.time}</span>
                    <p className="text-sm text-text-primary">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Badges */}
      <section className="px-10 py-6 pb-16">
        <SectionHeader title="ACHIEVEMENTS" sub={`${badges.length}/${BADGES.length} badges earned`} />
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {BADGES.map(badge => {
            const earned = badges.includes(badge.id);
            return (
              <motion.div key={badge.id} whileHover={{ scale: 1.05, y: -2 }}
                className={`relative glass-card p-5 w-[175px] min-w-[175px] text-center shrink-0 transition-all duration-300 ${
                  earned ? 'border-cyan/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]' : 'grayscale opacity-35'
                }`}>
                {earned && <Corners color="border-cyan/30" />}
                <span className="text-3xl">{badge.icon}</span>
                <h4 className="font-display font-bold text-[11px] mt-3 text-text-primary">{badge.name}</h4>
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{badge.desc}</p>
                <p className="text-[10px] mt-2 font-mono">
                  {earned
                    ? <span className="text-green">Earned ✓</span>
                    : <span className="text-text-muted flex items-center justify-center gap-1"><Lock className="w-2.5 h-2.5" />Locked</span>}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, sub, compact }: { title: string; sub?: string; compact?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${compact ? 'mb-3' : 'mb-5'}`}>
      <h2 className={`font-display font-bold tracking-wider text-text-primary ${compact ? 'text-sm' : 'text-base'}`}>{title}</h2>
      {sub && <span className="text-[11px] text-text-muted">{sub}</span>}
    </div>
  );
}

function ProfileGroup({ label, color, colorDim, modules, emptyText }: {
  label: string; color: string; colorDim: string; modules: typeof ATTACK_MODULES; emptyText?: string;
}) {
  return (
    <div>
      <span className={`font-display text-[10px] tracking-wider text-${color}`}>{label}</span>
      <div className="flex flex-wrap gap-1 mt-2">
        {modules.map(m => (
          <span key={m.id} className={`text-[10px] px-2 py-0.5 rounded ${colorDim}`}>{m.icon} {m.name}</span>
        ))}
        {modules.length === 0 && emptyText && (
          <span className="text-[10px] text-text-muted">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function LevelCard({ level, title, difficulty, unlocked, accentColor = 'cyan', description, onStart }: {
  level: number; title: string; difficulty: number; unlocked: boolean;
  accentColor?: string; description: string; onStart?: () => void;
}) {
  const colors: Record<string, { border: string; text: string; bg: string }> = {
    cyan:   { border: 'border-cyan/25',   text: 'text-cyan',   bg: 'bg-cyan' },
    amber:  { border: 'border-amber/25',  text: 'text-amber',  bg: 'bg-amber' },
    purple: { border: 'border-purple/25', text: 'text-purple', bg: 'bg-purple' },
  };
  const c = colors[accentColor];

  return (
    <div className={`relative glass-card p-6 ${c.border} ${!unlocked ? 'opacity-45' : ''} transition-all duration-300 ${unlocked ? 'hover:shadow-[0_0_30px_rgba(0,229,255,0.08)]' : ''}`}>
      {!unlocked && (
        <div className="absolute inset-0 backdrop-blur-[2px] bg-void/50 rounded-2xl flex items-center justify-center z-10">
          <Lock className="w-9 h-9 text-text-muted" />
        </div>
      )}
      <div className={`font-display font-black text-3xl ${c.text}`}>LEVEL 0{level}</div>
      <div className="flex gap-1 mt-2 mb-3">
        {[1, 2, 3].map(d => (
          <span key={d} className={`w-2 h-2 rounded-full ${d <= difficulty ? c.bg : 'bg-elevated'}`} />
        ))}
      </div>
      <h3 className="font-display font-bold text-sm text-text-primary mb-2">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      <div className="mt-5">
        {unlocked
          ? <NeonButton size="sm" className="w-full" onClick={onStart}>Start Level {level}</NeonButton>
          : <NeonButton size="sm" className="w-full" disabled><Lock className="w-3 h-3 inline mr-1" />LOCKED</NeonButton>}
      </div>
    </div>
  );
}
