import { useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={14} />,
  error:   <XCircle size={14} />,
  warning: <AlertTriangle size={14} />,
  info:    <Info size={14} />,
}

const COLORS: Record<ToastVariant, { bar: string; icon: string }> = {
  success: { bar: 'var(--success)',  icon: 'text-[var(--success)]' },
  error:   { bar: 'var(--danger)',   icon: 'text-[var(--danger)]' },
  warning: { bar: 'var(--warning)',  icon: 'text-[var(--warning)]' },
  info:    { bar: 'var(--info)',     icon: 'text-[var(--info)]' },
}

// ── Singleton store ──────────────────────────────────────────────────────────

let _notify: ((msg: string, variant?: ToastVariant) => void) | null = null

export const toast = {
  success: (msg: string) => _notify?.(msg, 'success'),
  error:   (msg: string) => _notify?.(msg, 'error'),
  warning: (msg: string) => _notify?.(msg, 'warning'),
  info:    (msg: string) => _notify?.(msg, 'info'),
}

// ── Container ────────────────────────────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const add = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  useEffect(() => {
    _notify = add
    return () => { _notify = null }
  }, [add])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[360px]',
            'bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg',
            'px-4 py-3',
          )}
        >
          <div className={cn('flex-shrink-0 mt-0.5', COLORS[t.variant].icon)}>
            {ICONS[t.variant]}
          </div>
          <p className="flex-1 text-[13px] text-[var(--text-primary)] leading-snug">{t.message}</p>
          <button
            onClick={() => remove(t.id)}
            className="flex-shrink-0 mt-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={12} />
          </button>
          <div
            className="absolute bottom-0 left-0 h-[3px] rounded-b-lg animate-[shrink_4s_linear_forwards]"
            style={{ backgroundColor: COLORS[t.variant].bar, width: '100%', transformOrigin: 'left' }}
          />
        </div>
      ))}
    </div>
  )
}
