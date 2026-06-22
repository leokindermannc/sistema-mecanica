import type { ReactNode, CSSProperties } from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'muted' | 'brand'
type BadgeSize = 'sm' | 'md'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-secondary)]',
  muted:   'bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-muted)]',
  brand:   'bg-[var(--brand-muted)] border border-[var(--brand)]/25 text-[var(--brand)]',
  success: 'bg-[var(--success-subtle)] border border-[var(--success-border)] text-[var(--success)]',
  warning: 'bg-[var(--warning-subtle)] border border-[var(--warning-border)] text-[var(--warning)]',
  danger:  'bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)]',
  info:    'bg-[var(--info-subtle)] border border-[var(--info-border)] text-[var(--info)]',
  purple:  'bg-violet/[0.08] border border-violet/25 text-violet',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded-sm',
  md: 'text-[11px] px-2 py-0.5 rounded',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  style?: CSSProperties
  dot?: boolean
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  style,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium leading-tight tracking-wide uppercase',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      style={style}
    >
      {dot && (
        <span className="w-1 h-1 rounded-full bg-current opacity-75 flex-shrink-0" />
      )}
      {children}
    </span>
  )
}

// Custom-colored badge — for one-off status colors not covered by variants
interface StatusBadgeProps {
  label: string
  cssText?: string      // CSS var reference, e.g. 'var(--os-andamento-text)'
  cssBg?: string
  cssBorder?: string
  color?: string        // fallback static color
  bgColor?: string
  borderColor?: string
  size?: BadgeSize
  dot?: boolean
  className?: string
}

export function StatusBadge({
  label,
  cssText,
  cssBg,
  cssBorder,
  color,
  bgColor,
  borderColor,
  size = 'sm',
  dot,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium leading-tight tracking-wide uppercase border',
        sizeClasses[size],
        className,
      )}
      style={{
        color:           cssText   ?? color,
        backgroundColor: cssBg    ?? bgColor,
        borderColor:     cssBorder ?? borderColor ?? 'transparent',
      }}
    >
      {dot && (
        <span className="w-1 h-1 rounded-full bg-current opacity-80 flex-shrink-0" />
      )}
      {label}
    </span>
  )
}
