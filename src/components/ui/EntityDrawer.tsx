import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface EntityDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

const SIZE_MAP: Record<NonNullable<EntityDrawerProps['size']>, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[680px]',
  xl: 'max-w-[860px]',
}

export function EntityDrawer({
  open, onClose, title, subtitle, size = 'md', children, footer,
}: EntityDrawerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full',
          SIZE_MAP[size],
          'bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl',
        )}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="min-w-0 pr-3">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-[var(--border)] px-5 py-3 bg-[var(--surface)]">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
