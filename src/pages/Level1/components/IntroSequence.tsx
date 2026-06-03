import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useAudioStore } from '../stores/audioStore'
import { colors, fonts } from '../styles/theme'

// ─── One-time keyframes / hover styles ───────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('intro-kf')) {
  const s = document.createElement('style')
  s.id = 'intro-kf'
  s.textContent = `
    @keyframes introCaretBlink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
    @keyframes introBtnIn      { from { opacity: 0; } to { opacity: 1; } }
    @keyframes introDividerIn  { from { opacity: 0; transform: scaleX(0.4); } to { opacity: 1; transform: scaleX(1); } }
    .intro-caret      { display:inline-block; width:7px; margin-left:1px; color:${colors.cyan}; animation: introCaretBlink 1s steps(1) infinite; }
    .intro-begin-btn  { animation: introBtnIn 500ms ease forwards; transition: background 200ms ease, box-shadow 200ms ease; }
    .intro-begin-btn:hover { background: rgba(0,240,255,0.1) !important; box-shadow: 0 0 30px rgba(0,240,255,0.4) !important; }
    .intro-divider    { animation: introDividerIn 500ms ease forwards; transform-origin: left center; }
    .intro-subline    { animation: introBtnIn 400ms ease forwards; }
    .intro-skip:hover { color: ${colors.textDim} !important; }
  `
  document.head.appendChild(s)
}

// 20ms per character — typing speed per spec.
const CHAR_MS = 20

interface Block {
  i: number
  text: string
  pauseAfter: number
  style: React.CSSProperties
}

interface Props {
  onComplete: () => void
}

