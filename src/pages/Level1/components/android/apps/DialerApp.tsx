import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../../stores/gameStore'
import { useAudioStore } from '../../../stores/audioStore'
import { useCameraStore } from '../../../stores/cameraStore'

if (typeof document !== 'undefined' && !document.getElementById('dial-kf')) {
  const s = document.createElement('style')
  s.id = 'dial-kf'
  s.textContent = `
    @keyframes phoneVibrate {
      0%,100% { transform:rotate(-2deg) } 50% { transform:rotate(2deg) }
    }
    .phone-ring { animation: phoneVibrate 0.18s ease-in-out infinite }
    @keyframes ptsMinus5 { 0%,100% { opacity:1 } 60% { opacity:0.3 } }
    .pts-flash5 { animation: ptsMinus5 0.4s ease 3 }
  `
  document.head.appendChild(s)
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" }
const neutralDecisionButton: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  background: 'transparent',
  border: '1px solid rgba(0,240,255,0.28)',
  color: '#e5e7eb',
  fontFamily: "'Orbitron',sans-serif",
  fontSize: 9,
  cursor: 'pointer',
  letterSpacing: '0.04em',
}
const neutralRoundDecisionButton: React.CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: '50%',
  background: 'transparent',
  border: '1px solid rgba(0,240,255,0.28)',
  color: '#e5e7eb',
  fontSize: 26,
  cursor: 'pointer',
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.88
  u.pitch = 0.9
  u.lang = 'en-GB'
  // Try to find a UK male voice
  const voices = window.speechSynthesis.getVoices()
  const ukMale = voices.find(v => v.lang === 'en-GB' && !v.name.toLowerCase().includes('female'))
  if (ukMale) u.voice = ukMale
  window.speechSynthesis.speak(u)
}

const SCRIPT = [
  { t: 0,      key: 'greeting', text: "Hi, this is James from IT support. Am I speaking with you today?" },
  { t: 5000,   key: 'detect',   text: "We've detected your workstation is generating unusual network traffic — looks like a possible malware infection. I need to run a remote diagnostic." },
  { t: 12000,  key: 'mstsc',    text: "I just need you to press Windows+R, type 'mstsc', then read me the 9-digit code that appears. This gives our system secure read-only access." },
  { t: 20000,  key: 'ticket',   text: "It's completely standard procedure. Do not call back through the help desk queue — they'll just route you back to me and we'll lose the containment window. I can see ticket IT-2024-9981 if you want to verify." },
]

