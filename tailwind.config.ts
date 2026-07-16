import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Core Palette ────────────────────────────────────────────
        background: '#F4F3EE',   // Warm bone/cream – primary page background
        surface:    '#E8E9E1',   // Subtle grey-green card surface
        overlay:    '#DDDDD5',   // Slightly deeper for nested surfaces / hover states
        border:     '#CECEC5',   // Hairline borders

        // ── Typography ──────────────────────────────────────────────
        charcoal:   '#1F1F1F',   // Primary text / solid CTA buttons
        secondary:  '#4A4A44',   // Secondary body text
        muted:      '#7A7871',   // Captions, labels, placeholders

        // ── Semantic Status Colors (desaturated to match industrial feel)
        critical:   '#8C3130',   // Deep muted red for critical severity
        warning:    '#8C6B2F',   // Warm amber for warnings
        info:       '#2F5C6E',   // Cool slate-blue for informational
        success:    '#3A6B48',   // Muted forest green for success/approved

        // ── Severity badge surfaces (lighter tints of semantic colours)
        'critical-surface': '#F0E4E4',
        'warning-surface':  '#F0EAE0',
        'info-surface':     '#E0EBF0',
        'success-surface':  '#E0EDE5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        pill: '9999px',
      },
      boxShadow: {
        // Deliberately flat – no heavy elevations
        subtle: '0 1px 3px 0 rgba(31,31,31,0.06)',
        card:   '0 2px 8px 0 rgba(31,31,31,0.08)',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
    },
  },
  plugins: [],
}

export default config
