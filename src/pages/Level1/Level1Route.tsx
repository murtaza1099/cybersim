import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Shield, Cpu, Wifi, Lock } from 'lucide-react'
import Level1Simulation, { type Level1ExitResult } from './App'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useSimulationStore } from '@/store/simulationStore'

const STEPS = [
  { icon: Cpu,    label: 'LOADING ENVIRONMENT',      t: 0 },
  { icon: Wifi,   label: 'CONNECTING NETWORK',        t: 1200 },
  { icon: Lock,   label: 'ARMING THREAT VECTORS',     t: 2600 },
  { icon: Shield, label: 'READY — ENTERING SIMULATION', t: 4000 },
]
function Level1Loader({ ready }: { ready: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.slice(1, -1).map((s, i) => setTimeout(() => setStep(i + 1), s.t))
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (ready) setStep(STEPS.length - 1)
  }, [ready])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050810]"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.03) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
      }}>

      {(['top-8 left-8 border-t-2 border-l-2','top-8 right-8 border-t-2 border-r-2','bottom-8 left-8 border-b-2 border-l-2','bottom-8 right-8 border-b-2 border-r-2'] as const).map((cls, i) => (
        <span key={i} className={`absolute w-8 h-8 border-cyan/30 ${cls}`} />
      ))}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="font-display font-black text-5xl text-cyan neon-text-cyan tracking-tight">CYBERSIM</div>
        <div className="font-display text-[11px] tracking-[0.35em] text-text-muted mt-2">LEVEL 01 — SECURITY FUNDAMENTALS</div>
      </motion.div>

      <div className="space-y-3 w-[320px]">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active = step === i
          const done = step > i
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: done || active ? 1 : 0.25, x: 0 }}
              transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded flex items-center justify-center border transition-all duration-300 ${
                done ? 'border-green bg-green/10' : active ? 'border-cyan bg-cyan/10' : 'border-border bg-elevated'
              }`}>
                <Icon className={`w-3.5 h-3.5 ${done ? 'text-green' : active ? 'text-cyan animate-pulse' : 'text-text-muted'}`} />
              </div>
              <span className={`font-display text-[11px] tracking-[0.12em] ${
                done ? 'text-green' : active ? 'text-cyan' : 'text-text-muted'
              }`}>{s.label}</span>
              {done && <span className="ml-auto text-green font-mono text-[10px]">OK</span>}
            </motion.div>
          )
        })}
      </div>

      <div className="w-[320px] h-0.5 bg-elevated mt-8 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-cyan to-green rounded-full"
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>
      <div className="font-mono text-[10px] text-text-muted mt-3">
        {Math.round(((step + 1) / STEPS.length) * 100)}% initialized
      </div>
    </div>
  )
}

export default function Level1Route() {
  const navigate = useNavigate()
  const [showLoader, setShowLoader] = useState(true)
  const [simulationReady, setSimulationReady] = useState(false)
  const userId = useAuthStore(s => s.userId)
  const completeEmployeeLevel1 = useDataStore(s => s.completeLevel1)
  const completeSessionLevel1 = useSimulationStore(s => s.completeLevel1)

  const handleExit = useCallback((result?: Level1ExitResult) => {
    if (result && result.status !== 'in-progress') {
      const completedResult = { ...result, completedAt: new Date().toISOString() }
      completeSessionLevel1(completedResult)
      if (userId) {
        completeEmployeeLevel1(userId, completedResult).catch((err) => {
          console.error('Failed to save Level 1 result', err)
          toast.error('Your Level 1 result could not be saved.')
        })
      }
    }
    navigate('/dashboard')
  }, [completeEmployeeLevel1, completeSessionLevel1, navigate, userId])

  useEffect(() => {
    if (simulationReady) setShowLoader(false)
  }, [simulationReady])

  return (
    <>
      {/* Simulation mounts immediately and loads in background while loader is visible */}
      <Level1Simulation onExit={handleExit} onSceneReady={() => setSimulationReady(true)} />

      <AnimatePresence>
        {showLoader && (
          <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <Level1Loader ready={simulationReady} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
