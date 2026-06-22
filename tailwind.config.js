/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      colors: {
        // ── Semantic CSS-variable tokens (auto-switch light/dark) ─────────
        // Use: bg-t-bg, text-t-text, border-t-border, etc.
        t: {
          bg:              'var(--background)',
          'bg-subtle':     'var(--background-subtle)',
          sidebar:         'var(--sidebar)',
          topbar:          'var(--topbar)',
          card:            'var(--surface)',
          surface:         'var(--surface-muted)',
          'card-hover':    'var(--surface-hover)',
          'surface-elev':  'var(--surface-elevated)',
          border:          'var(--border)',
          'border-strong': 'var(--border-strong)',
          text:            'var(--text-primary)',
          secondary:       'var(--text-secondary)',
          muted:           'var(--text-muted)',
          disabled:        'var(--text-disabled)',
          accent:          'var(--brand)',
          'accent-hover':  'var(--brand-dark)',
        },

        // ── Brand palette: Cobre Queimado ─────────────────────────────────
        brand: {
          50:  '#FEF3E7',
          100: '#FCE1C2',
          200: '#F8C28A',
          300: '#F3994A',
          400: '#EC7821',
          500: '#D4601A',  // PRIMARY – Cobre Queimado
          600: '#B04E10',
          700: '#8C3C0C',
          800: '#642A08',
          900: '#3C1804',
          950: '#1E0C02',
        },

        // ── Backward-compat alias (keeps old accent classes working) ──────
        accent: {
          DEFAULT: '#D4601A',
          hover:   '#B04E10',
        },

        // ── Semantic status colors ────────────────────────────────────────
        success: '#1A6B35',
        danger:  '#A82828',
        warning: '#8A5200',
        info:    '#1A4E8C',
        violet:  '#5B21B6',
      },

      boxShadow: {
        'xs':           '0 1px 2px 0 rgba(20,15,5,0.04)',
        'sm':           '0 1px 3px 0 rgba(20,15,5,0.07), 0 1px 2px -1px rgba(20,15,5,0.05)',
        'card':         '0 1px 2px 0 rgba(20,15,5,0.06), 0 1px 3px 0 rgba(20,15,5,0.04)',
        'card-md':      '0 2px 8px 0 rgba(20,15,5,0.08), 0 1px 3px 0 rgba(20,15,5,0.04)',
        'card-hover':   '0 4px 12px 0 rgba(20,15,5,0.10)',
        'dropdown':     '0 4px 16px -2px rgba(20,15,5,0.12), 0 2px 6px -2px rgba(20,15,5,0.08)',
        'modal':        '0 20px 60px -8px rgba(20,15,5,0.20), 0 8px 24px -4px rgba(20,15,5,0.12)',
        'focus':        '0 0 0 3px rgba(212,96,26,0.20)',
        'focus-danger': '0 0 0 3px rgba(168,40,40,0.20)',
      },

      borderRadius: {
        'xs':     '2px',
        'sm':     '4px',
        'DEFAULT':'6px',
        'md':     '8px',
        'lg':     '10px',
        'xl':     '12px',
        '2xl':    '16px',
        '3xl':    '24px',
        'full':   '9999px',
      },

      animation: {
        'fade-in':    'fadeIn 0.14s ease-out',
        'slide-up':   'slideUp 0.18s ease-out',
        'slide-down': 'slideDown 0.18s ease-out',
        'scale-in':   'scaleIn 0.12s ease-out',
      },

      keyframes: {
        fadeIn:    { '0%': { opacity: '0' },                               '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-6px)' },'100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.97)' },     '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
