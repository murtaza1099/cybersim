import { Html } from '@react-three/drei'

export function AxisGrid({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <group>
      <gridHelper args={[20, 40, '#1a2030', '#0d1520']} position={[0, 0.01, 0]} />
      {Array.from({ length: 21 }, (_, i) => i - 10).map(n => (
        <group key={n}>
          <Html position={[n, 0.03, -10]} center style={{ color: '#4a6080', font: '8px monospace', pointerEvents: 'none' }}>{n}</Html>
          <Html position={[-10, 0.03, n]} center style={{ color: '#4a6080', font: '8px monospace', pointerEvents: 'none' }}>{n}</Html>
        </group>
      ))}
    </group>
  )
}
