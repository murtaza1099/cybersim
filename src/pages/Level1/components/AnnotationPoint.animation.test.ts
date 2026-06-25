import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('AnnotationPoint hotspot animation', () => {
  it('keeps the active hotspot pulse finite instead of vibrating forever', () => {
    const source = readFileSync('src/pages/Level1/components/AnnotationPoint.tsx', 'utf8')

    expect(source).toMatch(/glowPulseStrong 0\.55s ease-in-out 3/)
    expect(source).not.toMatch(/glowPulseStrong 1\.5s ease-in-out infinite/)
  })
})
