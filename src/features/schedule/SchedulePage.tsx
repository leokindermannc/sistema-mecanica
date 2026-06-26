import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Phone, Car, Wrench,
  CheckCircle2, CalendarDays, Timer, Send, Copy, AlertTriangle,
  FileText, Users, Calendar, XCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { mockSchedule }  from '../../mocks/schedule'
import { mockMechanics } from '../../mocks/mechanics'
import type { ScheduleAppointment, AppointmentType, AppointmentStatus } from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

const TODAY = '2026-06-10'
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WEEK_DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const DURATION_OPTIONS = [
  { value: 30,  label: '30 min' }, { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hora' }, { value: 90,  label: '1h 30min' },
  { value: 120, label: '2 horas' }, { value: 180, label: '3 horas' },
]

type AgendaView = 'hoje' | 'semana' | 'equipe'

type TypeFilter   = AppointmentType | 'TODOS'
type StatusFilter = AppointmentStatus | 'TODOS'

const TYPE_CFG: Record<AppointmentType, { label: string; color: string; border: string; dot: string }> = {
  REVISAO:          { label: 'Revisão',       color: '#7C3AED', border: 'rgba(124,58,237,0.20)', dot: '#7C3AED' },
  REPARO:           { label: 'Reparo',        color: '#D97706', border: 'rgba(217,119,6,0.20)',  dot: '#D97706' },
  ORCAMENTO:        { label: 'Orçamento',     color: '#2563EB', border: 'rgba(37,99,235,0.20)',  dot: '#2563EB' },
  RETORNO_GARANTIA: { label: 'Ret. Garantia', color: '#16A34A', border: 'rgba(22,163,74,0.20)',  dot: '#16A34A' },
}

const STATUS_CFG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  AGENDADO:       { label: 'Agendado',        color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
  CONFIRMADO:     { label: 'Confirmado',      color: '#2563EB', bg: 'rgba(37,99,235,0.10)'  },
  REALIZADO:      { label: 'Realizado',       color: '#16A34A', bg: 'rgba(22,163,74,0.10)'  },
  NAO_COMPARECEU: { label: 'Não compareceu',  color: '#DC2626', bg: 'rgba(220,38,38,0.10)'  },
  CANCELADO:      { label: 'Cancelado',       color: '#DC2626', bg: 'rgba(220,38,38,0.10)'  },
}

const CANCEL_REASONS = ['Cliente cancelou', 'Serviço não disponível', 'Reagendamento solicitado', 'Outro']

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekDates(ref: string): string[] {
  const d = new Date(ref + 'T12:00:00')
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() === 0 ? 7 : d.getDay()) - 1))
  return Array.from({ length: 6 }, (_, i) => {
    const x = new Date(mon); x.setDate(mon.getDate() + i)
    return x.toISOString().slice(0, 10)
  })
}

