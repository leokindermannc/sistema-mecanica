import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Plus, Car, CheckCircle2, FileText } from 'lucide-react'
import type { Vehicle, ServiceOrderType, ServiceOrderPriority } from '../../types'
import { mockUsers } from '../../mocks/users'
import { cn } from '../../lib/utils'

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: ServiceOrderType; label: string }[] = [
  { value: 'DIAGNOSTICO', label: 'Diagnóstico' },
  { value: 'REVISAO',     label: 'Revisão' },
  { value: 'TROCA_PECA',  label: 'Troca de peça' },
  { value: 'ORCAMENTO',   label: 'Orçamento' },
  { value: 'GARANTIA',    label: 'Garantia' },
  { value: 'RETORNO',     label: 'Retorno' },
]

const PRIORITY_OPTIONS: { value: ServiceOrderPriority; label: string; color: string }[] = [
  { value: 'BAIXA',   label: 'Baixa',   color: '#16A34A' },
  { value: 'MEDIA',   label: 'Normal',  color: '#B45309' },
  { value: 'ALTA',    label: 'Alta',    color: '#F97316' },
  { value: 'URGENTE', label: 'Urgente', color: '#EF4444' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  tipo: ServiceOrderType
  queixa: string
  km: string
  prioridade: ServiceOrderPriority
  dataEntrega: string
  horaEntrega: string
  observacoes: string
  responsavelId: string
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function FormField({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
        {label}
        {required && <span className="text-[var(--brand)] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-[var(--danger)] mt-1">{error}</p>
      )}
    </div>
  )
}

// ── Input styles ──────────────────────────────────────────────────────────────

const INPUT_BASE = [
  'w-full px-3 rounded border bg-[var(--surface-muted)] text-[12px] text-[var(--text-primary)]',
  'placeholder:text-[var(--text-muted)] focus:outline-none transition-all duration-[140ms]',
  'focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)]',
].join(' ')

// ── Main modal ────────────────────────────────────────────────────────────────

export interface CreateServiceOrderModalProps {
  vehicle: Vehicle
  customerName: string
  onClose: () => void
}

export function CreateServiceOrderModal({ vehicle, customerName, onClose }: CreateServiceOrderModalProps) {
  const [form, setForm] = useState<FormState>({
    tipo:          'DIAGNOSTICO',
    queixa:        '',
    km:            vehicle.currentKm?.toString() ?? '',
    prioridade:    'MEDIA',
    dataEntrega:   '',
    horaEntrega:   '',
    observacoes:   '',
    responsavelId: '',
  })
  const [errors, setErrors]   = useState<Partial<Record<keyof FormState, string>>>({})
  const [success, setSuccess] = useState<{ osNumber: string } | null>(null)

  const mechanics = mockUsers.filter(u => u.role === 'MECANICO' && u.status === 'ATIVO')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit() {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.queixa.trim()) e.queixa = 'Descreva a queixa do cliente'
    if (form.km && isNaN(Number(form.km.replace(/\D/g, '')))) e.km = 'KM inválido'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    const n = String(Math.floor(Math.random() * 900) + 100).padStart(6, '0')
    setSuccess({ osNumber: `2026-${n}` })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nova Ordem de Serviço"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-[680px] max-h-[92vh] bg-[var(--surface)] rounded-t-2xl sm:rounded-xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex-shrink-0 sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2 className="text-[16px] font-extrabold text-[var(--text-primary)] tracking-tight">
              Nova Ordem de Serviço
            </h2>
            {!success && (
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                {customerName} · {vehicle.brand} {vehicle.model} {vehicle.year} · {vehicle.plate}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] transition-colors flex-shrink-0 mt-0.5"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content: success OR form */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--success-subtle)' }}
            >
              <CheckCircle2 size={28} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="text-[17px] font-extrabold text-[var(--text-primary)]">OS criada com sucesso!</p>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5 font-mono">#{success.osNumber}</p>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] max-w-[300px] leading-relaxed">
              A OS foi registrada para{' '}
              <strong className="text-[var(--text-primary)]">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </strong>
              {' · '}
              <span className="font-mono">{vehicle.plate}</span>
            </p>
            <div className="flex gap-3 mt-2">
              <Link
                to="/servicos"
                onClick={onClose}
                className="flex items-center gap-1.5 h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <FileText size={13} />
                Ver OS
              </Link>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--brand)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
              >
                Continuar no cliente
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

              {/* Context banner (read-only) */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)]">
                <Car size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
                <p className="text-[11px] text-[var(--text-secondary)] truncate">
                  <span className="font-semibold text-[var(--text-primary)]">{customerName}</span>
                  <span className="text-[var(--text-muted)] mx-1">·</span>
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                  <span className="text-[var(--text-muted)] mx-1">·</span>
                  <span className="font-mono">{vehicle.plate}</span>
                </p>
              </div>

              {/* Tipo de serviço */}
              <FormField label="Tipo de serviço" required>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField('tipo', opt.value)}
                      className={cn(
                        'h-8 px-3 rounded border text-[11px] font-medium text-left transition-all duration-[140ms]',
                        form.tipo === opt.value
                          ? 'font-semibold'
                          : 'text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]',
                      )}
                      style={form.tipo === opt.value
                        ? { color: 'var(--brand)', backgroundColor: 'var(--brand-light)', borderColor: 'rgba(212,96,26,0.30)' }
                        : {}}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Queixa */}
              <FormField label="Queixa do cliente" required error={errors.queixa}>
                <textarea
                  value={form.queixa}
                  onChange={e => setField('queixa', e.target.value)}
                  rows={3}
                  placeholder="Descreva o problema informado pelo cliente..."
                  className={cn(
                    INPUT_BASE, 'resize-none py-2',
                    errors.queixa ? 'border-[var(--danger)]' : 'border-[var(--border)]',
                  )}
                />
              </FormField>

              {/* KM + Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="KM atual" error={errors.km}>
                  <input
                    type="number"
                    value={form.km}
                    onChange={e => setField('km', e.target.value)}
                    placeholder="Ex: 87500"
                    className={cn(
                      INPUT_BASE, 'h-8 tabular-nums',
                      errors.km ? 'border-[var(--danger)]' : 'border-[var(--border)]',
                    )}
                  />
                </FormField>

                <FormField label="Prioridade">
                  <div className="flex gap-1.5">
                    {PRIORITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField('prioridade', opt.value)}
                        className={cn(
                          'flex-1 h-8 rounded border text-[10px] font-semibold transition-all duration-[140ms]',
                          form.prioridade === opt.value
                            ? 'text-white border-transparent'
                            : 'text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]',
                        )}
                        style={form.prioridade === opt.value
                          ? { backgroundColor: opt.color, borderColor: opt.color }
                          : {}}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>

              {/* Previsão de entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Data de entrega">
                  <input
                    type="date"
                    value={form.dataEntrega}
                    onChange={e => setField('dataEntrega', e.target.value)}
                    className={cn(INPUT_BASE, 'h-8 border-[var(--border)]')}
                  />
                </FormField>
                <FormField label="Horário">
                  <input
                    type="time"
                    value={form.horaEntrega}
                    onChange={e => setField('horaEntrega', e.target.value)}
                    className={cn(INPUT_BASE, 'h-8 border-[var(--border)]')}
                  />
                </FormField>
              </div>

              {/* Responsável */}
              {mechanics.length > 0 && (
                <FormField label="Responsável">
                  <div className="relative">
                    <select
                      value={form.responsavelId}
                      onChange={e => setField('responsavelId', e.target.value)}
                      className={cn(INPUT_BASE, 'h-8 border-[var(--border)] appearance-none pr-8 cursor-pointer')}
                    >
                      <option value="">Selecionar mecânico...</option>
                      {mechanics.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.specialty ? ` — ${m.specialty}` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]" />
                      </svg>
                    </span>
                  </div>
                </FormField>
              )}

              {/* Observações internas */}
              <FormField label="Observações internas">
                <textarea
                  value={form.observacoes}
                  onChange={e => setField('observacoes', e.target.value)}
                  rows={2}
                  placeholder="Observações para a equipe (opcional)..."
                  className={cn(INPUT_BASE, 'resize-none py-2 border-[var(--border)]')}
                />
              </FormField>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--brand)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
              >
                <Plus size={12} strokeWidth={2.5} />
                Criar OS
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
