import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  X, ChevronRight, AlertTriangle, CheckCircle2, Truck, XCircle,
  Car, User, Wrench, FileText, DollarSign, CalendarDays,
  Package, MessageSquare, Paperclip, Plus, Play, Clock,
  Phone, Mail, Camera, Upload, Send, Copy, ChevronLeft,
} from 'lucide-react'
import { mockServiceOrders } from '../../mocks/service-orders'
import { mockCustomers }     from '../../mocks/customers'
import { mockVehicles }      from '../../mocks/vehicles'
import { mockUsers }         from '../../mocks/users'
import { Avatar }            from '../../components/ui/Avatar'
import {
  PRIORITY_LABELS, TYPE_LABELS, TYPE_COLORS,
  formatDateFull, formatCurrency, formatDateTime, cn,
} from '../../lib/utils'
import type {
  ServiceOrder, ServiceOrderStatus, ServiceOrderPriority,
  ServiceOrderPart, StatusHistoryEntry,
} from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

const OS_STATUS_CFG: Record<ServiceOrderStatus, { label: string; cssKey: string }> = {
  AGENDADO:             { label: 'Agendado',          cssKey: 'agendado' },
  EM_ANALISE:           { label: 'Em análise',        cssKey: 'analise' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação', cssKey: 'aprovacao' },
  EM_ANDAMENTO:         { label: 'Em execução',       cssKey: 'andamento' },
  CONCLUIDO:            { label: 'Concluído',         cssKey: 'concluido' },
  ENTREGUE:             { label: 'Entregue',          cssKey: 'entregue' },
  CANCELADO:            { label: 'Cancelado',         cssKey: 'cancelado' },
}

const PRIO_CFG: Record<ServiceOrderPriority, { color: string; bg: string }> = {
  BAIXA:   { color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
  MEDIA:   { color: '#B45309', bg: 'rgba(180,83,9,0.10)' },
  ALTA:    { color: '#F97316', bg: 'rgba(249,115,22,0.10)' },
  URGENTE: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
}

type OSTab = 'resumo' | 'diagnostico' | 'pecas' | 'servicos' | 'orcamento' | 'historico' | 'anexos'
const TABS: { key: OSTab; label: string }[] = [
  { key: 'resumo',      label: 'Resumo' },
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'pecas',       label: 'Peças' },
  { key: 'servicos',    label: 'Serviços' },
  { key: 'orcamento',   label: 'Orçamento' },
  { key: 'historico',   label: 'Histórico' },
  { key: 'anexos',      label: 'Anexos' },
]

type EstimateStatus = 'NAO_GERADO' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'RECUSADO'

type ModalType =
  | 'cancel' | 'diagnosis' | 'addPart' | 'addService'
  | 'estimatePreview' | 'whatsapp' | 'refuseEstimate' | 'addComment'
  | null

// ── Local types ───────────────────────────────────────────────────────────────

interface LocalPart extends ServiceOrderPart {
  origin: 'ESTOQUE' | 'COMPRA_EXTERNA' | 'MANUAL'
  partStatus: 'RESERVADA' | 'USADA' | 'PENDENTE' | 'SOLICITADA'
}

interface LocalService {
  id: string
  description: string
  value: number
  estimatedTime: string
  responsavel: string
  serviceStatus: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'
}

interface LocalAttachment {
  id: string; name: string; type: 'foto' | 'documento'; addedAt: string
}

interface LocalComment {
  id: string; text: string; author: string
  visibility: 'INTERNO' | 'CLIENTE'; createdAt: string
}

// ── Shared input styles ───────────────────────────────────────────────────────

const S_INPUT = [
  'w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[12px]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] appearance-none',
  'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50',
  'focus:bg-[var(--surface)] transition-all',
].join(' ')
const S_TEXTAREA = S_INPUT.replace('h-8 ', '') + ' py-2 resize-none'

// ── Shared small components ───────────────────────────────────────────────────

function OsChip({ status }: { status: ServiceOrderStatus }) {
  const { cssKey } = OS_STATUS_CFG[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: `var(--os-${cssKey}-text)`, backgroundColor: `var(--os-${cssKey}-bg)`, borderColor: `var(--os-${cssKey}-border)` }}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {OS_STATUS_CFG[status].label}
    </span>
  )
}

function PrioBadge({ priority }: { priority: ServiceOrderPriority }) {
  const { color, bg } = PRIO_CFG[priority]
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm"
      style={{ color, backgroundColor: bg }}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

function TypeBadge({ type }: { type: keyof typeof TYPE_LABELS }) {
  const { bg, text } = TYPE_COLORS[type]
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm" style={{ color: text, backgroundColor: bg }}>
      {TYPE_LABELS[type]}
    </span>
  )
}

function LField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.08em] mb-0.5">{label}</p>
      <p className={cn('text-[13px] font-medium text-[var(--text-primary)]', mono && 'font-mono', !value && 'text-[var(--text-muted)] italic text-[12px]')}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function STitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.12em] mb-3">{children}</h4>
}

