import type { InputHTMLAttributes, ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Base Input ───────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  iconRight?: ReactNode
}

export function Input({ label, hint, error, icon, iconRight, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[12px] font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-8 bg-[var(--surface)] border border-[var(--border)] rounded',
            'text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/60',
            'transition-colors duration-[150ms]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            icon       ? 'pl-8'  : 'pl-3',
            iconRight  ? 'pr-8'  : 'pr-3',
            error && 'border-[var(--danger)]/50 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)]/60',
            className,
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-2.5 text-[var(--text-muted)] pointer-events-none flex items-center">
            {iconRight}
          </span>
        )}
      </div>
      {hint  && !error && <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>}
      {error &&           <span className="text-[11px] text-[var(--danger)]">{error}</span>}
    </div>
  )
}

// ── Search Input — global search bar ────────────────────────────────────────

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  value?: string
}

export function SearchInput({ className, onClear, value, ...props }: SearchInputProps) {
  return (
    <div className="relative flex items-center group">
      <Search
        size={13}
        className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none group-focus-within:text-[var(--brand)] transition-colors"
      />
      <input
        type="text"
        value={value}
        className={cn(
          'h-8 bg-[var(--surface-muted)] border border-[var(--border)] rounded',
          'text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50',
          'focus:bg-[var(--surface)]',
          'pl-8 pr-8 transition-all duration-[180ms]',
          className,
        )}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

// ── Vehicle Plate Input ──────────────────────────────────────────────────────
// Formats input to match Mercosul pattern (ABC1D23) or old pattern (ABC-1234)

interface PlateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  onChange?: (value: string) => void
}

export function PlateInput({ label, error, onChange, className, value, ...props }: PlateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
    onChange?.(raw)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">{label}</label>
      )}
      <input
        value={value}
        onChange={handleChange}
        placeholder="ABC1D23"
        className={cn(
          'h-8 w-32 bg-[var(--surface)] border border-[var(--border)] rounded',
          'font-mono text-[14px] font-semibold tracking-[0.1em] text-[var(--text-primary)] uppercase',
          'placeholder:text-[var(--text-muted)] placeholder:tracking-normal placeholder:font-normal',
          'text-center',
          'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/60',
          'transition-colors duration-[150ms]',
          error && 'border-[var(--danger)]/50',
          className,
        )}
        {...props}
      />
      {error && <span className="text-[11px] text-[var(--danger)]">{error}</span>}
    </div>
  )
}

// ── Currency Input ───────────────────────────────────────────────────────────

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  onChange?: (value: number) => void
  value?: number
}

export function CurrencyInput({ label, error, onChange, value, className, ...props }: CurrencyInputProps) {
  const display = value != null
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : ''

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">{label}</label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-[13px] text-[var(--text-muted)] font-medium pointer-events-none">R$</span>
        <input
          type="text"
          value={display.replace('R$ ', '').replace('R$', '')}
          className={cn(
            'w-full h-8 bg-[var(--surface)] border border-[var(--border)] rounded',
            'text-[13px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/60',
            'transition-colors duration-[150ms]',
            'pl-8 pr-3',
            error && 'border-[var(--danger)]/50',
            className,
          )}
          {...props}
        />
      </div>
      {error && <span className="text-[11px] text-[var(--danger)]">{error}</span>}
    </div>
  )
}