export default function IntroSequence({ onComplete }: Props) {
  // ── Personalisation: pull the signed-in employee straight from the stores ──
  const userId   = useAuthStore(s => s.userId)
  const orgId    = useAuthStore(s => s.orgId)
  const userName = useAuthStore(s => s.userName) // full name, e.g. "Murtaza Hasnat"
  const employee = useDataStore(s => s.getEmployee(userId ?? ''))
  const org      = useDataStore(s => s.getOrg(orgId ?? ''))

  // Normalise raw store strings — never render them raw. First name is title-cased,
  // the org name has its first letter capitalised, and the surname is whatever
  // words follow the first.
  const rawFullName    = userName ?? employee?.name ?? 'Agent'
  const rawFirst       = rawFullName.split(' ')[0]
  const firstName      = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()
  const lastName       = rawFullName.split(' ').slice(1).join(' ')
  const designation    = employee?.jobRole ?? 'ANALYST'
  const rawOrg         = org?.name ?? 'your organisation'
  const orgNameDisplay = rawOrg.charAt(0).toUpperCase() + rawOrg.slice(1)

  // "MURTAZA HASNAT" (or just "MURTAZA" when there's no surname — no stray space).
  const agentName = [firstName, lastName].filter(Boolean).join(' ').toUpperCase()

  // ── The narration script, personalised. 13 blocks, exact copy / style / pauses. ──
  const script = useMemo<Block[]>(() => {
    const blocks: Omit<Block, 'i'>[] = [
      // BLOCK 1
      { text: '// CYBERSIM PLATFORM v2.1 — SESSION AUTHENTICATED',
        pauseAfter: 200,
        style: { fontFamily: fonts.mono, fontSize: 10, color: colors.border, letterSpacing: '0.18em' } },
      // BLOCK 2
      { text: `// AGENT: ${agentName} — ${designation.toUpperCase()}`,
        pauseAfter: 200,
        style: { fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, letterSpacing: '0.18em', marginTop: 6 } },
      // BLOCK 3
      { text: `// ORGANISATION: ${orgNameDisplay.toUpperCase()} // CLEARANCE: LEVEL 1`,
        pauseAfter: 600,
        style: { fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, letterSpacing: '0.18em', marginTop: 6 } },
      // BLOCK 4  (a divider fades in just before this — see render)
      { text: 'SIMULATION: LEVEL 1 — SECURITY FUNDAMENTALS',
        pauseAfter: 400,
        style: { fontFamily: fonts.display, fontSize: 12, color: colors.cyan, letterSpacing: '0.28em', fontWeight: 700 } },
      // BLOCK 5
      { text: `Good afternoon, ${firstName}.`,
        pauseAfter: 500,
        style: { fontFamily: fonts.body, fontSize: 18, color: colors.textPrimary, fontWeight: 500, lineHeight: 1.6, marginTop: 18 } },
      // BLOCK 6
      { text: `You have been assigned to ${orgNameDisplay} headquarters, Floor 3.`,
        pauseAfter: 200,
        style: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, lineHeight: 1.85, marginTop: 6 } },
      // BLOCK 7
      { text: 'Today is Tuesday. The time is 15:47. Most of your colleagues have already left.',
        pauseAfter: 400,
        style: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, lineHeight: 1.85 } },
      // BLOCK 8
      { text: 'The office looks quiet. It is not.',
        pauseAfter: 800,
        style: { fontFamily: fonts.body, fontSize: 15, color: '#c8d0de', lineHeight: 1.85, fontStyle: 'italic', marginTop: 12 } },
      // BLOCK 9
      { text: 'Eight threat actors are already inside this environment.',
        pauseAfter: 200,
        style: { fontFamily: fonts.body, fontSize: 14, color: '#ff8899', lineHeight: 1.85, marginTop: 12 } },
      // BLOCK 10
      { text: 'They are not waiting for a system vulnerability.',
        pauseAfter: 200,
        style: { fontFamily: fonts.body, fontSize: 14, color: '#ff8899', lineHeight: 1.85 } },
      // BLOCK 11
      { text: 'They are waiting for you to make one wrong decision.',
        pauseAfter: 900,
        style: { fontFamily: fonts.body, fontSize: 15, color: colors.red, lineHeight: 1.85, fontWeight: 600 } },
      // BLOCK 12
      { text: 'Phishing. Vishing. Pretexting. USB baiting. Social engineering in every form.',
        pauseAfter: 400,
        style: { fontFamily: fonts.body, fontSize: 13, color: colors.textDim, lineHeight: 1.85, marginTop: 12 } },
      // BLOCK 13
      { text: 'MISSION: Identify each threat. Respond correctly. Do not let them in.',
        pauseAfter: 1400,
        style: { fontFamily: fonts.display, fontSize: 12, color: colors.green, letterSpacing: '0.14em', fontWeight: 700, lineHeight: 1.6, marginTop: 16 } },
    ]
    return blocks.map((b, i) => ({ i, ...b }))
  }, [agentName, designation, firstName, orgNameDisplay])

  const [typed, setTyped]             = useState<Block[]>([])
  const [showButton, setShowButton]   = useState(false)
  const [showSubline, setShowSubline] = useState(false)
  const [fading, setFading]           = useState(false)
  const doneRef                       = useRef(false)

  // ── Typewriter engine: type each block char-by-char, pause, then the next ──
  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (!cancelled) fn() }, ms)
      timers.push(t)
    }

    // Soft mechanical-keyboard loop while the brief types out. Played directly on
    // the Howl (bypassing the ambient-starting unlock()) so the intro is audible
    // while ambient stays silent until the cinematic sweep begins.
    const audio = useAudioStore.getState()
    audio.init()
    const kb = audio.sounds.get('keyboard_typing')
    if (kb) {
      kb.volume(0.08)
      if (!kb.playing()) kb.play()
    }

    let lineIdx = 0
    const typeLine = () => {
      if (cancelled || lineIdx >= script.length) return
      const block = script[lineIdx]
      setTyped(prev => [...prev, { ...block, text: '' }])
      let charIdx = 0
      const typeChar = () => {
        if (cancelled) return
        charIdx++
        setTyped(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { ...block, text: block.text.slice(0, charIdx) }
          return copy
        })
        if (charIdx < block.text.length) {
          schedule(typeChar, CHAR_MS)
        } else {
          lineIdx++
          if (lineIdx < script.length) {
            schedule(typeLine, block.pauseAfter)
          } else {
            // After the final block + its 1400ms pause, fade in the BEGIN button.
            schedule(() => setShowButton(true), block.pauseAfter)
          }
        }
      }
      schedule(typeChar, CHAR_MS)
    }

    schedule(typeLine, 350)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      useAudioStore.getState().stopLoop('keyboard_typing')
    }
  }, [script])

  // The "// 8 threats active …" line fades in 300ms after the BEGIN button appears.
  useEffect(() => {
    if (!showButton) return
    const t = setTimeout(() => setShowSubline(true), 300)
    return () => clearTimeout(t)
  }, [showButton])

  const finish = (withFade: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    // Stop the typing loop the moment BEGIN is clicked. Ambient is intentionally
    // NOT started here — the cinematic sweep (App.tsx) owns the ambient fade-in.
    const audio = useAudioStore.getState()
    audio.stopLoop('keyboard_typing')
    // Audible click feedback on the Howl directly, without starting ambient.
    audio.sounds.get('ui_click')?.play()
    if (withFade) {
      setFading(true)
      setTimeout(onComplete, 600)
    } else {
      onComplete()
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: colors.bgBase,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 600ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Vignette — darkens the edges, sits behind the content */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Skip link */}
      <button
        className="intro-skip"
        onClick={() => finish(false)}
        style={{
          position: 'fixed', top: 22, right: 26, zIndex: 7,
          background: 'transparent', border: 'none',
          color: colors.border, fontFamily: fonts.mono, fontSize: 10,
          letterSpacing: '0.12em', cursor: 'pointer',
          transition: 'color 200ms ease',
        }}
      >
        [ SKIP INTRO ]
      </button>

      {/* Typed content */}
      <div style={{ position: 'relative', zIndex: 3, width: 'min(700px, 90vw)', padding: '0 24px' }}>
        {typed.map((l, idx) => {
          const isLast = idx === typed.length - 1
          return (
            <div key={idx}>
              {/* 1px cyan rule fades in between block 3 and block 4 */}
              {l.i === 3 && (
                <div className="intro-divider" style={{
                  height: 1, background: 'rgba(0,240,255,0.15)',
                  margin: '20px 0',
                }} />
              )}
              <div style={l.style}>
                {l.text}
                {isLast && !showButton && <span className="intro-caret">|</span>}
              </div>
            </div>
          )
        })}

        {showButton && (
          <>
            <button
              className="intro-begin-btn"
              onClick={() => finish(true)}
              style={{
                marginTop: 40,
                background: 'transparent',
                border: `2px solid ${colors.cyan}`,
                color: colors.cyan,
                fontFamily: fonts.display,
                fontSize: 13, fontWeight: 700, letterSpacing: '0.2em',
                padding: '14px 40px', borderRadius: 4, cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0,240,255,0.2)',
              }}
            >
              [ BEGIN MISSION → ]
            </button>

            {showSubline && (
              <div className="intro-subline" style={{
                marginTop: 14,
                fontFamily: fonts.mono, fontSize: 9, color: colors.border,
                letterSpacing: '0.12em',
              }}>
                // 8 threats active — 0 neutralised — simulation ready
              </div>
            )}
          </>
        )}
      </div>

      {/* CRT scanline overlay — sits above the content, never intercepts clicks */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,240,255,0.012) 3px, rgba(0,240,255,0.012) 4px)',
      }} />
    </div>
  )
}
