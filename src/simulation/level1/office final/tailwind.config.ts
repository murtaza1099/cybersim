import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans:     ['DM Sans', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
      },
      colors: {
        cyber: {
          bg:      '#050810',
          surface: '#0a0e14',
          cyan:    '#00f0ff',
          green:   '#00ff88',
          red:     '#ff3355',
          dim:     '#3a3f4a',
          border:  '#1a1f2a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
