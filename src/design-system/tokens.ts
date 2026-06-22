// GaragePro Design System — Design Tokens
// Use these as reference when building components.
// Tailwind utilities cover most cases; use these for inline styles or documentation.

export const spacing = {
  0.5: '2px',   // micro: icon + text gap inside badge
  1:   '4px',   // tight: inline elements, icon gaps
  1.5: '6px',   // small: compact rows, sidebar item padding
  2:   '8px',   // base: default spacing within components
  2.5: '10px',  // medium: form fields, inputs
  3:   '12px',  // standard: sidebar padding, card internal padding
  4:   '16px',  // content: section gap, card padding
  5:   '20px',  // section: page padding (small screen)
  6:   '24px',  // panel: between major card sections
  8:   '32px',  // large: between panels/card groups
  10:  '40px',  // xl: major section dividers
  12:  '48px',  // xxl: page-level top padding
  16:  '64px',  // hero: hero sections, large empty states
} as const

export const radius = {
  none:    '0px',     // Rule lines, table cells, code blocks
  xs:      '2px',     // Tags, inline chips
  sm:      '4px',     // Status badges, tooltips, compact chips
  DEFAULT: '6px',     // Inputs, standard buttons, most cards
  md:      '8px',     // Panels, larger cards, dropdowns
  lg:      '10px',    // Modal frames, feature cards
  xl:      '12px',    // Overlays, prominent cards
  '2xl':   '16px',    // Large feature cards, avatars
  full:    '9999px',  // Progress bars only — avoid for buttons
} as const

export const shadows = {
  xs:        '0 1px 2px 0 rgba(20,15,5,0.04)',
  sm:        '0 1px 3px 0 rgba(20,15,5,0.07), 0 1px 2px -1px rgba(20,15,5,0.05)',
  card:      '0 1px 2px 0 rgba(20,15,5,0.06), 0 1px 3px 0 rgba(20,15,5,0.04)',
  cardMd:    '0 2px 8px 0 rgba(20,15,5,0.08), 0 1px 3px 0 rgba(20,15,5,0.04)',
  cardHover: '0 4px 12px 0 rgba(20,15,5,0.10)',
  dropdown:  '0 4px 16px -2px rgba(20,15,5,0.12), 0 2px 6px -2px rgba(20,15,5,0.08)',
  modal:     '0 20px 60px -8px rgba(20,15,5,0.20), 0 8px 24px -4px rgba(20,15,5,0.12)',
  focus:     '0 0 0 3px rgba(212,96,26,0.20)',
} as const

export const zIndex = {
  base:    0,
  sidebar: 20,
  header:  30,
  dropdown:40,
  modal:   50,
  toast:   60,
  command: 70,
} as const

// Animation durations in ms — keep interactions fast and purposeful
export const animation = {
  fast:    150,  // Icon swaps, color transitions
  default: 180,  // Most transitions (hover, focus)
  slow:    220,  // Sidebar collapse, panel toggles
  easing:  'ease-out',
} as const

export const typography = {
  fontSans:  '"Plus Jakarta Sans", system-ui, sans-serif',
  fontMono:  '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace',

  scale: {
    '2xs':  { size: '10px', lineHeight: '1.3', use: 'Labels, badge text, table meta' },
    xs:     { size: '11px', lineHeight: '1.4', use: 'Secondary labels, captions, sidebar group names' },
    sm:     { size: '12px', lineHeight: '1.5', use: 'Table content, body small, card secondary text' },
    base:   { size: '13px', lineHeight: '1.5', use: 'Default body, form fields, list items' },
    md:     { size: '14px', lineHeight: '1.5', use: 'Emphasized body, panel titles' },
    lg:     { size: '16px', lineHeight: '1.4', use: 'Section headings, card titles' },
    xl:     { size: '18px', lineHeight: '1.35', use: 'Page section headings' },
    '2xl':  { size: '22px', lineHeight: '1.25', use: 'Metric values, KPI numbers' },
    '3xl':  { size: '28px', lineHeight: '1.2',  use: 'Hero metric values' },
  },

  weight: {
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },
} as const
