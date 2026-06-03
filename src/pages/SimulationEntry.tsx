import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Rocket, Eye, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { ATTACK_MODULES } from '@/data/mockData';
import { useSimulationStore } from '@/store/simulationStore';

export default function SimulationEntry() {
  const navigate = useNavigate();
  const modulesCleared = useSimulationStore(s => s.modulesCleared);
  const clearedCount = modulesCleared.length;

  const launchSimulation = () => {
    navigate('/simulation/level-1');
  };

  return (
    <div className="min-h-screen px-8 py-6">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-text-secondary hover:text-cyan transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <h1 className="font-display font-bold text-2xl text-text-primary">SIMULATION CENTER</h1>
      </div>

      <div className="text-center mb-10">
        <h2 className="font-display font-bold text-3xl text-text-primary">SELECT YOUR TRAINING LEVEL</h2>
        <p className="text-text-secondary mt-2">Complete all 8 in-office attacks per level to advance</p>
      </div>

      {/* 3 Level Cards */}
      <div className="grid grid-cols-3 gap-6 max-w-[1200px] mx-auto mb-16">
        {/* LEVEL 1 */}
        <GlassCard glow="cyan" className="relative">
          <div className="font-display font-black text-5xl text-cyan neon-text-cyan">LEVEL 01</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-text-secondary text-sm">Security Fundamentals</span>
            <div className="flex gap-0.5 ml-auto">
              {[1, 2, 3].map(d => <span key={d} className={`w-2 h-2 rounded-full ${d <= 1 ? 'bg-cyan' : 'bg-elevated'}`} />)}
            </div>
          </div>

          <p className="text-text-secondary text-sm mt-4 leading-relaxed">
            You are an employee at TechCorp. Navigate the office and respond to 8 real cybersecurity threats as they happen.
          </p>

          <div className="bg-elevated/50 rounded-lg p-4 mt-4">
            <span className="font-display text-[10px] tracking-wider text-text-muted">INSIDE THE SIMULATION:</span>
            <ul className="text-xs text-text-secondary mt-2 space-y-1">
              <li>• Realistic 3D office environment</li>
              <li>• 8 attacks happen naturally as you explore</li>
              <li>• Each correct response earns XP</li>
              <li>• All 8 must be cleared to unlock Level 2</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {ATTACK_MODULES.map(m => (
              <span key={m.id} className="text-[10px] px-2 py-1 rounded bg-elevated text-text-secondary">
                {m.icon} {m.name.split(' ')[0]}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs text-text-secondary mb-2">{clearedCount} of 8 attacks cleared</p>
            <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-green rounded-full transition-all" style={{ width: `${(clearedCount / 8) * 100}%` }} />
            </div>
          </div>

          <NeonButton className="w-full mt-5 animate-neon-pulse" size="lg" onClick={launchSimulation}>
            Start Level 1 — Office Simulation
          </NeonButton>
          <p className="text-[10px] text-text-muted text-center mt-2">Earn up to 940 XP + 7 Badges</p>
        </GlassCard>

        {/* LEVEL 2 */}
        <GlassCard className="relative border-amber/20 opacity-60">
          <div className="absolute inset-0 backdrop-blur-sm bg-void/60 rounded-2xl flex items-center justify-center z-10">
            <Lock className="w-12 h-12 text-text-muted" />
          </div>
          <div className="font-display font-black text-5xl text-amber/50">LEVEL 02</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-text-secondary text-sm">Advanced Threats</span>
            <div className="flex gap-0.5 ml-auto">
              {[1, 2, 3].map(d => <span key={d} className={`w-2 h-2 rounded-full ${d <= 2 ? 'bg-amber' : 'bg-elevated'}`} />)}
            </div>
          </div>
          <p className="text-text-secondary text-sm mt-4">
            The same office. But attackers are smarter. Cues are subtler. You'll need to think before you act.
          </p>
          <p className="text-amber text-xs mt-6">🔒 Complete all 7 Level 1 attacks to unlock</p>
          <NeonButton className="w-full mt-4" size="lg" disabled>LOCKED</NeonButton>
        </GlassCard>

        {/* LEVEL 3 */}
        <GlassCard className="relative border-purple/20 opacity-60">
          <div className="absolute inset-0 backdrop-blur-sm bg-void/60 rounded-2xl flex items-center justify-center z-10">
            <Lock className="w-12 h-12 text-text-muted" />
          </div>
          <div className="font-display font-black text-5xl text-purple/50">LEVEL 03</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-text-secondary text-sm">Expert Scenarios</span>
            <div className="flex gap-0.5 ml-auto">
              {[1, 2, 3].map(d => <span key={d} className={`w-2 h-2 rounded-full bg-purple`} />)}
            </div>
          </div>
          <p className="text-text-secondary text-sm mt-4">
            Multi-step attacks. A phishing email leads to a vishing call. Physical and digital threats overlap. No hand-holding.
          </p>
          <NeonButton className="w-full mt-8" size="lg" disabled>LOCKED</NeonButton>
        </GlassCard>
      </div>

      {/* How it works */}
      <div className="max-w-[900px] mx-auto mb-12">
        <h3 className="font-display font-bold text-lg text-text-primary text-center mb-8">HOW IT WORKS</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: Rocket, step: 1, title: 'ENTER THE OFFICE', desc: 'Your avatar spawns in TechCorp HQ. The office is alive.' },
            { icon: Eye, step: 2, title: 'FACE REAL THREATS', desc: '7 attacks happen organically as you explore. Stay alert.' },
            { icon: Target, step: 3, title: 'RESPOND CORRECTLY', desc: 'Your decisions are scored. Learn from every mistake.' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * step }}
            >
              <GlassCard className="text-center">
                <Icon className="w-8 h-8 text-cyan mx-auto mb-3" />
                <div className="font-display text-[10px] tracking-wider text-text-muted mb-1">STEP {step}</div>
                <h4 className="font-display font-bold text-sm text-text-primary mb-2">{title}</h4>
                <p className="text-xs text-text-secondary">{desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
