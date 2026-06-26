import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  title: string
  message: string
  requireReason?: boolean
  reasonLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmModal({
  open, onClose, onConfirm,
  title, message,
  requireReason = false,
  reasonLabel = 'Motivo',
  variant = 'default',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}: ConfirmModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => { if (!open) setReason('') }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const canConfirm = !requireReason || reason.trim().length >= 3

  const vs = {
    danger:  { btn: 'bg-[var(--danger)] hover:bg-[#8C1E1E] text-white', iconColor: 'text-[var(--danger)]', iconBg: 'bg-[var(--danger-subtle)]' },
    warning: { btn: 'bg-[var(--warning)] hover:opacity-90 text-white',  iconColor: 'text-[var(--warning)]', iconBg: 'bg-[var(--warning-subtle)]' },
    default: { btn: 'bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white', iconColor: 'text-[var(--brand)]', iconBg: 'bg-[var(--brand-muted)]' },
  }[variant]

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-[420px] bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X size={13} />
          </button>

          <div className="p-5 pt-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', vs.iconBg)}>
              <AlertTriangle size={20} className={vs.iconColor} />
            </div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{message}</p>

            {requireReason && (
              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  {reasonLabel} <span className="text-[var(--danger)]">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  rows={3}
                  autoFocus
                  className={cn(
                    'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]',
                    'text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                    'p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50',
                  )}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-[var(--border)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                if (!canConfirm) return
                onConfirm(reason || undefined)
                onClose()
              }}
              disabled={!canConfirm}
              className={cn('flex-1 h-9 rounded-lg text-[13px] font-semibold transition-all', vs.btn, !canConfirm && 'opacity-40 cursor-not-allowed')}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
