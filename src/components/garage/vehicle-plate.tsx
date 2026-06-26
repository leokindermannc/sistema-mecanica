import { cn } from '../../lib/utils'

// ── Vehicle Plate Component ──────────────────────────────────────────────────
// Renders Brazilian license plates: Mercosul (ABC1D23) and old format (ABC-1234)

interface VehiclePlateProps {
  plate?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showFlag?: boolean    // Show Mercosul blue band (default false for compact use)
  interactive?: boolean // clickable style
}

function detectFormat(plate: string): 'mercosul' | 'old' | 'invalid' | 'empty' {
  const clean = plate.replace(/[-\s]/g, '').toUpperCase()
  if (!clean) return 'empty'
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(clean)) return 'mercosul'
  if (/^[A-Z]{3}\d{4}$/.test(clean)) return 'old'
  return 'invalid'
}

function formatPlate(plate: string, format: 'mercosul' | 'old' | 'invalid' | 'empty'): string {
  const clean = plate.replace(/[-\s]/g, '').toUpperCase()
  if (format === 'mercosul') return `${clean.slice(0,3)}-${clean.slice(3)}`
  if (format === 'old')      return `${clean.slice(0,3)}-${clean.slice(3)}`
  return clean
}

const sizeConfig = {
  xs: { text: 'text-[10px]',  h: 'h-5',   px: 'px-1.5', tracking: 'tracking-[0.06em]', radius: 'rounded-[2px]' },
  sm: { text: 'text-[11px]',  h: 'h-6',   px: 'px-2',   tracking: 'tracking-[0.07em]', radius: 'rounded-[3px]' },
  md: { text: 'text-[13px]',  h: 'h-7',   px: 'px-2.5', tracking: 'tracking-[0.08em]', radius: 'rounded'       },
  lg: { text: 'text-[16px]',  h: 'h-9',   px: 'px-3',   tracking: 'tracking-[0.09em]', radius: 'rounded-md'    },
}

export function VehiclePlate({
  plate = '',
  size = 'sm',
  className,
  interactive = false,
}: VehiclePlateProps) {
  const format    = detectFormat(plate)
  const formatted = format !== 'empty' && format !== 'invalid' ? formatPlate(plate, format) : plate || '---'
  const cfg       = sizeConfig[size]

  const isEmpty   = format === 'empty'
  const isInvalid = format === 'invalid'

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-semibold select-all border',
        cfg.text, cfg.h, cfg.px, cfg.tracking, cfg.radius,
        isEmpty
          ? 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-disabled)] border-dashed'
          : isInvalid
            ? 'bg-[var(--danger-subtle)] border-[var(--danger-border)] text-[var(--danger)]'
            : 'bg-[var(--surface)] border-[var(--border-strong)] text-[var(--text-primary)]',
        interactive && !isEmpty && !isInvalid && 'cursor-pointer hover:border-[var(--brand)]/50 hover:bg-[var(--brand-light)] transition-colors',
        className,
      )}
      title={isEmpty ? 'Placa não informada' : isInvalid ? 'Placa inválida' : `Placa: ${formatted}`}
    >
      {formatted}
    </span>
  )
}

// ── Plate Display — larger, more visual (for vehicle detail pages) ────────────

export function VehiclePlateDisplay({ plate = '', className }: { plate?: string; className?: string }) {
  const format    = detectFormat(plate)
  const formatted = format !== 'empty' && format !== 'invalid' ? formatPlate(plate, format) : '--- ----'
  const isMercosul = format === 'mercosul'

  return (
    <div
      className={cn(
        'inline-flex overflow-hidden rounded border-2 border-[var(--border-strong)]',
        'shadow-sm select-all',
        className,
      )}
    >
      {/* Mercosul blue band */}
      {isMercosul && (
        <div className="w-2.5 bg-[#003399] flex-shrink-0" />
      )}
      <div className="bg-white px-3 py-1.5 flex flex-col items-center justify-center min-w-[80px]">
        {isMercosul && (
          <span className="text-[8px] font-bold text-[#003399] tracking-[0.15em] uppercase leading-none mb-0.5">
            BRASIL
          </span>
        )}
        <span
          className="font-mono font-bold text-[18px] tracking-[0.12em] text-[#1A1510] leading-none"
        >
          {formatted}
        </span>
      </div>
    </div>
  )
}
