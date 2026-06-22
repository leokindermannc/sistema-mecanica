import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'brand'
  | 'garage'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  // Dark base for primary actions (works on all backgrounds)
  primary:
    'bg-[#1A1510] text-white hover:bg-[#0E0C0A] dark:bg-[var(--text-primary)] dark:text-[var(--background)] dark:hover:brightness-90 font-semibold shadow-xs',

  // Subtle bordered button for secondary actions
  secondary:
    'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] font-medium shadow-xs',

  // Outlined — just a border, transparent bg
  outline:
    'border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)] font-medium',

  // No background — ghost
  ghost:
    'text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[var(--text-primary)]',

  // Destructive actions
  destructive:
    'bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)] hover:bg-red-100 dark:hover:bg-red-900/20 font-medium',

  // Warnings (e.g., "archive", "overwrite")
  warning:
    'bg-[var(--warning-subtle)] border border-[var(--warning-border)] text-[var(--warning)] hover:bg-amber-100 dark:hover:bg-amber-900/20 font-medium',

  // Confirm positive actions
  success:
    'bg-[var(--success-subtle)] border border-[var(--success-border)] text-[var(--success)] hover:bg-green-100 dark:hover:bg-green-900/20 font-medium',

  // Brand color — use for "Nova OS" and other primary CTAs
  brand:
    'bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] font-semibold shadow-xs',

  // Garage style — same as brand but slightly more prominent
  garage:
    'bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] font-bold shadow-sm ring-1 ring-[var(--brand-dark)]/30',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs:   'h-6 px-2 text-[11px] rounded-sm gap-1',
  sm:   'h-7 px-2.5 text-[12px] rounded gap-1.5',
  md:   'h-8 px-3 text-[13px] rounded gap-2',
  lg:   'h-9 px-4 text-[14px] rounded-md gap-2',
  icon: 'h-8 w-8 rounded',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-[150ms]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0 flex items-center">{icon}</span>
      ) : null}
      {size !== 'icon' && children}
      {iconRight && <span className="flex-shrink-0 flex items-center">{iconRight}</span>}
    </button>
  )
}

// Convenience: icon-only button
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: ButtonVariant
  children: ReactNode
  'aria-label': string
}

const iconSizeMap = { xs: 'w-6 h-6 rounded-sm', sm: 'w-7 h-7 rounded', md: 'w-8 h-8 rounded', lg: 'w-9 h-9 rounded-md' }

export function IconButton({
  size = 'md',
  variant = 'ghost',
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-[150ms]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        iconSizeMap[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
