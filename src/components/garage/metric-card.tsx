import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Metric Card ──────────────────────────────────────────────────────────────
// Three visual variants:
//   financial  — green accent, currency values
//   operational — neutral, count values
//   alert      — orange/red border accent, requires action

type MetricVariant = 'financial' | 'operational' | 'alert-warning' | 'alert-danger'
type TrendDir = 'up' | 'down' | 'neutral'

interface MetricCardProps {
  label: string
  value: ReactNode
  microcopy?: string
  icon: ReactNode
  variant?: MetricVariant
  trend?: TrendDir
  trendLabel?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  href?: string
}

const variantConfig: Record<MetricVariant, {
  border: string
  accent: string
  accentBg: string
  accentText: string
}> = {
  financial: {
    border:    'border-[var(--border)]',
    accent:    '#1A6B35',
    accentBg:  'rgba(26,107,53,0.08)',
    accentText:'var(--success)',
  },
  operational: {
    border:    'border-[var(--border)]',
    accent:    'var(--brand)',
    accentBg:  'var(--brand-muted)',
    accentText:'var(--brand)',
  },
  'alert-warning': {
    border:    'border-[var(--warning-border)]',
    accent:    'var(--warning)',
    accentBg:  'var(--warning-subtle)',
    accentText:'var(--warning)',
  },
  'alert-danger': {
    border:    'border-[var(--danger-border)]',
    accent:    'var(--danger)',
    accentBg:  'var(--danger-subtle)',
    accentText:'var(--danger)',
  },
}

export function MetricCard({
  label,
  value,
  microcopy,
  icon,
  variant = 'operational',
  trend,
  trendLabel,
  actionLabel,
  onAction,
  className,
}: MetricCardProps) {
  const cfg = variantConfig[variant]

  const isAlert = variant.startsWith('alert')

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up'
    ? (variant === 'financial' ? 'var(--success)' : 'var(--danger)')
    : trend === 'down'
      ? (variant === 'financial' ? 'var(--danger)' : 'var(--success)')
      : 'var(--text-muted)'

  return (
    <div
      className={cn(
        'relative rounded-md bg-[var(--surface)] border overflow-hidden',
        'transition-all duration-[180ms] hover:shadow-card-md group',
        onAction && 'cursor-pointer hover:border-[var(--border-strong)]',
        cfg.border,
        className,
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
      onClick={onAction}
      role={onAction ? 'button' : undefined}
      tabIndex={onAction ? 0 : undefined}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2.5px]"
        style={{ backgroundColor: cfg.accent }}
      />

      <div className="p-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Label */}
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.07em] mb-2 leading-none">
              {label}
            </p>

            {/* Value */}
            <div
              className={cn(
                'font-bold leading-none tracking-tight mb-1.5',
                typeof value === 'string' && value.includes('R$')
                  ? 'text-[20px] financial-value'
                  : 'text-[24px]',
              )}
              style={{ color: isAlert ? cfg.accentText : 'var(--text-primary)' }}
            >
              {value}
            </div>

            {/* Microcopy */}
            {microcopy && (
              <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                {microcopy}
              </p>
            )}
          </div>

          {/* Icon */}
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: cfg.accentBg, color: cfg.accentText }}
          >
            {icon}
          </div>
        </div>

        {/* Trend row */}
        {(trend || actionLabel) && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border)]">
            {trend && trendLabel && (
              <div className="flex items-center gap-1" style={{ color: trendColor }}>
                <TrendIcon size={11} />
                <span className="text-[10px] font-medium">{trendLabel}</span>
              </div>
            )}
            {actionLabel && onAction && (
              <button
                onClick={(e) => { e.stopPropagation(); onAction(); }}
                className="flex items-center gap-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors ml-auto"
              >
                {actionLabel} <ArrowRight size={10} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stat Pill — compact inline metric (used in header areas) ─────────────────

interface StatPillProps {
  label: string
  value: ReactNode
  color?: string
  className?: string
}

export function StatPill({ label, value, color, className }: StatPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface-muted)]',
        className,
      )}
    >
      {color && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      )}
      <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
      <span className="text-[13px] font-bold text-[var(--text-primary)] ml-1 tabular-nums">{value}</span>
    </div>
  )
}