export default function DialerApp() {
  const activePoint = useGameStore(s => s.activePoint)
  const [phase, setPhase]             = useState<'ringing' | 'greeting' | 'active' | 'consequence' | 'succeeded' | 'declined'>('ringing')
  const [subtitle, setSubtitle]       = useState('')
  const [greetingReply, setGreetingReply] = useState<string | null>(null)
  const [choicesVisible, setChoicesVisible] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const completePoint = useGameStore(s => s.completePoint)
  const failAttempt   = useGameStore(s => s.failAttempt)
  const setSubtitleG  = useGameStore(s => s.setSubtitle)
  const exitToScene   = useGameStore(s => s.exitToScene)

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      useAudioStore.getState().stopLoop('phone_ring_landline')
      window.speechSynthesis?.cancel()
      activeTimers.forEach(clearTimeout)
    }
  }, [])

  if (activePoint !== 5) return null

  const scheduleScriptFrom = (offset: number) => {
    const afterGreeting = SCRIPT.slice(1)
    afterGreeting.forEach(line => {
      const t = setTimeout(() => {
        setSubtitle(line.text)
        setSubtitleG(line.text, 7500)
        speak(line.text)
        if (line.key === 'ticket') {
          const tChoice = setTimeout(() => setChoicesVisible(true), 6000)
          timers.current.push(tChoice)
        }
      }, line.t - offset)
      timers.current.push(t)
    })
  }

  const handleAnswer = () => {
    useAudioStore.getState().stopLoop('phone_ring_landline')
    useAudioStore.getState().playSound('ui_click')
    setPhase('greeting')
    speak(SCRIPT[0].text)
    setSubtitle(SCRIPT[0].text)
    setSubtitleG(SCRIPT[0].text, 5000)
  }

  const handleGreetingReply = (reply: string) => {
    setGreetingReply(reply)
    setPhase('active')
    if (reply === 'suspicious') {
      const hint = 'Good instinct — but they already have an answer for that.'
      setSubtitle(hint)
      setSubtitleG(hint, 3000)
      const t = setTimeout(() => scheduleScriptFrom(5000), 3200)
      timers.current.push(t)
    } else {
      scheduleScriptFrom(5000)
    }
  }

  const handleDecline = () => {
    useAudioStore.getState().stopLoop('phone_ring_landline')
    window.speechSynthesis?.cancel()
    setPhase('declined')
  }

  const handleProvideCode = () => {
    window.speechSynthesis?.cancel()
    timers.current.forEach(clearTimeout)
    failAttempt(5, 'provided_mstsc_code')
    setPhase('consequence')
  }

  const handleHangUp = () => {
    window.speechSynthesis?.cancel()
    timers.current.forEach(clearTimeout)
    useAudioStore.getState().playSound('ui_click')
    setPhase('succeeded')
    setTimeout(() => completePoint(5, 120), 1400)
  }

  const handleUnderstood = () => {
    exitToScene()
    useCameraStore.getState().restoreInitial()
  }

  // Ringing screen
  if (phase === 'ringing') {
    return (
      <div style={{ height: '100%', background: '#06080f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div className="phone-ring" style={{ fontSize: 52, marginBottom: 4 }}>📞</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, color: '#e5e7eb', letterSpacing: '0.06em' }}>IT HELPDESK — EXT 4471</div>
        <div style={{ ...mono, fontSize: 12, color: '#6c7280' }}>Internal Extension</div>
        <div style={{ ...mono, fontSize: 10, color: '#ffaa44', marginTop: 2 }}>Spoofed caller ID: internal labels can be faked</div>
        <div style={{ ...mono, fontSize: 10, color: '#ff6688' }}>Do not call back, says caller</div>
        <div style={{ ...mono, fontSize: 10, color: '#3a3f4a', marginTop: 4 }}>Incoming call...</div>
        <div style={{ display: 'flex', gap: 28, marginTop: 24 }}>
          <button onClick={handleDecline}
                  style={neutralRoundDecisionButton}>📵</button>
          <button onClick={handleAnswer}
                  style={neutralRoundDecisionButton}>📞</button>
        </div>
      </div>
    )
  }

  // Declined
  if (phase === 'declined') {
    return (
      <div style={{ height: '100%', background: '#06080f', display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 13, color: '#6c7280' }}>
        Call declined
      </div>
    )
  }

  // Consequence
  if (phase === 'consequence') {
    return (
      <div style={{ height: '100%', background: 'rgba(18,2,6,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px' }}>
        <div className="pts-flash5" style={{ ...mono, fontSize: 22, color: '#ff3355', fontWeight: 700, marginBottom: 20, letterSpacing: '0.1em' }}>
          −10 PTS
        </div>
        <div style={{ ...mono, fontSize: 10, color: '#ff335588', letterSpacing: '0.18em', marginBottom: 14 }}>
          SECURITY FAILURE
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#ff8899', lineHeight: 1.8, textAlign: 'center', maxWidth: 340, marginBottom: 24 }}>
          You gave an attacker Remote Desktop access to your PC.
          <br /><br />
          The Windows+R → mstsc trick is a real vishing technique used against thousands of victims. IT departments never need you to read codes over the phone.
          <br /><br />
          The spoofed extension and ticket number "IT-2024-9981" sounded convincing — and the pressure not to call back officially was the tell.
        </div>
        <button onClick={handleUnderstood} style={{
          padding: '9px 28px', background: 'transparent', border: '1px solid #ff3355',
          color: '#ff6688', ...mono, fontSize: 11, cursor: 'pointer', borderRadius: 4,
        }}>RETURN TO OFFICE</button>
      </div>
    )
  }

  // Succeeded
  if (phase === 'succeeded') {
    return (
      <div style={{ height: '100%', background: '#06080f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ ...mono, fontSize: 13, color: '#00ff88', textAlign: 'center', lineHeight: 1.9 }}>
          ✓ Correct! +120 pts<br />
          <span style={{ fontSize: 11, color: '#00cc66' }}>
            Red flags: unexpected call asking for remote access,<br />
            pressure to act fast, requesting you to run commands,<br />
            and telling you not to call back officially.<br />
            Always hang up and call IT back on a number YOU look up.
          </span>
        </div>
      </div>
    )
  }

  // Active call
  return (
    <div style={{ height: '100%', background: '#06080f', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }}>
        <div style={{ fontSize: 44 }}>👤</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: '#e5e7eb' }}>IT HELPDESK — EXT 4471</div>
        <div style={{ ...mono, fontSize: 10, color: '#ffaa44' }}>Caller ID may be spoofed</div>
        <div style={{ ...mono, fontSize: 11, color: '#00ff88' }}>● Connected</div>

        {subtitle && (
          <div style={{ maxWidth: 280, padding: '12px 16px', background: '#0d1320', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9ca3af', lineHeight: 1.65, textAlign: 'center', marginTop: 10, border: '1px solid #1a1f2a' }}>
            "{subtitle}"
          </div>
        )}

        {/* Greeting response buttons */}
        {phase === 'greeting' && !greetingReply && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => handleGreetingReply('yes')} style={{
              padding: '8px 20px', borderRadius: 20, background: '#0d1320',
              border: '1px solid #3a3f4a', color: '#e5e7eb',
              fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: 'pointer',
            }}>Yes</button>
            <button onClick={() => handleGreetingReply('suspicious')} style={{
              padding: '8px 20px', borderRadius: 20, background: '#0d1320',
              border: '1px solid #3a3f4a', color: '#e5e7eb',
              fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: 'pointer',
            }}>Who is this?</button>
          </div>
        )}
      </div>

      {/* Final choices — appear after full script plays */}
      {choicesVisible && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid #1a1f2a', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={handleProvideCode} style={neutralDecisionButton}>
            Read Out The Code
          </button>
          <button onClick={handleHangUp} style={neutralDecisionButton}>
            Hang Up &amp; Report to IT
          </button>
        </div>
      )}

      {/* Hang up always available */}
      {!choicesVisible && phase === 'active' && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid #1a1f2a', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <button onClick={handleHangUp} style={{ ...neutralRoundDecisionButton, width: 58, height: 58, fontSize: 22 }}>📵</button>
        </div>
      )}
    </div>
  )
}
