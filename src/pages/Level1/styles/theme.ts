// Shared Level 1 theme constants. Mirrors the CSS custom properties in
// src/styles/tokens.css. Inline React.CSSProperties objects can't reliably use
// CSS var() across the React Three Fiber surfaces, so these typed JS constants
// are the source of truth for component inline styles.

export const colors = {
  cyan:        '#00f0ff',
  green:       '#00ff88',
  red:         '#ff3355',
  amber:       '#ffaa00',
  surface:     'rgba(8, 12, 20, 0.95)',
  surfaceDeep: 'rgba(6, 10, 18, 0.97)',
  border:      '#3a3f4a',
  textPrimary: '#e5e7eb',
  textMuted:   '#9ca3af',
  textDim:     '#6c7280',
  bgBase:      '#050810',
} as const

export const fonts = {
  display: "'Orbitron', sans-serif",
  mono:    "'JetBrains Mono', monospace",
  body:    "'DM Sans', sans-serif",
} as const