function addDays(s: string, n: number): string {
  const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function weekLabel(dates: string[]): string {
  const a = new Date(dates[0] + 'T12:00:00')
  const b = new Date(dates[5] + 'T12:00:00')
  if (a.getMonth() === b.getMonth())
    return `${a.getDate()}–${b.getDate()} de ${MONTHS[a.getMonth()]} ${a.getFullYear()}`
  return `${a.getDate()} ${MONTHS[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MONTHS[b.getMonth()].slice(0,3)} ${b.getFullYear()}`
}

function dayLabel(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

function mechInitials(name: string): string {
  const p = name.split(' ')
  return p.length >= 2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase()
}

function durationLabel(min: number): string {
  return min >= 60 ? `${Math.floor(min/60)}h${min%60 > 0 ? ` ${min%60}min` : ''}` : `${min}min`
}

function calcEndTime(time: string, duration: number): string {
  const [h, m] = time.split(':').map(Number)
  const t = h * 60 + m + duration
  return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`
}

function isOverdue(apt: ScheduleAppointment): boolean {
  return apt.date <= TODAY && apt.status === 'AGENDADO'
}

// ── Shared input style ────────────────────────────────────────────────────────

const S_INPUT = 'w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)] transition-all'

// ── Small components ──────────────────────────────────────────────────────────

function TypeDot({ type, size = 8 }: { type: AppointmentType; size?: number }) {
  return <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: TYPE_CFG[type].color }} />
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS_CFG[status]
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ color: s.color, backgroundColor: s.bg }}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}

function Toast({ message, variant, onDismiss }: { message: string; variant: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t) }, [onDismiss])
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg pointer-events-none"
      style={variant === 'success'
        ? { backgroundColor: 'var(--success-subtle)', color: 'var(--success)', borderColor: 'var(--success-border)' }
        : { backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
      {variant === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      {message}
    </div>
  )
}

// ── Appointment Detail Drawer ─────────────────────────────────────────────────

function AppointmentDrawer({ apt, onClose, onConfirm, onCancel, onCreateOS }: {
  apt: ScheduleAppointment
  onClose: () => void
  onConfirm: () => void
  onCancel:  () => void
  onCreateOS: () => void
}) {
  const [whatsappOpen, setWhatsappOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const t        = TYPE_CFG[apt.type]
  const endTime  = calcEndTime(apt.time, apt.duration)
  const canAct   = apt.status !== 'CANCELADO' && apt.status !== 'REALIZADO' && apt.status !== 'NAO_COMPARECEU'
  const canConfirm = apt.status === 'AGENDADO'

  const whatsMsg = `Olá *${apt.customerName}*! 👋\n\nConfirmando seu agendamento:\n\n📅 *Data:* ${dayLabel(apt.date)}\n⏰ *Horário:* ${apt.time} – ${endTime}\n🚗 *Veículo:* ${apt.vehicle} (${apt.plate})\n🔧 *Serviço:* ${t.label}\n\nQualquer dúvida, entre em contato. Te esperamos! 😊`

  function copyWhatsapp() {
    navigator.clipboard.writeText(whatsMsg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-[44px] bottom-0 z-40 w-full sm:w-[420px] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shadow-2xl overflow-hidden">

        {/* Type accent */}
        <div className="h-[3px] flex-shrink-0" style={{ backgroundColor: t.color }} />

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TypeDot type={apt.type} />
                <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: t.color }}>{t.label}</span>
                <StatusBadge status={apt.status} />
              </div>
              <h2 className="text-[18px] font-extrabold text-[var(--text-primary)] leading-tight truncate">{apt.customerName}</h2>
            </div>
            <button onClick={onClose} aria-label="Fechar"
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] transition-colors flex-shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[12px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><CalendarDays size={11} className="text-[var(--text-muted)]" />{dayLabel(apt.date)}</span>
            <span className="flex items-center gap-1"><Clock size={11} className="text-[var(--text-muted)]" />{apt.time} – {endTime}</span>
            <span className="flex items-center gap-1"><Timer size={11} className="text-[var(--text-muted)]" />{durationLabel(apt.duration)}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Vehicle + Mechanic */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1">Veículo</p>
                <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{apt.vehicle}</p>
                <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">{apt.plate}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1">Mecânico</p>
                {apt.mechanicName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
                      {mechInitials(apt.mechanicName)}
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{apt.mechanicName}</p>
                  </div>
                ) : (
                  <p className="text-[12px] text-[var(--text-muted)] italic">Sem mecânico</p>
                )}
              </div>
            </div>

            {/* Phone */}
            {apt.customerPhone && (
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1">Telefone</p>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
                  <Phone size={12} className="text-[var(--text-muted)]" />
                  {apt.customerPhone}
                </div>
              </div>
            )}

            {/* Description */}
            {apt.description && (
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1.5">Observações</p>
                <div className="p-3 rounded-lg border-l-4 border border-[var(--border)] bg-[var(--surface-muted)] text-[12px] text-[var(--text-secondary)] leading-relaxed"
                  style={{ borderLeftColor: t.color }}>
                  {apt.description}
                </div>
              </div>
            )}

            {/* Linked OS */}
            {apt.serviceOrderId && (
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1.5">Ordem de serviço vinculada</p>
                <Link to={`/ordens-servico/${apt.serviceOrderId}`} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] transition-colors">
                  <span className="text-[13px] font-bold" style={{ color: 'var(--brand)' }}>#{apt.serviceOrderId}</span>
                  <FileText size={13} className="text-[var(--text-muted)]" />
                </Link>
              </div>
            )}

            {/* WhatsApp message */}
            {whatsappOpen && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em]">Mensagem WhatsApp</p>
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] whitespace-pre-line text-[12px] font-mono text-[var(--text-primary)] leading-relaxed">
                  {whatsMsg}
                </div>
                <button onClick={copyWhatsapp} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--brand)' }}>
                  <Copy size={12} />{copied ? 'Copiado!' : 'Copiar mensagem'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--surface-muted)] p-4 space-y-2.5">
          {canAct && (
            <div className="flex gap-2">
              {canConfirm && (
                <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded text-[12px] font-bold text-white" style={{ backgroundColor: '#2563EB' }}>
                  <CheckCircle2 size={13} />Confirmar
                </button>
              )}
              {!apt.serviceOrderId ? (
                <button onClick={onCreateOS} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded text-[12px] font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
                  <Plus size={13} />Criar OS
                </button>
              ) : (
                <Link to={`/ordens-servico/${apt.serviceOrderId}`} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded text-[12px] font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
                  <FileText size={13} />Ver OS
                </Link>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setWhatsappOpen(v => !v)} className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              <Send size={12} />WhatsApp
            </button>
            {canAct && (
              <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded border text-[12px] font-medium transition-colors"
                style={{ color: 'var(--danger)', borderColor: 'rgba(168,40,40,0.30)', backgroundColor: 'var(--danger-subtle)' }}>
                <XCircle size={12} />Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────

function CancelModal({ customerName, onConfirm, onClose }: {
  customerName: string; onConfirm: (reason: string) => void; onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [custom, setCustom] = useState('')
  const value = reason === 'Outro' ? custom : reason

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Cancelar agendamento</h3>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-subtle)]">
            <p className="text-[12px] font-medium" style={{ color: 'var(--danger)' }}>
              Cancelar agendamento de <strong>{customerName}</strong>. Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">Motivo do cancelamento *</p>
            {CANCEL_REASONS.map(r => (
              <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="cancel-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--brand)]" />
                <span className="text-[12px] text-[var(--text-primary)]">{r}</span>
              </label>
            ))}
            {reason === 'Outro' && (
              <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={2}
                placeholder="Descreva o motivo..." className={cn(S_INPUT, 'h-auto py-2 resize-none')} />
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
          <button onClick={onClose} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Voltar</button>
          <button disabled={!value.trim()} onClick={() => onConfirm(value)}
            className="h-8 px-4 rounded text-[12px] font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--danger)' }}>
            Confirmar cancelamento
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New Appointment Modal ─────────────────────────────────────────────────────

interface NewAptForm {
  customerName: string; customerPhone: string; vehicleName: string; plate: string
  type: AppointmentType; date: string; time: string; duration: number
  mechanicName: string; notes: string
}

function NewAppointmentModal({ onSave, onClose }: {
  onSave: (apt: ScheduleAppointment) => void; onClose: () => void
}) {
  const [form, setForm] = useState<NewAptForm>({
    customerName: '', customerPhone: '', vehicleName: '', plate: '',
    type: 'REVISAO', date: TODAY, time: '09:00', duration: 60,
    mechanicName: '', notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof NewAptForm, string>>>({})

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  function set<K extends keyof NewAptForm>(key: K, val: NewAptForm[K]) {
    setForm(p => ({ ...p, [key]: val }))
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }))
  }

  function handleSave() {
    const e: Partial<Record<keyof NewAptForm, string>> = {}
    if (!form.customerName.trim()) e.customerName = 'Nome obrigatório'
    if (!form.vehicleName.trim())  e.vehicleName  = 'Veículo obrigatório'
    if (!form.date)                e.date         = 'Data obrigatória'
    if (!form.time)                e.time         = 'Horário obrigatório'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    onSave({
      id: `apt-${Date.now()}`,
      customerId: '', customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim() || undefined,
      vehicleId: '', vehicle: form.vehicleName.trim(),
      plate: form.plate.trim() || '—',
      date: form.date, time: form.time, duration: form.duration,
      type: form.type, status: 'AGENDADO',
      mechanicName: form.mechanicName || undefined,
      description: form.notes.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-[600px] max-h-[92vh] bg-[var(--surface)] rounded-t-2xl sm:rounded-xl border border-[var(--border)] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[16px] font-extrabold text-[var(--text-primary)]">Novo agendamento</h2>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Tipo */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-2">Tipo de serviço *</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(TYPE_CFG) as [AppointmentType, typeof TYPE_CFG[AppointmentType]][]).map(([k, v]) => (
                <button key={k} type="button" onClick={() => set('type', k)}
                  className={cn('h-9 px-3 rounded border text-[11px] font-medium transition-all', form.type === k ? 'font-bold' : 'text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]')}
                  style={form.type === k ? { color: v.color, backgroundColor: `${v.color}12`, borderColor: v.border } : {}}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente + Veículo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Nome do cliente *{errors.customerName && <span className="text-[var(--danger)] ml-1">{errors.customerName}</span>}
              </label>
              <input value={form.customerName} onChange={e => set('customerName', e.target.value)}
                placeholder="Ex: João Pereira" className={cn(S_INPUT, errors.customerName && 'border-[var(--danger)]')} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Telefone</label>
              <input value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)}
                placeholder="(11) 99999-9999" className={S_INPUT} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Veículo *{errors.vehicleName && <span className="text-[var(--danger)] ml-1">{errors.vehicleName}</span>}
              </label>
              <input value={form.vehicleName} onChange={e => set('vehicleName', e.target.value)}
                placeholder="Ex: Honda Civic 2018" className={cn(S_INPUT, errors.vehicleName && 'border-[var(--danger)]')} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Placa</label>
              <input value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())}
                placeholder="ABC-1D23" className={cn(S_INPUT, 'font-mono tracking-wider')} />
            </div>
          </div>

          {/* Data, Hora, Duração */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Data *{errors.date && <span className="text-[var(--danger)] ml-1">{errors.date}</span>}
              </label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className={cn(S_INPUT, errors.date && 'border-[var(--danger)]')} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Horário *</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className={cn(S_INPUT, errors.time && 'border-[var(--danger)]')} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Duração</label>
              <select value={form.duration} onChange={e => set('duration', Number(e.target.value))} className={S_INPUT}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Mecânico */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Mecânico responsável</label>
            <select value={form.mechanicName} onChange={e => set('mechanicName', e.target.value)} className={S_INPUT}>
              <option value="">Selecionar mecânico...</option>
              {mockMechanics.map(m => <option key={m.id} value={m.name}>{m.name}{m.specialty ? ` — ${m.specialty}` : ''}</option>)}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Descreva o serviço ou observações..." className={cn(S_INPUT, 'h-auto py-2 resize-none')} />
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
          <button onClick={onClose} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancelar</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
            <Plus size={12} />Agendar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ todayApts }: { todayApts: ScheduleAppointment[] }) {
  const stats = {
    total:       todayApts.length,
    confirmados: todayApts.filter(a => a.status === 'CONFIRMADO').length,
    andamento:   todayApts.filter(a => a.status === 'REALIZADO').length,
    atrasados:   todayApts.filter(a => isOverdue(a)).length,
    semOS:       todayApts.filter(a => !a.serviceOrderId && a.status !== 'CANCELADO').length,
  }

  const cards = [
    { label: 'Hoje',         value: stats.total,       icon: <Calendar size={13} />,    color: 'var(--text-secondary)' },
    { label: 'Confirmados',  value: stats.confirmados,  icon: <CheckCircle2 size={13} />, color: '#2563EB' },
    { label: 'Realizados',   value: stats.andamento,    icon: <CheckCircle2 size={13} />, color: 'var(--success)' },
    { label: 'Atrasados',    value: stats.atrasados,    icon: <AlertTriangle size={13} />, color: stats.atrasados > 0 ? 'var(--danger)' : 'var(--text-muted)' },
    { label: 'Sem OS',       value: stats.semOS,        icon: <FileText size={13} />,    color: stats.semOS > 0 ? 'var(--warning)' : 'var(--text-muted)' },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {cards.map(c => (
        <div key={c.label} className="flex items-center gap-2 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <span style={{ color: c.color }}>{c.icon}</span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: c.color }}>{c.value}</span>
          <span className="text-[11px] text-[var(--text-muted)]">{c.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'TODOS',           label: 'Todos' },
  { value: 'REVISAO',         label: 'Revisão' },
  { value: 'REPARO',          label: 'Reparo' },
  { value: 'ORCAMENTO',       label: 'Orçamento' },
  { value: 'RETORNO_GARANTIA',label: 'Garantia' },
]

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'TODOS',           label: 'Todos' },
  { value: 'AGENDADO',        label: 'Agendado' },
  { value: 'CONFIRMADO',      label: 'Confirmado' },
  { value: 'REALIZADO',       label: 'Realizado' },
  { value: 'NAO_COMPARECEU',  label: 'Não compareceu' },
  { value: 'CANCELADO',       label: 'Cancelado' },
]

function FilterBar({ typeFilter, statusFilter, mechFilter, mechanics, onType, onStatus, onMech }: {
  typeFilter: TypeFilter; statusFilter: StatusFilter; mechFilter: string
  mechanics: string[]; onType: (v: TypeFilter) => void; onStatus: (v: StatusFilter) => void; onMech: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {TYPE_FILTER_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => onType(opt.value)}
            className={cn('h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors',
              typeFilter === opt.value ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Status */}
      <select value={statusFilter} onChange={e => onStatus(e.target.value as StatusFilter)}
        className="h-7 px-2 pr-7 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-medium text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 appearance-none cursor-pointer">
        {STATUS_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Mechanic */}
      {mechanics.length > 0 && (
        <select value={mechFilter} onChange={e => onMech(e.target.value)}
          className="h-7 px-2 pr-7 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[11px] font-medium text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 appearance-none cursor-pointer">
          <option value="TODOS">Todos os mecânicos</option>
          <option value="SEM_MECANICO">Sem mecânico</option>
          {mechanics.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      )}

      {/* Active filters indicator */}
      {(typeFilter !== 'TODOS' || statusFilter !== 'TODOS' || mechFilter !== 'TODOS') && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[var(--brand)] bg-[var(--brand-muted)]">
          filtro ativo
        </span>
      )}
    </div>
  )
}

// ── Today view: appointment card ──────────────────────────────────────────────

function TodayAptCard({ apt, onSelect, onConfirm, onCreateOS }: {
  apt: ScheduleAppointment
  onSelect:   () => void
  onConfirm:  () => void
  onCreateOS: () => void
}) {
  const t       = TYPE_CFG[apt.type]
  const endTime = calcEndTime(apt.time, apt.duration)
  const overdue = isOverdue(apt)

  return (
    <div className="group flex gap-0 cursor-pointer" onClick={onSelect}>
      {/* Time column */}
      <div className="w-16 flex-shrink-0 text-right pr-4 pt-3">
        <p className="text-[14px] font-extrabold text-[var(--text-primary)] tabular-nums leading-none">{apt.time}</p>
        <p className="text-[10px] text-[var(--text-muted)] tabular-nums mt-0.5">{endTime}</p>
      </div>

      {/* Timeline dot + line */}
      <div className="flex flex-col items-center w-4 flex-shrink-0 relative">
        <div className="w-3 h-3 rounded-full border-2 border-[var(--surface)] mt-[11px] flex-shrink-0 relative z-10"
          style={{ backgroundColor: overdue ? 'var(--danger)' : t.color }} />
        <div className="flex-1 w-px mt-1" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* Card */}
      <div className="flex-1 ml-4 mb-4">
        <div
          className={cn('rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 transition-all group-hover:shadow-md',
            'border-l-[3px] group-hover:border-l-[3px]')}
          style={{ borderLeftColor: overdue ? 'var(--danger)' : t.color }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-[14px] font-bold text-[var(--text-primary)] leading-tight">{apt.customerName}</p>
                <StatusBadge status={apt.status} />
                {overdue && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-subtle)' }}>Atrasado</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><Car size={10} className="text-[var(--text-muted)]" />{apt.vehicle}</span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">{apt.plate}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1" style={{ color: t.color }}><TypeDot type={apt.type} size={6} />{t.label}</span>
                {apt.mechanicName && <span className="flex items-center gap-1"><Wrench size={10} />{apt.mechanicName}</span>}
                <span className="flex items-center gap-1"><Timer size={10} />{durationLabel(apt.duration)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
              {apt.status === 'AGENDADO' && (
                <button onClick={onConfirm} className="flex items-center gap-1 h-7 px-2.5 rounded border text-[11px] font-semibold transition-colors"
                  style={{ color: '#2563EB', borderColor: 'rgba(37,99,235,0.25)', backgroundColor: 'rgba(37,99,235,0.06)' }}>
                  <CheckCircle2 size={11} />Confirmar
                </button>
              )}
              {!apt.serviceOrderId && apt.status !== 'CANCELADO' ? (
                <button onClick={onCreateOS} className="flex items-center gap-1 h-7 px-2.5 rounded text-[11px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
                  <Plus size={11} />Criar OS
                </button>
              ) : apt.serviceOrderId ? (
                <Link to={`/ordens-servico/${apt.serviceOrderId}`} onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 h-7 px-2.5 rounded text-[11px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
                  <FileText size={11} />Ver OS
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Today view ────────────────────────────────────────────────────────────────

function TodayView({ appointments, onSelect, onConfirm, onCreateOS }: {
  appointments: ScheduleAppointment[]; onSelect: (id: string) => void
  onConfirm: (id: string) => void; onCreateOS: (id: string) => void
}) {
  const sorted = [...appointments].sort((a, b) => a.time.localeCompare(b.time))

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Calendar size={32} className="text-[var(--text-disabled)]" />
        <p className="text-[15px] font-semibold text-[var(--text-secondary)]">Nenhum agendamento para hoje</p>
        <p className="text-[13px] text-[var(--text-muted)]">Os agendamentos do dia aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div className="pt-4 pb-12">
      {sorted.map(apt => (
        <TodayAptCard key={apt.id} apt={apt}
          onSelect={() => onSelect(apt.id)}
          onConfirm={() => onConfirm(apt.id)}
          onCreateOS={() => onCreateOS(apt.id)} />
      ))}
    </div>
  )
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekAptCard({ apt, onSelect }: { apt: ScheduleAppointment; onSelect: () => void }) {
  const t = TYPE_CFG[apt.type]
  return (
    <button onClick={onSelect} className="w-full text-left rounded-md border border-[var(--border)] border-l-[3px] bg-[var(--surface)] px-2.5 py-2 mb-1.5 last:mb-0 hover:shadow-sm hover:bg-[var(--surface-hover)] transition-all"
      style={{ borderLeftColor: t.color }}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">{apt.time}</span>
        <StatusBadge status={apt.status} />
      </div>
      <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">{apt.customerName}</p>
      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{apt.vehicle} · {apt.plate}</p>
      <p className="text-[10px] font-medium mt-0.5" style={{ color: t.color }}>{t.label}</p>
    </button>
  )
}

function WeekView({ appointments, weekDates, onSelect }: {
  appointments: ScheduleAppointment[]; weekDates: string[]; onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {weekDates.map(date => {
        const d = new Date(date + 'T12:00:00')
        const isToday = date === TODAY
        const dayApts = appointments.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time))
        return (
          <div key={date} className={cn('rounded-lg border overflow-hidden', isToday ? 'border-[rgba(212,96,26,0.35)]' : 'border-[var(--border)]')}>
            <div className={cn('px-3 py-2.5 border-b', isToday ? 'bg-[var(--brand-light)] border-[rgba(212,96,26,0.20)]' : 'bg-[var(--surface-muted)] border-[var(--border)]')}>
              <p className={cn('text-[9px] font-black uppercase tracking-[0.1em]', isToday ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]')}>
                {WEEK_DAYS_SHORT[d.getDay()]}
              </p>
              <div className="flex items-baseline gap-2">
                <p className={cn('text-[17px] font-extrabold leading-none mt-0.5', isToday ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]')}>{d.getDate()}</p>
                {dayApts.length > 0 && (
                  <span className={cn('text-[9px] font-bold', isToday ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]')}>{dayApts.length} agend.</span>
                )}
              </div>
            </div>
            <div className="p-2 bg-[var(--surface)] min-h-[80px]">
              {dayApts.length === 0 ? (
                <p className="text-[10px] text-[var(--text-disabled)] text-center py-4">—</p>
              ) : (
                dayApts.map(apt => <WeekAptCard key={apt.id} apt={apt} onSelect={() => onSelect(apt.id)} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Team view ─────────────────────────────────────────────────────────────────

function TeamView({ appointments, weekDates, onSelect }: {
  appointments: ScheduleAppointment[]; weekDates: string[]; onSelect: (id: string) => void
}) {
  const mechanics = useMemo(() => {
    const names = [...new Set(appointments.map(a => a.mechanicName ?? 'Sem mecânico'))]
    return names.sort((a, b) => a === 'Sem mecânico' ? 1 : b === 'Sem mecânico' ? -1 : a.localeCompare(b))
  }, [appointments])

  if (mechanics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Users size={32} className="text-[var(--text-disabled)]" />
        <p className="text-[15px] font-semibold text-[var(--text-secondary)]">Nenhum agendamento nesta semana</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" style={{ minWidth: 800 }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-[180px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-left">
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em]">Mecânico</span>
            </th>
            {weekDates.map(date => {
              const d = new Date(date + 'T12:00:00')
              const isToday = date === TODAY
              const cnt = appointments.filter(a => a.date === date).length
              return (
                <th key={date} className={cn('border border-[var(--border)] px-2 py-2.5 text-center', isToday ? 'bg-[var(--brand-light)]' : 'bg-[var(--surface-muted)]')}>
                  <p className={cn('text-[9px] font-black uppercase tracking-[0.1em] mb-0.5', isToday ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]')}>{WEEK_DAYS_SHORT[d.getDay()]}</p>
                  <p className={cn('text-[14px] font-extrabold leading-none', isToday ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]')}>{d.getDate()}</p>
                  {cnt > 0 && <span className="text-[8px] text-[var(--text-muted)]">{cnt} agend.</span>}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {mechanics.map((mech, idx) => {
            const mechApts = appointments.filter(a => (a.mechanicName ?? 'Sem mecânico') === mech)
            const totalWeek = mechApts.length
            const confirmed = mechApts.filter(a => a.status === 'CONFIRMADO' || a.status === 'REALIZADO').length
            const totalMin  = mechApts.reduce((s, a) => s + a.duration, 0)
            return (
              <tr key={mech} className={idx % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-muted)]'}>
                <td className={cn('sticky left-0 z-[5] border border-[var(--border)] px-3 py-3 align-top', idx % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-muted)]')}>
                  <div className="flex items-center gap-2 mb-2">
                    {mech !== 'Sem mecânico' ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
                        {mechInitials(mech)}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <Wrench size={12} className="text-[var(--text-muted)]" />
                      </div>
                    )}
                    <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight truncate">{mech}</p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px]"><span className="text-[var(--text-muted)]">Semana</span><span className="font-bold text-[var(--text-primary)]">{totalWeek} agend.</span></div>
                    <div className="flex justify-between text-[9px]"><span className="text-[var(--text-muted)]">Total</span><span className="font-bold text-[var(--text-primary)]">{durationLabel(totalMin)}</span></div>
                    {totalWeek > 0 && (
                      <div className="mt-1.5">
                        <div className="w-full h-[3px] rounded-full bg-[var(--border)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(confirmed/totalWeek)*100}%`, backgroundColor: 'var(--brand)' }} />
                        </div>
                        <p className="text-[8px] text-[var(--text-muted)] mt-0.5">{confirmed}/{totalWeek} confirmados</p>
                      </div>
                    )}
                  </div>
                </td>
                {weekDates.map(date => {
                  const isToday = date === TODAY
                  const dayApts = mechApts.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time))
                  return (
                    <td key={date} className={cn('border border-[var(--border)] align-top px-2 py-2', isToday && 'bg-[var(--brand-light)]/30')} style={{ minWidth: 130 }}>
                      {dayApts.map(apt => (
                        <button key={apt.id} onClick={() => onSelect(apt.id)}
                          className="w-full text-left rounded border border-[var(--border)] border-l-[2px] px-2 py-1.5 mb-1 last:mb-0 hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ borderLeftColor: TYPE_CFG[apt.type].color }}>
                          <p className="text-[10px] font-bold text-[var(--text-primary)] tabular-nums">{apt.time}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] truncate">{apt.customerName}</p>
                          <div className="mt-0.5"><StatusBadge status={apt.status} /></div>
                        </button>
                      ))}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SchedulePage() {
  const [view,         setView]         = useState<AgendaView>('hoje')
  const [dateRef,      setDateRef]      = useState(TODAY)
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([...mockSchedule])
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('TODOS')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [mechFilter,   setMechFilter]   = useState('TODOS')
  const [modal,        setModal]        = useState<'new' | 'cancel' | null>(null)
  const [toast,        setToast]        = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  const weekDates = useMemo(() => getWeekDates(dateRef), [dateRef])

  const currentDateLabel = useMemo(() => {
    if (view === 'hoje') return dayLabel(dateRef)
    return weekLabel(weekDates)
  }, [view, dateRef, weekDates])

  const allMechanics = useMemo(() => {
    const names = [...new Set(appointments.filter(a => a.mechanicName).map(a => a.mechanicName!))]
    return names.sort()
  }, [appointments])

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (typeFilter !== 'TODOS' && a.type !== typeFilter) return false
      if (statusFilter !== 'TODOS' && a.status !== statusFilter) return false
      if (mechFilter === 'SEM_MECANICO' && a.mechanicName) return false
      if (mechFilter !== 'TODOS' && mechFilter !== 'SEM_MECANICO' && a.mechanicName !== mechFilter) return false
      return true
    })
  }, [appointments, typeFilter, statusFilter, mechFilter])

  const todayApts = useMemo(() => filtered.filter(a => a.date === dateRef), [filtered, dateRef])
  const weekApts  = useMemo(() => filtered.filter(a => weekDates.includes(a.date)), [filtered, weekDates])

  const selectedApt = useMemo(() => appointments.find(a => a.id === selectedId) ?? null, [appointments, selectedId])

  function showToast(message: string, variant: 'success' | 'error' = 'success') {
    setToast({ message, variant })
  }

  function navigate(delta: number) {
    if (view === 'hoje')  setDateRef(addDays(dateRef, delta))
    else                  setDateRef(addDays(dateRef, delta * 7))
  }

  function goToday() {
    setDateRef(TODAY)
    setView('hoje')
  }

  function updateApt(id: string, patch: Partial<ScheduleAppointment>) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
  }

  function handleConfirm(id: string) {
    updateApt(id, { status: 'CONFIRMADO' })
    showToast('Agendamento confirmado.')
    if (selectedId === id) setSelectedId(null)
  }

  function handleCreateOS(id: string) {
    const fakeOsId = `os-${Date.now().toString().slice(-6)}`
    updateApt(id, { serviceOrderId: fakeOsId })
    showToast(`OS criada com sucesso! #${fakeOsId}`)
    if (selectedId === id) setSelectedId(null)
  }

  function handleCancelClick(id: string) {
    setCancelTarget(id)
    setModal('cancel')
    setSelectedId(null)
  }

  function handleConfirmCancel(reason: string) {
    if (!cancelTarget) return
    updateApt(cancelTarget, { status: 'CANCELADO' })
    showToast(`Agendamento cancelado. Motivo: ${reason}`)
    setCancelTarget(null)
    setModal(null)
  }

  function handleNewAppointment(apt: ScheduleAppointment) {
    setAppointments(prev => [...prev, apt])
    setModal(null)
    setDateRef(apt.date)
    setView('hoje')
    showToast('Agendamento criado com sucesso!')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Title + subtitle */}
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--text-primary)] tracking-tight leading-none">Agenda</h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Organize os agendamentos, confirmações e entregas da oficina.</p>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">

              {/* View switcher */}
              <div className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                {([
                  { key: 'hoje' as AgendaView,   label: 'Hoje',   icon: <Calendar size={12} /> },
                  { key: 'semana' as AgendaView, label: 'Semana', icon: <CalendarDays size={12} /> },
                  { key: 'equipe' as AgendaView, label: 'Equipe', icon: <Users size={12} /> },
                ] as const).map(v => (
                  <button key={v.key} onClick={() => setView(v.key)}
                    className={cn('flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-medium transition-colors',
                      view === v.key ? 'bg-[var(--text-primary)] text-white font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
                    {v.icon}{v.label}
                  </button>
                ))}
              </div>

              {/* Date navigation */}
              <div className="flex items-center border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden h-8 divide-x divide-[var(--border)]">
                <button onClick={() => navigate(-1)} className="w-8 h-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors">
                  <ChevronLeft size={13} />
                </button>
                <span className="px-3 text-[12px] font-semibold text-[var(--text-primary)] whitespace-nowrap">{currentDateLabel}</span>
                <button onClick={() => navigate(1)} className="w-8 h-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors">
                  <ChevronRight size={13} />
                </button>
              </div>

              {dateRef !== TODAY && (
                <button onClick={goToday} className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                  Hoje
                </button>
              )}
            </div>

            {/* Primary action */}
            <button onClick={() => setModal('new')} className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex-shrink-0 transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--brand)' }}>
              <Plus size={13} />Novo agendamento
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-5 py-5 space-y-5">

        {/* ── Summary cards ───────────────────────────────────────── */}
        <SummaryCards todayApts={appointments.filter(a => a.date === TODAY)} />

        {/* ── Filters ─────────────────────────────────────────────── */}
        <FilterBar
          typeFilter={typeFilter} statusFilter={statusFilter} mechFilter={mechFilter}
          mechanics={allMechanics}
          onType={setTypeFilter} onStatus={setStatusFilter} onMech={setMechFilter}
        />

        {/* ── View content ─────────────────────────────────────────── */}
        {view === 'hoje' ? (
          <div className="flex gap-5 items-start">
            {/* Main list */}
            <div className="flex-1 min-w-0">
              <TodayView
                appointments={todayApts}
                onSelect={id => setSelectedId(id)}
                onConfirm={handleConfirm}
                onCreateOS={handleCreateOS}
              />
            </div>

            {/* Right info panel */}
            <aside className="w-[280px] flex-shrink-0 space-y-4 hidden lg:flex lg:flex-col">

              {/* Resumo do dia */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <p className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--surface-muted)]">
                  Resumo do dia
                </p>
                <div className="px-4 py-3 space-y-2.5">
                  {[
                    { label: 'Total',        count: todayApts.length,                                              color: 'var(--text-secondary)' },
                    { label: 'Confirmados',  count: todayApts.filter(a => a.status === 'CONFIRMADO').length,      color: '#2563EB' },
                    { label: 'Realizados',   count: todayApts.filter(a => a.status === 'REALIZADO').length,       color: 'var(--success)' },
                    { label: 'Não vinc. OS', count: todayApts.filter(a => !a.serviceOrderId).length,             color: 'var(--warning)' },
                    { label: 'Cancelados',   count: todayApts.filter(a => a.status === 'CANCELADO').length,       color: 'var(--danger)' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-secondary)]">{r.label}</span>
                      <span className="text-[13px] font-bold" style={{ color: r.color }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Por tipo */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <p className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--surface-muted)]">
                  Por tipo
                </p>
                <div className="px-4 py-3 space-y-2.5">
                  {(Object.entries(TYPE_CFG) as [AppointmentType, typeof TYPE_CFG[AppointmentType]][]).map(([k, v]) => {
                    const count = todayApts.filter(a => a.type === k).length
                    return (
                      <div key={k} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
                        <span className="text-[12px] text-[var(--text-secondary)] flex-1">{v.label}</span>
                        <span className="text-[12px] font-bold text-[var(--text-primary)]">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mecânicos do dia */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <p className="px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--surface-muted)]">
                  Mecânicos
                </p>
                <div className="divide-y divide-[var(--border)]">
                  {allMechanics.length === 0
                    ? <p className="px-4 py-3 text-[12px] text-[var(--text-muted)]">Nenhum agendado</p>
                    : allMechanics.map(name => {
                      const count = todayApts.filter(a => a.mechanicName === name).length
                      const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                      return (
                        <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: 'rgba(212,96,26,0.10)', color: 'var(--brand)' }}>
                            {initials}
                          </div>
                          <span className="flex-1 text-[12px] font-medium text-[var(--text-primary)] truncate">{name.split(' ')[0]}</span>
                          <span className="text-[12px] font-bold text-[var(--text-secondary)]">{count} {count === 1 ? 'apt.' : 'apts.'}</span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>

            </aside>
          </div>
        ) : (
          <div>
            {view === 'semana' && (
              <WeekView appointments={weekApts} weekDates={weekDates} onSelect={id => setSelectedId(id)} />
            )}
            {view === 'equipe' && (
              <TeamView appointments={weekApts} weekDates={weekDates} onSelect={id => setSelectedId(id)} />
            )}
          </div>
        )}
      </div>

      {/* ── Appointment drawer ───────────────────────────────────── */}
      {selectedApt && (
        <AppointmentDrawer
          apt={selectedApt}
          onClose={() => setSelectedId(null)}
          onConfirm={() => handleConfirm(selectedApt.id)}
          onCancel={() => handleCancelClick(selectedApt.id)}
          onCreateOS={() => handleCreateOS(selectedApt.id)}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      {modal === 'new' && (
        <NewAppointmentModal onSave={handleNewAppointment} onClose={() => setModal(null)} />
      )}
      {modal === 'cancel' && cancelTarget && (
        <CancelModal
          customerName={appointments.find(a => a.id === cancelTarget)?.customerName ?? ''}
          onConfirm={handleConfirmCancel}
          onClose={() => { setModal(null); setCancelTarget(null) }}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  )
}
