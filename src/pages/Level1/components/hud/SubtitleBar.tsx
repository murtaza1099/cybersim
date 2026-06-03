import { useGameStore } from '../../stores/gameStore'
import { colors, fonts } from '../../styles/theme'

// Shared toast keyframes (previously injected by LockedToast, which is now silent).
// SubtitleBar and SessionResumeToast both rely on `slideUp` / `fadeOut`.
if (typeof document !== 'undefined' && !document.getElementById('toast-kf')) {
  const s = document.createElement('style')
  s.id = 'toast-kf'
  s.textContent = `
    @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
    @keyframes fadeOut { from { opacity:1; } to { opacity:0; } }
  `
  document.head.appendChild(s)
}

export default function SubtitleBar() {
  const text = useGameStore(s => s.subtitleText)

  if (!text) return null

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 180, maxWidth: 640, width: 'calc(100vw - 80px)',
      padding: '12px 20px', borderRadius: 6,
      background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(8px)',
      borderLeft: `3px solid ${colors.cyan}`,
      fontFamily: fonts.mono, fontSize: 15, color: '#e5e7eb', lineHeight: 1.5,
      animation: 'slideUp 0.2s ease, fadeOut 0.2s ease 3.8s forwards',
    }}>
      {text}
    </div>
  )
}
