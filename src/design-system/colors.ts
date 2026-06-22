// GaragePro Design System — Color Palette
// All values are static HEX/RGB constants for use in JS/TS contexts (charts, dynamic styles).
// For Tailwind classes, use the `brand-*` and `t-*` utilities instead.

export const brand = {
  50:  '#FEF3E7',
  100: '#FCE1C2',
  200: '#F8C28A',
  300: '#F3994A',
  400: '#EC7821',
  500: '#D4601A',  // PRIMARY — Cobre Queimado (Burned Copper)
  600: '#B04E10',  // Pressed / dark variant
  700: '#8C3C0C',
  800: '#642A08',
  900: '#3C1804',
  950: '#1E0C02',
} as const

// Warm grays — slightly amber-tinted, not the blue-gray of default Tailwind
export const neutral = {
  50:  '#FAFAF8',
  100: '#F4F2EF',  // Page background
  200: '#EDEAE5',
  300: '#E2DDD7',  // Default border
  400: '#C8C2BB',  // Strong border
  500: '#8C8479',  // Muted text
  600: '#5C5549',  // Secondary text
  700: '#3C3530',
  800: '#2A2520',
  900: '#1A1510',  // Primary text
  950: '#0E0C0A',
} as const

export const semantic = {
  success: {
    DEFAULT: '#1A6B35',
    subtle:  '#EBF7EE',
    border:  '#A8DEBA',
    text:    '#1A5C31',
  },
  warning: {
    DEFAULT: '#8A5200',
    subtle:  '#FEF8E7',
    border:  '#F0D080',
    text:    '#784400',
  },
  danger: {
    DEFAULT: '#A82828',
    subtle:  '#FEF0F0',
    border:  '#F0B0B0',
    text:    '#882828',
  },
  info: {
    DEFAULT: '#1A4E8C',
    subtle:  '#EBF2FF',
    border:  '#A8C8F0',
    text:    '#1A4080',
  },
} as const

// OS Status — each with text/bg/border for light mode
// Dark mode variants are defined via CSS variables in globals.css
export const osStatus = {
  AGENDADO: {
    text: '#2E4A6A', bg: '#F0F4F9', border: '#C0D0E4',
    dot: '#6890B8', label: 'Agendado', icon: 'CalendarClock',
  },
  EM_ANALISE: {
    text: '#1A4E8C', bg: '#EBF2FF', border: '#A8C8F0',
    dot: '#4888D8', label: 'Em Análise', icon: 'ScanSearch',
  },
  AGUARDANDO_APROVACAO: {
    text: '#784400', bg: '#FEF8E7', border: '#F0D080',
    dot: '#C88020', label: 'Aguard. Aprovação', icon: 'Clock',
  },
  EM_ANDAMENTO: {
    text: '#0A5A54', bg: '#E8FAF8', border: '#90E0D8',
    dot: '#1AA89C', label: 'Em Andamento', icon: 'Wrench',
  },
  CONCLUIDO: {
    text: '#1A5C31', bg: '#EBF7EE', border: '#A0D8B4',
    dot: '#28A850', label: 'Concluído', icon: 'CheckCircle2',
  },
  ENTREGUE: {
    text: '#484E58', bg: '#F2F3F5', border: '#C8CAD0',
    dot: '#888E98', label: 'Entregue', icon: 'PackageCheck',
  },
  CANCELADO: {
    text: '#882828', bg: '#FEF0F0', border: '#F0B8B8',
    dot: '#D05050', label: 'Cancelado', icon: 'XCircle',
  },
  ATRASADO: {
    text: '#7A0E0E', bg: '#FEE8E8', border: '#F0A0A0',
    dot: '#E03030', label: 'Atrasado', icon: 'AlertTriangle',
  },
} as const

// OS Type — visual treatment for service type badges
export const osType = {
  DIAGNOSTICO: { text: '#1A4E8C', bg: '#EBF2FF', border: '#A8C8F0', label: 'Diagnóstico'   },
  REVISAO:     { text: '#4A2E8C', bg: '#F3F0FA', border: '#C8B8F0', label: 'Revisão'        },
  TROCA_PECA:  { text: '#8A3800', bg: '#FEF3E7', border: '#F4C090', label: 'Troca de Peça'  },
  GARANTIA:    { text: '#0A4A3A', bg: '#E8F8F5', border: '#80D8C4', label: 'Garantia'       },
  RETORNO:     { text: '#484E58', bg: '#F2F3F5', border: '#C8CAD0', label: 'Retorno'        },
  ORCAMENTO:   { text: '#704800', bg: '#FDF8EC', border: '#F0D890', label: 'Orçamento'      },
} as const

export const priority = {
  BAIXA:   { color: '#1A6B35', bg: 'rgba(26,107,53,0.10)',  label: 'Baixa',   weight: 1 },
  MEDIA:   { color: '#8A5200', bg: 'rgba(138,82,0,0.10)',   label: 'Média',   weight: 2 },
  ALTA:    { color: '#D4601A', bg: 'rgba(212,96,26,0.10)',  label: 'Alta',    weight: 3 },
  URGENTE: { color: '#A82828', bg: 'rgba(168,40,40,0.10)', label: 'Urgente', weight: 4 },
} as const
