import type { ServiceOrderStatus, ServiceOrderType } from '../../types'
import { OS_STATUS_MAP, OS_TYPE_MAP } from '../../design-system/status-map'
import { cn } from '../../lib/utils'

// ── OS Status Badge ──────────────────────────────────────────────────────────

interface OsStatusBadgeProps {
  status: ServiceOrderStatus
  size?: 'sm' | 'md'
  dot?: boolean
  compact?: boolean   // show abbreviated label
  className?: string
}

export function OsStatusBadge({
  status,
  size = 'sm',
  dot = true,
  compact = false,
  className,
}: OsStatusBadgeProps) {
  const cfg = OS_STATUS_MAP[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold leading-tight tracking-wide uppercase border',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5 rounded-sm' : 'text-[11px] px-2 py-1 rounded',
        className,
      )}
      style={{
        color:           cfg.cssText,
        backgroundColor: cfg.cssBg,
        borderColor:     cfg.cssBorder,
      }}
      title={cfg.description}
    >
      {dot && (
        <span
          className="rounded-full flex-shrink-0"
          style={{
            width:           size === 'sm' ? '5px' : '6px',
            height:          size === 'sm' ? '5px' : '6px',
            backgroundColor: cfg.dot,
          }}
        />
      )}
      {compact ? cfg.labelShort : cfg.label}
    </span>
  )
}

// ── OS Overdue Indicator — for atrasadas (not a full status in the enum) ─────

interface OsOverdueBadgeProps {
  hoursLate: number
  size?: 'sm' | 'md'
  className?: string
}

export function OsOverdueBadge({ hoursLate, size = 'sm', className }: OsOverdueBadgeProps) {
  const days  = Math.floor(hoursLate / 24)
  const label = days > 0 ? `${days}d atrasado` : `${hoursLate}h atrasado`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold leading-tight tracking-wide uppercase border',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5 rounded-sm' : 'text-[11px] px-2 py-1 rounded',
        className,
      )}
      style={{
        color:           'var(--os-atrasado-text)',
        backgroundColor: 'var(--os-atrasado-bg)',
        borderColor:     'var(--os-atrasado-border)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--os-atrasado-text)] flex-shrink-0" />
      {label}
    </span>
  )
}

// ── OS Type Badge ─────────────────────────────────────────────────────────────

interface OsTypeBadgeProps {
  type: ServiceOrderType
  size?: 'sm' | 'md'
  className?: string
}

export function OsTypeBadge({ type, size = 'sm', className }: OsTypeBadgeProps) {
  const cfg = OS_TYPE_MAP[type]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium leading-tight tracking-wide uppercase border',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5 rounded-sm' : 'text-[11px] px-2 py-1 rounded',
        className,
      )}
      style={{
        color:           cfg.cssText,
        backgroundColor: cfg.cssBg,
        borderColor:     cfg.cssBorder,
      }}
    >
      {cfg.label}
    </span>
  )
}
