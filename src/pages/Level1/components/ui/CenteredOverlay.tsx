import type { ReactNode } from 'react'

type OverlaySize = 'standard' | 'phone'

interface Props {
  children: ReactNode
  size?: OverlaySize
  className?: string
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>
}

export default function CenteredOverlay({ children, size = 'standard', className, onPointerDown }: Props) {
  const panelSize: React.CSSProperties = size === 'phone'
    ? { width: 'min(390px, 92vw)', height: 'min(720px, 86vh)' }
    : { width: 'min(920px, 92vw)', maxHeight: '88vh' }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 160,
        background: 'rgba(0,0,0,.58)',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
      }}
      onPointerDown={onPointerDown}
    >
      <div
        className={className}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          ...panelSize,
          overflow: 'auto',
          borderRadius: 18,
          boxShadow: '0 24px 80px rgba(0,0,0,.55)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
