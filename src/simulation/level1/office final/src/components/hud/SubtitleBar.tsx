import { useGameStore } from '../../stores/gameStore'

export default function SubtitleBar() {
  const text = useGameStore(s => s.subtitleText)

  if (!text) return null

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 180, maxWidth: 640, width: 'calc(100vw - 80px)',
      padding: '12px 20px', borderRadius: 6,
      background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(8px)',
      borderLeft: '3px solid #00f0ff',
      fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: '#e5e7eb', lineHeight: 1.5,
      animation: 'slideUp 0.2s ease, fadeOut 0.2s ease 3.8s forwards',
    }}>
      {text}
    </div>
  )
}
