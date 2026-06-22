import type { ServiceOrderPriority } from '../../types'
import { PRIORITY_MAP } from '../../design-system/status-map'
import { cn } from '../../lib/utils'

interface PriorityChipProps {
  priority: ServiceOrderPriority
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function PriorityChip({
  priority,
  size = 'sm',
  showLabel = true,
  className,
}: PriorityChipProps) {
  const cfg = PRIORITY_MAP[priority]

  const sizeClasses = {
    xs: 'text-[9px] px-1 py-0.5 gap-0.5 rounded-[2px]',
    sm: 'text-[10px] px-1.5 py-0.5 gap-1 rounded-sm',
    md: 'text-[11px] px-2 py-0.5 gap-1 rounded',
  }

  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold uppercase tracking-wide leading-tight',
        sizeClasses[size],
        className,
      )}
      style={{
        color:           cfg.color,
        backgroundColor: cfg.bgColor,
      }}
      title={`Prioridade: ${cfg.label}`}
    >
      <span
        className={cn('rounded-full flex-shrink-0', dotSize[size])}
        style={{ backgroundColor: cfg.color }}
      />
      {showLabel && cfg.label}
    </span>
  )
}

// ── Priority Bar — vertical left border indicator (used in OS list rows) ─────

interface PriorityBarProps {
  priority: ServiceOrderPriority
  className?: string
}

export function PriorityBar({ priority, className }: PriorityBarProps) {
  const cfg = PRIORITY_MAP[priority]
  return (
    <span
      className={cn('block w-[3px] rounded-full flex-shrink-0', className)}
      style={{ backgroundColor: cfg.color }}
      title={`Prioridade ${cfg.label}`}
    />
  )
}
