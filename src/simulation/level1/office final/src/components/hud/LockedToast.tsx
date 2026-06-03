import { useGameStore } from '../../stores/gameStore'

if (typeof document !== 'undefined' && !document.getElementById('lt-kf')) {
  const s = document.createElement('style')
  s.id = 'lt-kf'
  s.textContent = `
    @keyframes slideUp   { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
    @keyframes fadeOut   { from { opacity:1; } to { opacity:0; } }
    .lt-in  { animation: slideUp 0.25s ease forwards; }
    .lt-out { animation: fadeOut 0.3s ease 2.2s forwards; }
  `
  document.head.appendChild(s)
}

export default function LockedToast() {
  const visible        = useGameStore(s => s.lockedToastVisible)
  const currentPointId = useGameStore(s => s.currentPointId)

  if (!visible) return null

  return (
    <div className="lt-in lt-out" style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, padding: '10px 20px', borderRadius: 6,
      background: '#1a0814', border: '1px solid #ff3355',
      fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#ff3355',
      whiteSpace: 'nowrap',
    }}>
      [ LOCKED ] Complete objective {currentPointId} first
    </div>
  )
}
