import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

// ── Base Card ────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  bordered?: boolean
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
}

export function Card({
  children,
  bordered = true,
  hoverable = false,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-[var(--surface)]',
        bordered  && 'border border-[var(--border)]',
        hoverable && 'cursor-pointer hover:shadow-card-md hover:border-[var(--border-strong)] transition-all duration-[180ms]',
        !hoverable && 'shadow-card',
        paddingClasses[padding],
        className,
      )}
      style={{ boxShadow: hoverable ? undefined : 'var(--shadow-card)' }}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Card Header ──────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, icon, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]', className)}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-[var(--text-muted)] flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0 ml-3">{action}</div>}
    </div>
  )
}

// ── Card Section — internal section divider ──────────────────────────────────

export function CardSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-[var(--border)]', className)}>
      {children}
    </div>
  )
}

// ── Panel — bordered card with header (most common pattern) ─────────────────

interface PanelProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({ title, subtitle, icon, action, children, className, bodyClassName }: PanelProps) {
  return (
    <div
      className={cn('rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden', className)}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <CardHeader title={title} subtitle={subtitle} icon={icon} action={action} />
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