function Empty({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      <span className="text-[var(--text-disabled)]">{icon}</span>
      <p className="text-[13px] font-medium text-[var(--text-secondary)] mt-1">{title}</p>
      {sub && <p className="text-[12px] text-[var(--text-muted)] max-w-[260px]">{sub}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

function Toast({ message, variant, onDismiss }: { message: string; variant: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t) }, [onDismiss])
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg pointer-events-none"
      style={variant === 'success'
        ? { backgroundColor: 'var(--success-subtle)', color: 'var(--success)', borderColor: 'var(--success-border)' }
        : { backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
      {variant === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      {message}
    </div>
  )
}

// ── Modal base ────────────────────────────────────────────────────────────────

function ModalBase({ title, onClose, children, footer, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = prev }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn('relative z-10 w-full bg-[var(--surface)] rounded-t-2xl sm:rounded-xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[92vh]',
          wide ? 'sm:max-w-[720px]' : 'sm:max-w-[540px]')}
        onClick={e => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function BtnSec({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
      {children}
    </button>
  )
}
function BtnPrimary({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
      style={{ backgroundColor: danger ? 'var(--danger)' : 'var(--brand)' }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.backgroundColor = danger ? '#B91C1C' : 'var(--brand-dark)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = danger ? 'var(--danger)' : 'var(--brand)')}>
      {children}
    </button>
  )
}

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
        {label}{required && <span className="text-[var(--brand)] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Modals ────────────────────────────────────────────────────────────────────

function CancelModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [custom, setCustom]  = useState('')
  const reasons = ['Cliente desistiu', 'Serviço não aprovado', 'Erro de cadastro', 'Outro']
  const value = reason === 'Outro' ? custom : reason
  return (
    <ModalBase title="Cancelar OS" onClose={onClose} footer={
      <><BtnSec onClick={onClose}>Voltar</BtnSec>
        <BtnPrimary danger disabled={!value.trim()} onClick={() => onConfirm(value)}>Confirmar cancelamento</BtnPrimary></>
    }>
      <div className="p-5 space-y-4">
        <div className="p-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-subtle)] flex gap-2.5">
          <AlertTriangle size={14} className="flex-shrink-0 mt-px" style={{ color: 'var(--danger)' }} />
          <p className="text-[12px]" style={{ color: 'var(--danger)' }}>Esta ação não poderá ser desfeita. A OS será marcada como cancelada.</p>
        </div>
        <FormRow label="Motivo do cancelamento" required>
          <div className="space-y-2">
            {reasons.map(r => (
              <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="cancel-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--brand)]" />
                <span className="text-[12px] text-[var(--text-primary)]">{r}</span>
              </label>
            ))}
          </div>
        </FormRow>
        {reason === 'Outro' && (
          <FormRow label="Descreva o motivo">
            <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={3} placeholder="Descreva..." className={S_TEXTAREA} />
          </FormRow>
        )}
      </div>
    </ModalBase>
  )
}

function DiagnosisModal({ initial, onSave, onClose }: { initial: string; onSave: (text: string) => void; onClose: () => void }) {
  const [diag, setDiag] = useState(initial)
  const [obs, setObs]   = useState('')
  return (
    <ModalBase title="Diagnóstico técnico" onClose={onClose} footer={
      <><BtnSec onClick={onClose}>Cancelar</BtnSec>
        <BtnPrimary disabled={!diag.trim()} onClick={() => onSave(diag)}>Salvar diagnóstico</BtnPrimary></>
    }>
      <div className="p-5 space-y-4">
        <FormRow label="Diagnóstico técnico" required>
          <textarea value={diag} onChange={e => setDiag(e.target.value)} rows={4} placeholder="Descreva o diagnóstico do veículo..." className={S_TEXTAREA} />
        </FormRow>
        <FormRow label="Observações internas">
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Observações para a equipe (opcional)..." className={S_TEXTAREA} />
        </FormRow>
      </div>
    </ModalBase>
  )
}

function AddPartModal({ onAdd, onClose }: { onAdd: (p: LocalPart) => void; onClose: () => void }) {
  const [desc, setDesc]   = useState('')
  const [qty, setQty]     = useState('1')
  const [price, setPrice] = useState('')
  const [origin, setOrigin] = useState<LocalPart['origin']>('ESTOQUE')
  const [pStatus, setPStatus] = useState<LocalPart['partStatus']>('PENDENTE')
  const total = (Number(qty) || 0) * (parseFloat(price) || 0)

  function handleAdd() {
    if (!desc.trim() || !price) return
    onAdd({ partId: `lp-${Date.now()}`, description: desc, quantity: Number(qty) || 1, unitPrice: parseFloat(price), total, origin, partStatus: pStatus })
  }
  return (
    <ModalBase title="Adicionar peça" onClose={onClose} footer={
      <><BtnSec onClick={onClose}>Cancelar</BtnSec>
        <BtnPrimary disabled={!desc.trim() || !price} onClick={handleAdd}><Plus size={12} />Adicionar peça</BtnPrimary></>
    }>
      <div className="p-5 space-y-4">
        <FormRow label="Descrição da peça" required>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Filtro de óleo universal" className={S_INPUT} />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Quantidade">
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className={S_INPUT} />
          </FormRow>
          <FormRow label="Valor unitário (R$)" required>
            <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" className={S_INPUT} />
          </FormRow>
        </div>
        {total > 0 && (
          <div className="flex justify-between items-center p-2.5 rounded bg-[var(--surface-muted)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)]">Total calculado</span>
            <span className="text-[13px] font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(total)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Origem">
            <select value={origin} onChange={e => setOrigin(e.target.value as LocalPart['origin'])} className={S_INPUT}>
              <option value="ESTOQUE">Estoque</option>
              <option value="COMPRA_EXTERNA">Compra externa</option>
              <option value="MANUAL">Manual</option>
            </select>
          </FormRow>
          <FormRow label="Status">
            <select value={pStatus} onChange={e => setPStatus(e.target.value as LocalPart['partStatus'])} className={S_INPUT}>
              <option value="PENDENTE">Pendente</option>
              <option value="RESERVADA">Reservada</option>
              <option value="SOLICITADA">Solicitada</option>
              <option value="USADA">Usada</option>
            </select>
          </FormRow>
        </div>
      </div>
    </ModalBase>
  )
}

function AddServiceModal({ onAdd, onClose }: { onAdd: (s: LocalService) => void; onClose: () => void }) {
  const [desc, setDesc]   = useState('')
  const [value, setValue] = useState('')
  const [time, setTime]   = useState('')
  const [resp, setResp]   = useState('')
  const mechanics = mockUsers.filter(u => u.role === 'MECANICO' && u.status === 'ATIVO')

  function handleAdd() {
    if (!desc.trim()) return
    onAdd({ id: `ls-${Date.now()}`, description: desc, value: parseFloat(value) || 0, estimatedTime: time, responsavel: resp, serviceStatus: 'PENDENTE' })
  }
  return (
    <ModalBase title="Adicionar serviço" onClose={onClose} footer={
      <><BtnSec onClick={onClose}>Cancelar</BtnSec>
        <BtnPrimary disabled={!desc.trim()} onClick={handleAdd}><Plus size={12} />Adicionar serviço</BtnPrimary></>
    }>
      <div className="p-5 space-y-4">
        <FormRow label="Descrição do serviço" required>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Troca de pastilhas de freio" className={S_INPUT} />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Valor (R$)">
            <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" className={S_INPUT} />
          </FormRow>
          <FormRow label="Tempo estimado">
            <input value={time} onChange={e => setTime(e.target.value)} placeholder="Ex: 2h" className={S_INPUT} />
          </FormRow>
        </div>
        <FormRow label="Responsável">
          <select value={resp} onChange={e => setResp(e.target.value)} className={S_INPUT}>
            <option value="">Selecionar mecânico...</option>
            {mechanics.map(m => <option key={m.id} value={m.name}>{m.name}{m.specialty ? ` — ${m.specialty}` : ''}</option>)}
          </select>
        </FormRow>
      </div>
    </ModalBase>
  )
}

function EstimatePreviewModal({ order, parts, services, onClose }: {
  order: ServiceOrder; parts: LocalPart[]; services: LocalService[]; onClose: () => void
}) {
  const totalP = parts.reduce((s, p) => s + p.total, 0)
  const totalS = services.reduce((s, s2) => s + s2.value, 0)
  return (
    <ModalBase title="Prévia do orçamento" onClose={onClose} wide footer={
      <BtnSec onClick={onClose}>Fechar prévia</BtnSec>
    }>
      <div className="p-5 space-y-5">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-1.5">
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.06em]">OS #{order.number}</p>
          <p className="text-[15px] font-extrabold text-[var(--text-primary)]">{order.vehicle}</p>
          <p className="text-[12px] text-[var(--text-secondary)]">{order.customerName} · {order.plate}</p>
        </div>
        {parts.length > 0 && (
          <div>
            <STitle>Peças</STitle>
            <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
              {parts.map(p => (
                <div key={p.partId} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--text-primary)]">{p.description}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{p.quantity}× {formatCurrency(p.unitPrice)}</p>
                  </div>
                  <span className="text-[13px] font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(p.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {services.length > 0 && (
          <div>
            <STitle>Serviços</STitle>
            <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">{s.description}</p>
                  <span className="text-[13px] font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="border-t-2 border-[var(--border)] pt-4 flex items-baseline justify-between">
          <span className="text-[14px] font-bold text-[var(--text-primary)]">Total do orçamento</span>
          <span className="text-[24px] font-extrabold tabular-nums" style={{ color: 'var(--brand)' }}>{formatCurrency(totalP + totalS || order.estimatedValue)}</span>
        </div>
      </div>
    </ModalBase>
  )
}

function WhatsAppModal({ order, parts, services, onClose }: {
  order: ServiceOrder; parts: LocalPart[]; services: LocalService[]; onClose: () => void
}) {
  const total = parts.reduce((s, p) => s + p.total, 0) + services.reduce((s, s2) => s + s2.value, 0) || order.estimatedValue
  const msg = `Olá *${order.customerName}*, tudo bem?\n\nSegue o orçamento da *OS #${order.number}* referente ao *${order.vehicle}* (${order.plate}):\n\n` +
    (parts.length ? `🔧 *Peças:* ${formatCurrency(parts.reduce((s, p) => s + p.total, 0))}\n` : '') +
    (services.length ? `⚙️ *Serviços:* ${formatCurrency(services.reduce((s, s2) => s + s2.value, 0))}\n` : '') +
    `\n💰 *Total: ${formatCurrency(total)}*\n\nAguardamos sua aprovação para prosseguir. Qualquer dúvida, estamos à disposição!`

  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <ModalBase title="Mensagem WhatsApp" onClose={onClose} footer={
      <><BtnSec onClick={onClose}>Fechar</BtnSec>
        <BtnPrimary onClick={copy}><Copy size={12} />{copied ? 'Copiado!' : 'Copiar mensagem'}</BtnPrimary></>
    }>
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info-border)]">
          <Send size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
          <p className="text-[11px]" style={{ color: 'var(--info)' }}>Copie a mensagem abaixo e envie pelo WhatsApp do cliente.</p>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] whitespace-pre-line text-[12px] text-[var(--text-primary)] leading-relaxed font-mono">
          {msg}
        </div>
      </div>
    </ModalBase>
  )
}

function RefuseEstimateModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <ModalBase title="Recusar orçamento" onClose={onClose} footer={
      <><BtnSec onClick={onClose}>Cancelar</BtnSec>
        <BtnPrimary danger disabled={!reason.trim()} onClick={() => onConfirm(reason)}>Confirmar recusa</BtnPrimary></>
    }>
      <div className="p-5 space-y-4">
        <FormRow label="Motivo da recusa" required>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Motivo informado pelo cliente..." className={S_TEXTAREA} />
        </FormRow>
      </div>
    </ModalBase>
  )
}

function AddCommentModal({ onAdd, onClose }: { onAdd: (c: LocalComment) => void; onClose: () => void }) {
  const [text, setText]       = useState('')
  const [vis, setVis] = useState<'INTERNO' | 'CLIENTE'>('INTERNO')
  return (
    <ModalBase title="Adicionar comentário" onClose={onClose} footer={
      <><BtnSec onClick={onClose}>Cancelar</BtnSec>
        <BtnPrimary disabled={!text.trim()} onClick={() => onAdd({ id: `lc-${Date.now()}`, text, author: 'Admin', visibility: vis, createdAt: new Date().toISOString() })}>
          <MessageSquare size={12} />Adicionar
        </BtnPrimary></>
    }>
      <div className="p-5 space-y-4">
        <FormRow label="Comentário" required>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Escreva um comentário..." className={S_TEXTAREA} />
        </FormRow>
        <FormRow label="Visibilidade">
          <div className="flex gap-3">
            {(['INTERNO', 'CLIENTE'] as const).map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="visibility" value={v} checked={vis === v} onChange={() => setVis(v)} className="accent-[var(--brand)]" />
                <span className="text-[12px] text-[var(--text-primary)]">{v === 'INTERNO' ? 'Interno (equipe)' : 'Compartilhar com cliente'}</span>
              </label>
            ))}
          </div>
        </FormRow>
      </div>
    </ModalBase>
  )
}

// ── Tab: Resumo ───────────────────────────────────────────────────────────────

function ResumoTab({ order, parts, services, status, customer, vehicle }: {
  order: ServiceOrder; parts: LocalPart[]; services: LocalService[]
  status: ServiceOrderStatus
  customer: ReturnType<typeof mockCustomers.find>
  vehicle: ReturnType<typeof mockVehicles.find>
}) {
  const totalP = parts.reduce((s, p) => s + p.total, 0)
  const totalS = services.reduce((s, s2) => s + s2.value, 0)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-4">
          <STitle>Veículo</STitle>
          <LField label="Veículo"   value={order.vehicle} />
          <LField label="Placa"     value={order.plate} mono />
          <LField label="KM atual"  value={vehicle?.currentKm ? `${vehicle.currentKm.toLocaleString('pt-BR')} km` : null} />
          <LField label="Entrada"   value={formatDateFull(order.entryDate)} />
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-4">
          <STitle>Cliente</STitle>
          <LField label="Nome"       value={order.customerName} />
          <LField label="Telefone"   value={customer?.phone} />
          <LField label="WhatsApp"   value={customer?.whatsapp} />
          <LField label="E-mail"     value={customer?.email} />
        </div>
      </div>

      {order.symptoms && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <STitle>Sintomas relatados</STitle>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{order.symptoms}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
          <STitle>Status atual</STitle>
          <OsChip status={status} />
        </div>
        {(parts.length > 0 || services.length > 0) && (
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-2">
            <STitle>Resumo financeiro</STitle>
            {totalP > 0 && <div className="flex justify-between text-[12px]"><span className="text-[var(--text-muted)]">Peças</span><span className="font-semibold tabular-nums">{formatCurrency(totalP)}</span></div>}
            {totalS > 0 && <div className="flex justify-between text-[12px]"><span className="text-[var(--text-muted)]">Serviços</span><span className="font-semibold tabular-nums">{formatCurrency(totalS)}</span></div>}
            <div className="flex justify-between text-[13px] pt-1 border-t border-[var(--border)]"><span className="font-bold">Total</span><span className="font-extrabold tabular-nums" style={{ color: 'var(--brand)' }}>{formatCurrency(totalP + totalS)}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Diagnóstico ──────────────────────────────────────────────────────────

function DiagnosisTab({ diagnosis, order, onOpenModal }: {
  diagnosis: string; order: ServiceOrder; onOpenModal: () => void
}) {
  if (!diagnosis) {
    return (
      <Empty icon={<FileText size={28} />} title="Análise técnica ainda não registrada."
        sub="Adicione o diagnóstico para registrar os problemas encontrados no veículo."
        action={<button onClick={onOpenModal} className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}><Plus size={12} />Adicionar diagnóstico</button>} />
    )
  }
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <STitle>Diagnóstico técnico</STitle>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{diagnosis}</p>
      </div>
      {order.symptoms && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
          <STitle>Sintomas relatados</STitle>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{order.symptoms}</p>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onOpenModal} className="flex items-center gap-1.5 h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
          <FileText size={12} /> Editar diagnóstico
        </button>
      </div>
    </div>
  )
}

// ── Tab: Peças ────────────────────────────────────────────────────────────────

const PART_STATUS_LABEL: Record<LocalPart['partStatus'], string> = {
  RESERVADA: 'Reservada', USADA: 'Usada', PENDENTE: 'Pendente', SOLICITADA: 'Solicitada',
}
const ORIGIN_LABEL: Record<LocalPart['origin'], string> = {
  ESTOQUE: 'Estoque', COMPRA_EXTERNA: 'Compra externa', MANUAL: 'Manual',
}

function PartsTab({ parts, onAddPart }: { parts: LocalPart[]; onAddPart: () => void }) {
  const total = parts.reduce((s, p) => s + p.total, 0)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--text-muted)]">{parts.length} {parts.length === 1 ? 'peça' : 'peças'}{total > 0 ? ` · ${formatCurrency(total)}` : ''}</p>
        <button onClick={onAddPart} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
          <Plus size={12} />Adicionar peça
        </button>
      </div>
      {parts.length === 0 ? (
        <Empty icon={<Package size={28} />} title="Nenhuma peça adicionada." sub="Adicione as peças necessárias para a OS." />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_52px_80px_80px_90px_80px] gap-3 px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
            {['Descrição', 'Qtd', 'Unitário', 'Total', 'Origem', 'Status'].map(h => (
              <span key={h} className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {parts.map(p => (
              <div key={p.partId} className="grid grid-cols-1 sm:grid-cols-[1fr_52px_80px_80px_90px_80px] gap-3 items-center px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{p.description}</p>
                <span className="text-[12px] text-[var(--text-secondary)] sm:text-center tabular-nums">{p.quantity}×</span>
                <span className="text-[12px] text-[var(--text-secondary)] sm:text-right tabular-nums">{formatCurrency(p.unitPrice)}</span>
                <span className="text-[12px] font-bold text-[var(--text-primary)] sm:text-right tabular-nums">{formatCurrency(p.total)}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{ORIGIN_LABEL[p.origin]}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm inline-flex w-fit"
                  style={{ color: p.partStatus === 'USADA' ? 'var(--success)' : p.partStatus === 'PENDENTE' ? 'var(--warning)' : 'var(--info)', backgroundColor: p.partStatus === 'USADA' ? 'var(--success-subtle)' : p.partStatus === 'PENDENTE' ? 'var(--warning-subtle)' : 'var(--info-subtle)' }}>
                  {PART_STATUS_LABEL[p.partStatus]}
                </span>
              </div>
            ))}
          </div>
          {total > 0 && (
            <div className="flex justify-end gap-3 px-4 py-2.5 bg-[var(--surface-muted)] border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)]">Subtotal peças</span>
              <span className="text-[13px] font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(total)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab: Serviços ─────────────────────────────────────────────────────────────

function ServicesTab({ services, onAddService }: { services: LocalService[]; onAddService: () => void }) {
  const total = services.reduce((s, s2) => s + s2.value, 0)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--text-muted)]">{services.length} {services.length === 1 ? 'serviço' : 'serviços'}{total > 0 ? ` · ${formatCurrency(total)}` : ''}</p>
        <button onClick={onAddService} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
          <Plus size={12} />Adicionar serviço
        </button>
      </div>
      {services.length === 0 ? (
        <Empty icon={<Wrench size={28} />} title="Nenhum serviço adicionado." sub="Adicione os serviços realizados nesta OS." />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
          {services.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{s.description}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {s.responsavel && `${s.responsavel} · `}
                  {s.estimatedTime && `${s.estimatedTime} · `}
                  <span className={s.serviceStatus === 'CONCLUIDO' ? 'text-[var(--success)]' : s.serviceStatus === 'EM_ANDAMENTO' ? 'text-[var(--info)]' : 'text-[var(--text-muted)]'}>
                    {s.serviceStatus === 'CONCLUIDO' ? 'Concluído' : s.serviceStatus === 'EM_ANDAMENTO' ? 'Em andamento' : 'Pendente'}
                  </span>
                </p>
              </div>
              <span className="text-[13px] font-bold tabular-nums text-[var(--text-primary)] ml-4 flex-shrink-0">{formatCurrency(s.value)}</span>
            </div>
          ))}
          {total > 0 && (
            <div className="flex justify-end gap-3 px-4 py-2.5 bg-[var(--surface-muted)]">
              <span className="text-[11px] text-[var(--text-muted)]">Subtotal serviços</span>
              <span className="text-[13px] font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(total)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab: Orçamento ────────────────────────────────────────────────────────────

const ESTIMATE_CFG: Record<EstimateStatus, { label: string; color: string; bg: string }> = {
  NAO_GERADO:          { label: 'Não gerado',          color: 'var(--text-muted)',        bg: 'var(--surface-muted)' },
  AGUARDANDO_APROVACAO:{ label: 'Aguard. aprovação',   color: 'var(--os-aprovacao-text)', bg: 'var(--os-aprovacao-bg)' },
  APROVADO:            { label: 'Aprovado',             color: 'var(--success)',           bg: 'var(--success-subtle)' },
  RECUSADO:            { label: 'Recusado',             color: 'var(--danger)',            bg: 'var(--danger-subtle)' },
}

function EstimateTab({ order, parts, services, estimateStatus, onGenerate, onWhatsApp, onApprove, onRefuse }: {
  order: ServiceOrder; parts: LocalPart[]; services: LocalService[]
  estimateStatus: EstimateStatus
  onGenerate: () => void; onWhatsApp: () => void; onApprove: () => void; onRefuse: () => void
}) {
  const totalP = parts.reduce((s, p) => s + p.total, 0)
  const totalS = services.reduce((s, s2) => s + s2.value, 0)
  const total  = totalP + totalS || order.estimatedValue
  const cfg    = ESTIMATE_CFG[estimateStatus]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
        </div>
        <div className="flex gap-2">
          {estimateStatus === 'NAO_GERADO' && (
            <button onClick={onGenerate} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
              <FileText size={12} />Gerar orçamento
            </button>
          )}
          {estimateStatus === 'AGUARDANDO_APROVACAO' && (
            <button onClick={onWhatsApp} className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              <Send size={12} />Enviar WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-[12px] text-[var(--text-secondary)]">Peças</span>
            <span className="text-[12px] font-medium tabular-nums">{formatCurrency(totalP)}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-[12px] text-[var(--text-secondary)]">Serviços</span>
            <span className="text-[12px] font-medium tabular-nums">{formatCurrency(totalS)}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-4 bg-[var(--surface-muted)]">
            <span className="text-[15px] font-bold text-[var(--text-primary)]">Total</span>
            <span className="text-[22px] font-extrabold tabular-nums" style={{ color: 'var(--brand)' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {estimateStatus === 'AGUARDANDO_APROVACAO' && (
        <div className="flex gap-3">
          <button onClick={onApprove} className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--success)' }}>
            <CheckCircle2 size={12} />Marcar como aprovado
          </button>
          <button onClick={onRefuse} className="flex items-center gap-1.5 h-8 px-4 rounded border text-[12px] font-medium" style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)', backgroundColor: 'var(--danger-subtle)' }}>
            <XCircle size={12} />Marcar como recusado
          </button>
        </div>
      )}
    </div>
  )
}

// ── Tab: Histórico ────────────────────────────────────────────────────────────

function HistoryTab({ history, onAddComment }: { history: StatusHistoryEntry[]; onAddComment: () => void }) {
  const sorted = [...history].reverse()
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAddComment} className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
          <MessageSquare size={12} />Adicionar comentário
        </button>
      </div>
      <div className="relative pl-5">
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[var(--border)]" />
        <div className="space-y-4">
          {sorted.map((entry, i) => {
            const cfg = OS_STATUS_CFG[entry.status]
            return (
              <div key={i} className="relative">
                <span className="absolute -left-5 top-[3px] w-2.5 h-2.5 rounded-full border-2 border-[var(--surface)]"
                  style={{ backgroundColor: i === 0 ? `var(--os-${cfg.cssKey}-text)` : `var(--os-${cfg.cssKey}-bg)` }} />
                <div className="flex items-center gap-2 flex-wrap">
                  <OsChip status={entry.status} />
                  <span className="text-[10px] text-[var(--text-muted)]">{formatDateTime(entry.changedAt)}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">por {entry.changedBy}</span>
                </div>
                {entry.note && (
                  <p className="mt-1 text-[12px] text-[var(--text-secondary)] leading-relaxed">{entry.note}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Anexos ───────────────────────────────────────────────────────────────

function AttachmentsTab({ attachments, onAddPhoto, onAddFile }: {
  attachments: LocalAttachment[]; onAddPhoto: () => void; onAddFile: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--text-muted)]">{attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'}</p>
        <div className="flex gap-2">
          <button onClick={onAddPhoto} className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
            <Camera size={12} />Adicionar foto
          </button>
          <button onClick={onAddFile} className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
            <Upload size={12} />Adicionar arquivo
          </button>
        </div>
      </div>
      {attachments.length === 0 ? (
        <Empty icon={<Paperclip size={28} />} title="Nenhum anexo adicionado." sub="Adicione fotos do veículo, comprovantes ou outros documentos." />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
          {attachments.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-[var(--surface-muted)]">
                {a.type === 'foto' ? <Camera size={14} className="text-[var(--text-muted)]" /> : <FileText size={14} className="text-[var(--text-muted)]" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{a.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{a.addedAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function SideCard({ title, icon, children, accent }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: boolean
}) {
  return (
    <div className={cn('rounded-lg border bg-[var(--surface)] p-4', accent ? 'border-[rgba(212,96,26,0.25)]' : 'border-[var(--border)]')}>
      <div className="flex items-center gap-1.5 mb-3">
        <span className={accent ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}>{icon}</span>
        <h3 className="text-[12px] font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

const NEXT_ACTION_CFG: Partial<Record<ServiceOrderStatus, { text: string; sub: string }>> = {
  AGENDADO:             { text: 'Iniciar análise do veículo',       sub: 'Registre a entrada e inicie a análise técnica.' },
  EM_ANALISE:           { text: 'Adicionar diagnóstico técnico',    sub: 'Documente os problemas encontrados no veículo.' },
  AGUARDANDO_APROVACAO: { text: 'Aguardando resposta do cliente',   sub: 'Envie o orçamento e aguarde aprovação.' },
  EM_ANDAMENTO:         { text: 'Finalizar execução dos serviços',  sub: 'Conclua os serviços e atualize as peças.' },
  CONCLUIDO:            { text: 'Avisar cliente para retirada',     sub: 'O veículo está pronto para ser retirado.' },
  ENTREGUE:             { text: 'OS finalizada',                    sub: 'Veículo entregue ao cliente com sucesso.' },
}

// ── Main content component ────────────────────────────────────────────────────

function ServiceOrderDetailContent({ order }: { order: ServiceOrder }) {
  // ── Local state ───────────────────────────────────────────────────────────────
  const [status, setStatus]           = useState<ServiceOrderStatus>(order.status)
  const [parts, setParts]             = useState<LocalPart[]>(order.parts.map(p => ({ ...p, origin: 'ESTOQUE', partStatus: 'RESERVADA' })))
  const [services, setServices]       = useState<LocalService[]>([])
  const [history, setHistory]         = useState<StatusHistoryEntry[]>(order.statusHistory)
  const [diagnosis, setDiagnosis]     = useState(order.diagnosis ?? '')
  const [estimateStatus, setEstimate] = useState<EstimateStatus>(() => {
    if (['EM_ANDAMENTO', 'CONCLUIDO', 'ENTREGUE'].includes(order.status)) return 'APROVADO'
    if (order.status === 'AGUARDANDO_APROVACAO') return 'AGUARDANDO_APROVACAO'
    return 'NAO_GERADO'
  })
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [comments, setComments]       = useState<LocalComment[]>([])
  const [activeTab, setActiveTab]     = useState<OSTab>('resumo')
  const [modal, setModal]             = useState<ModalType>(null)
  const [toast, setToast]             = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const isCancelled = status === 'CANCELADO'
  const isDelivered = status === 'ENTREGUE'
  const canCancel   = !isCancelled && !isDelivered

  const totalP = parts.reduce((s, p) => s + p.total, 0)
  const totalS = services.reduce((s, s2) => s + s2.value, 0)
  const total  = totalP + totalS || order.estimatedValue

  const customer = useMemo(() => mockCustomers.find(c => c.id === order.customerId), [order.customerId])
  const vehicle  = useMemo(() => mockVehicles.find(v => v.id === order.vehicleId), [order.vehicleId])

  function addHistory(note: string, changedBy = 'Admin', newStatus?: ServiceOrderStatus) {
    setHistory(prev => [...prev, { status: newStatus ?? status, changedAt: new Date().toISOString(), changedBy, note }])
  }

  function showToast(message: string, variant: 'success' | 'error' = 'success') {
    setToast({ message, variant })
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleCancel(reason: string) {
    setStatus('CANCELADO')
    addHistory(`OS cancelada. Motivo: ${reason}`, 'Admin', 'CANCELADO')
    setModal(null)
    showToast('OS cancelada com sucesso.')
  }

  function handleStartAnalysis() {
    setStatus('EM_ANALISE')
    addHistory('Análise iniciada. Veículo recebido na oficina.', 'Admin', 'EM_ANALISE')
    setActiveTab('diagnostico')
    showToast('Análise iniciada.')
  }

  function handleSaveDiagnosis(text: string) {
    setDiagnosis(text)
    addHistory('Diagnóstico técnico registrado.')
    setModal(null)
    showToast('Diagnóstico salvo com sucesso.')
  }

  function handleFinishAnalysis() {
    if (!diagnosis.trim()) { showToast('Adicione um diagnóstico antes de finalizar a análise.', 'error'); setModal('diagnosis'); return }
    setStatus('AGUARDANDO_APROVACAO')
    addHistory('Análise finalizada. Aguardando aprovação do cliente.', 'Admin', 'AGUARDANDO_APROVACAO')
    setActiveTab('orcamento')
    showToast('Análise finalizada. Status atualizado para "Aguard. aprovação".')
  }

  function handleAddPart(p: LocalPart) {
    setParts(prev => [...prev, p])
    addHistory(`Peça adicionada: ${p.description} (${p.quantity}×).`)
    setModal(null)
    showToast('Peça adicionada com sucesso.')
  }

  function handleAddService(s: LocalService) {
    setServices(prev => [...prev, s])
    addHistory(`Serviço adicionado: ${s.description}.`)
    setModal(null)
    showToast('Serviço adicionado com sucesso.')
  }

  function handleGenerateEstimate() {
    setEstimate('AGUARDANDO_APROVACAO')
    addHistory(`Orçamento gerado. Total: ${formatCurrency(total)}.`)
    showToast('Orçamento gerado com sucesso.')
  }

  function handleApproveEstimate() {
    setEstimate('APROVADO')
    setStatus('EM_ANDAMENTO')
    addHistory('Orçamento aprovado pelo cliente. OS em execução.', 'Admin', 'EM_ANDAMENTO')
    showToast('Orçamento aprovado. OS em execução.')
  }

  function handleRefuseEstimate(reason: string) {
    setEstimate('RECUSADO')
    addHistory(`Orçamento recusado pelo cliente. Motivo: ${reason}.`)
    setModal(null)
    showToast('Orçamento marcado como recusado.')
  }

  function handleComplete() {
    setStatus('CONCLUIDO')
    addHistory('Serviços concluídos. Veículo pronto para retirada.', 'Admin', 'CONCLUIDO')
    showToast('OS concluída.')
  }

  function handleDeliver() {
    setStatus('ENTREGUE')
    addHistory('Veículo entregue ao cliente.', 'Admin', 'ENTREGUE')
    showToast('Veículo entregue. OS encerrada.')
  }

  function handleAddComment(c: LocalComment) {
    setComments(prev => [...prev, c])
    addHistory(`Comentário adicionado (${c.visibility === 'CLIENTE' ? 'visível ao cliente' : 'interno'}): ${c.text.slice(0, 50)}${c.text.length > 50 ? '…' : ''}`)
    setModal(null)
    showToast('Comentário adicionado.')
  }

  function handleAddAttachment(type: 'foto' | 'documento') {
    const name = type === 'foto' ? `foto_${Date.now()}.jpg` : `documento_${Date.now()}.pdf`
    const attachment: LocalAttachment = { id: `la-${Date.now()}`, name, type, addedAt: new Date().toLocaleDateString('pt-BR') }
    setAttachments(prev => [...prev, attachment])
    addHistory(`Anexo adicionado: ${name}.`)
    showToast(`${type === 'foto' ? 'Foto' : 'Arquivo'} adicionado.`)
  }

  // ── Primary action button logic ────────────────────────────────────────────

  function renderHeaderAction() {
    if (isCancelled || isDelivered) return null
    if (status === 'AGENDADO') {
      return <button onClick={handleStartAnalysis} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}><Play size={12} />Iniciar Análise</button>
    }
    if (status === 'EM_ANALISE') {
      return (
        <>
          <button onClick={() => setModal('diagnosis')} className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"><FileText size={12} />Diagnóstico</button>
          <button onClick={handleFinishAnalysis} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}><ChevronRight size={12} />Finalizar Análise</button>
        </>
      )
    }
    if (status === 'AGUARDANDO_APROVACAO') {
      return <button onClick={() => setModal('whatsapp')} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}><Send size={12} />Enviar Orçamento</button>
    }
    if (status === 'EM_ANDAMENTO') {
      return <button onClick={handleComplete} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}><CheckCircle2 size={12} />Concluir OS</button>
    }
    if (status === 'CONCLUIDO') {
      return <button onClick={handleDeliver} className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}><Truck size={12} />Registrar Entrega</button>
    }
    return null
  }

  const nextActionCfg = NEXT_ACTION_CFG[status]

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1180px] mx-auto px-5 py-6 space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px]">
          <Link to="/servicos" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1">
            <ChevronLeft size={12} /> Serviços
          </Link>
          <ChevronRight size={11} className="text-[var(--text-disabled)]" />
          <Link to="/ordens-servico" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">Ordens de Serviço</Link>
          <ChevronRight size={11} className="text-[var(--text-disabled)]" />
          <span className="font-semibold text-[var(--text-primary)]">OS #{order.number}</span>
        </nav>

        {/* Header */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-extrabold text-[var(--text-primary)] tracking-tight">OS #{order.number}</h1>
                <OsChip status={status} />
                <PrioBadge priority={order.priority} />
                <TypeBadge type={order.type} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><Car size={12} className="text-[var(--text-muted)]" />{order.vehicle}</span>
                <span className="flex items-center gap-1 font-mono">{order.plate}</span>
                <span className="flex items-center gap-1"><User size={12} className="text-[var(--text-muted)]" />{order.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
              {canCancel && (
                <button onClick={() => setModal('cancel')} className="flex items-center gap-1.5 h-7 px-3 rounded border text-[12px] font-medium transition-colors" style={{ color: 'var(--danger)', borderColor: 'rgba(168,40,40,0.30)', backgroundColor: 'var(--danger-subtle)' }}>
                  <XCircle size={12} />Cancelar
                </button>
              )}
              {isCancelled && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-subtle)' }}>OS Cancelada</span>
              )}
              {renderHeaderAction()}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-4 items-start">

          {/* ── Left column ──────────────────────────────────────── */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-[var(--border)] px-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }} role="tablist">
              {TABS.map(t => {
                const badge = t.key === 'pecas' ? parts.length : t.key === 'servicos' ? services.length : t.key === 'anexos' ? attachments.length : 0
                return (
                  <button key={t.key} role="tab" aria-selected={activeTab === t.key} onClick={() => setActiveTab(t.key)}
                    className={cn('relative flex items-center gap-1.5 h-10 px-3 sm:px-4 text-[12px] font-medium whitespace-nowrap transition-colors flex-shrink-0',
                      activeTab === t.key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
                    {t.label}
                    {badge > 0 && <span className="text-[9px] font-bold px-1.5 py-px rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)]">{badge}</span>}
                    {activeTab === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ backgroundColor: 'var(--brand)' }} />}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="p-5">
              {activeTab === 'resumo'      && <ResumoTab order={order} parts={parts} services={services} status={status} customer={customer} vehicle={vehicle} />}
              {activeTab === 'diagnostico' && <DiagnosisTab diagnosis={diagnosis} order={order} onOpenModal={() => setModal('diagnosis')} />}
              {activeTab === 'pecas'       && <PartsTab parts={parts} onAddPart={() => setModal('addPart')} />}
              {activeTab === 'servicos'    && <ServicesTab services={services} onAddService={() => setModal('addService')} />}
              {activeTab === 'orcamento'   && (
                <EstimateTab order={order} parts={parts} services={services} estimateStatus={estimateStatus}
                  onGenerate={handleGenerateEstimate} onWhatsApp={() => setModal('whatsapp')}
                  onApprove={handleApproveEstimate} onRefuse={() => setModal('refuseEstimate')} />
              )}
              {activeTab === 'historico'   && <HistoryTab history={history} onAddComment={() => setModal('addComment')} />}
              {activeTab === 'anexos'      && <AttachmentsTab attachments={attachments} onAddPhoto={() => handleAddAttachment('foto')} onAddFile={() => handleAddAttachment('documento')} />}
            </div>
          </div>

          {/* ── Right sidebar ─────────────────────────────────────── */}
          <div className="space-y-3 lg:sticky lg:top-[52px]">

            {/* Próxima ação */}
            {nextActionCfg && !isCancelled && (
              <SideCard title="Próxima ação" icon={<Clock size={13} />} accent>
                <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{nextActionCfg.text}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">{nextActionCfg.sub}</p>
              </SideCard>
            )}

            {/* Resumo financeiro */}
            <SideCard title="Resumo financeiro" icon={<DollarSign size={13} />}>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]"><span className="text-[var(--text-muted)]">Peças</span><span className="tabular-nums">{formatCurrency(totalP)}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-[var(--text-muted)]">Serviços</span><span className="tabular-nums">{formatCurrency(totalS)}</span></div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[var(--border)]">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">Total</span>
                  <span className="text-[18px] font-extrabold tabular-nums" style={{ color: 'var(--brand)' }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </SideCard>

            {/* Cliente */}
            <SideCard title="Cliente" icon={<User size={13} />}>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{order.customerName}</p>
              {customer?.phone && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[var(--text-secondary)]">
                  <Phone size={10} className="text-[var(--text-muted)]" />{customer.phone}
                </div>
              )}
              {customer?.email && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--text-secondary)]">
                  <Mail size={10} className="text-[var(--text-muted)]" />{customer.email}
                </div>
              )}
              <Link to={`/cadastros/clientes/${order.customerId}`} className="mt-2.5 text-[11px] font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--brand)' }}>
                Ver cliente <ChevronRight size={10} />
              </Link>
            </SideCard>

            {/* Veículo */}
            <SideCard title="Veículo" icon={<Car size={13} />}>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{order.vehicle}</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">{order.plate}</p>
              {vehicle?.currentKm != null && (
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">{vehicle.currentKm.toLocaleString('pt-BR')} km</p>
              )}
              <Link to="/veiculos" className="mt-2.5 text-[11px] font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--brand)' }}>
                Ver veículo <ChevronRight size={10} />
              </Link>
            </SideCard>

            {/* Mecânico */}
            <SideCard title="Mecânico" icon={<Wrench size={13} />}>
              <div className="flex items-center gap-2.5">
                <Avatar initials={order.mechanic.initials} size="md" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{order.mechanic.name}</p>
                  {order.mechanic.specialty && (
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{order.mechanic.specialty}</p>
                  )}
                </div>
              </div>
            </SideCard>

            {/* Datas */}
            <SideCard title="Datas" icon={<CalendarDays size={13} />}>
              <div className="space-y-2">
                <LField label="Entrada"         value={formatDateFull(order.entryDate)} />
                {order.estimatedDelivery && <LField label="Previsão entrega" value={formatDateFull(order.estimatedDelivery)} />}
                {order.deliveredAt       && <LField label="Entregue em"      value={formatDateFull(order.deliveredAt)} />}
              </div>
            </SideCard>

            {/* Interações */}
            <SideCard title="Interações" icon={<MessageSquare size={13} />}>
              <div className="space-y-1.5">
                <button onClick={() => { setActiveTab('historico'); setModal('addComment') }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] transition-colors">
                  <span className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]"><MessageSquare size={12} style={{ color: '#3B82F6' }} />Comentários</span>
                  <span className="text-[10px] font-bold px-1.5 py-px rounded-full text-[#3B82F6] bg-[rgba(59,130,246,0.10)]">{comments.length + order.commentsCount}</span>
                </button>
                <button onClick={() => setActiveTab('anexos')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] transition-colors">
                  <span className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]"><Paperclip size={12} style={{ color: '#8B5CF6' }} />Anexos</span>
                  <span className="text-[10px] font-bold px-1.5 py-px rounded-full text-[#8B5CF6] bg-[rgba(139,92,246,0.10)]">{attachments.length + order.attachmentsCount}</span>
                </button>
              </div>
            </SideCard>

          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {modal === 'cancel'          && <CancelModal onConfirm={handleCancel} onClose={() => setModal(null)} />}
      {modal === 'diagnosis'       && <DiagnosisModal initial={diagnosis} onSave={handleSaveDiagnosis} onClose={() => setModal(null)} />}
      {modal === 'addPart'         && <AddPartModal onAdd={handleAddPart} onClose={() => setModal(null)} />}
      {modal === 'addService'      && <AddServiceModal onAdd={handleAddService} onClose={() => setModal(null)} />}
      {modal === 'estimatePreview' && <EstimatePreviewModal order={order} parts={parts} services={services} onClose={() => setModal(null)} />}
      {modal === 'whatsapp'        && <WhatsAppModal order={order} parts={parts} services={services} onClose={() => setModal(null)} />}
      {modal === 'refuseEstimate'  && <RefuseEstimateModal onConfirm={handleRefuseEstimate} onClose={() => setModal(null)} />}
      {modal === 'addComment'      && <AddCommentModal onAdd={handleAddComment} onClose={() => setModal(null)} />}

      {/* Toast */}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const order = mockServiceOrders.find(o => o.id === id)

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-3">
        <AlertTriangle size={32} className="text-[var(--text-disabled)]" />
        <p className="text-[14px] font-semibold text-[var(--text-secondary)]">Ordem de serviço não encontrada</p>
        <button onClick={() => navigate('/servicos')} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
          Voltar para Serviços
        </button>
      </div>
    )
  }

  return <ServiceOrderDetailContent order={order} />
}
