import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  separator?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  trigger?: React.ReactNode
  align?: 'left' | 'right'
}

export function ActionMenu({ items, trigger, align = 'right' }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={cn(
          'w-7 h-7 rounded flex items-center justify-center transition-colors',
          'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
          open && 'bg-[var(--surface-hover)] text-[var(--text-primary)]',
        )}
        aria-label="Mais ações"
        aria-expanded={open}
      >
        {trigger ?? <MoreHorizontal size={14} />}
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-1 z-[60] min-w-[180px]',
            'bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg',
            'py-1 overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 h-px bg-[var(--border)]" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false) }}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors text-left',
                  item.variant === 'danger'
                    ? 'text-[var(--danger)] hover:bg-[var(--danger-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
                  item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                )}
              >
                {item.icon && <span className="flex-shrink-0 opacity-75 w-4">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
