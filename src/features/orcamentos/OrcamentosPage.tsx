import { useState, useMemo } from 'react'
import {
  FileText, Plus, Search, Send, CheckCircle2, XCircle,
  ArrowRight, Clock, AlertTriangle,
  MessageCircle, ClipboardList, Printer,
  User, Car, Calendar, Tag,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { mockBudgets } from '../../mocks/budgets'
import { mockCustomers } from '../../mocks/customers'
import { mockVehicles } from '../../mocks/vehicles'
import type { Budget, BudgetStatus } from '../../types'
import { EntityDrawer } from '../../components/ui/EntityDrawer'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { ActionMenu, type ActionMenuItem } from '../../components/ui/ActionMenu'
import { toast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<BudgetStatus, { label: string; color: string; bg: string; border: string }> = {
  RASCUNHO:             { label: 'Rascunho',           color: 'var(--text-muted)',   bg: 'var(--surface-muted)',   border: 'var(--border)' },
  ENVIADO:              { label: 'Enviado',             color: 'var(--info)',         bg: 'var(--info-subtle)',     border: 'var(--info-border)' },
  VISUALIZADO:          { label: 'Visualizado',         color: '#6D28D9',            bg: '#F3F0FA',               border: '#C4B5FD' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação',  color: 'var(--warning)',      bg: 'var(--warning-subtle)', border: 'var(--warning-border)' },
  APROVADO_PARCIAL:     { label: 'Aprovado parcial',   color: 'var(--success)',      bg: 'var(--success-subtle)', border: 'var(--success-border)' },
  APROVADO:             { label: 'Aprovado',            color: 'var(--success)',      bg: 'var(--success-subtle)', border: 'var(--success-border)' },
  RECUSADO:             { label: 'Recusado',            color: 'var(--danger)',       bg: 'var(--danger-subtle)',  border: 'var(--danger-border)' },
  EXPIRADO:             { label: 'Expirado',            color: 'var(--text-muted)',   bg: 'var(--surface-muted)',  border: 'var(--border)' },
  CONVERTIDO:           { label: 'Convertido em OS',   color: 'var(--brand)',        bg: 'var(--brand-muted)',    border: 'rgba(212,96,26,0.3)' },
  CANCELADO:            { label: 'Cancelado',           color: 'var(--danger)',       bg: 'var(--danger-subtle)',  border: 'var(--danger-border)' },
}

const NEXT_ACTION: Partial<Record<BudgetStatus, { label: string; color: string }>> = {
  RASCUNHO:             { label: '→ Enviar ao cliente',  color: 'var(--brand)' },
  ENVIADO:              { label: '→ Aguardar retorno',   color: 'var(--info)' },
  VISUALIZADO:          { label: '→ Cobrar retorno',     color: '#6D28D9' },
  AGUARDANDO_APROVACAO: { label: '→ Cobrar resposta',    color: 'var(--warning)' },
  APROVADO:             { label: '→ Converter em OS',    color: 'var(--success)' },
}

const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate  = (s: string) => new Date(s).toLocaleDateString('pt-BR')
const fmtDT    = (s: string) => new Date(s).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
const isExpired = (b: Budget) =>
  !['APROVADO','APROVADO_PARCIAL','RECUSADO','CANCELADO','CONVERTIDO'].includes(b.status) &&
  new Date(b.validUntil) < new Date()

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BudgetStatus }) {
  const cfg = STATUS_CFG[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  )
}

// ── Budget Detail Drawer ──────────────────────────────────────────────────────

interface DetailDrawerProps {
  budget: Budget | null
  onClose: () => void
  onAction: (action: 'send' | 'approve' | 'reject' | 'convert' | 'cancel', budget: Budget) => void
}

function BudgetDetailDrawer({ budget, onClose, onAction }: DetailDrawerProps) {
  if (!budget) return null
  const expired = isExpired(budget)

  const footer = (
    <div className="flex flex-wrap gap-2">
      {budget.status === 'RASCUNHO' && (
        <button
          onClick={() => onAction('send', budget)}
          className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold hover:bg-[var(--brand-dark)] transition-colors"
        >
          <Send size={12} /> Enviar ao cliente
        </button>
      )}
      {(budget.status === 'AGUARDANDO_APROVACAO' || budget.status === 'VISUALIZADO') && (
        <>
          <button
            onClick={() => onAction('approve', budget)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[var(--success)] text-white text-[12px] font-semibold hover:opacity-90 transition-colors"
          >
            <CheckCircle2 size={12} /> Registrar aprovação
          </button>
          <button
            onClick={() => onAction('reject', budget)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg border border-[var(--border)] text-[var(--danger)] text-[12px] font-semibold hover:bg-[var(--danger-subtle)] transition-colors"
          >
            <XCircle size={12} /> Recusar
          </button>
        </>
      )}
      {(budget.status === 'ENVIADO' || budget.status === 'VISUALIZADO' || budget.status === 'AGUARDANDO_APROVACAO') && (
        <a
          href={`https://wa.me/?text=Olá, gostaria de saber sobre o orçamento ${budget.number}...`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-[12px] font-medium hover:bg-[var(--surface-hover)] transition-colors"
          onClick={(e) => { e.preventDefault(); toast.info('WhatsApp: funcionalidade disponível após integração') }}
        >
          <MessageCircle size={12} /> WhatsApp
        </a>
      )}
      {budget.status === 'APROVADO' && !budget.convertedToOsId && (
        <button
          onClick={() => onAction('convert', budget)}
          className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold hover:bg-[var(--brand-dark)] transition-colors"
        >
          <ClipboardList size={12} /> Converter em OS
        </button>
      )}
      {budget.convertedToOsId && (
        <Link
          to="/servicos"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--brand)]/30 text-[var(--brand)] text-[12px] font-medium hover:bg-[var(--brand-muted)] transition-colors"
        >
          <ArrowRight size={12} /> Ver OS vinculada
        </Link>
      )}
      {!['CANCELADO','CONVERTIDO','RECUSADO'].includes(budget.status) && (
        <button
          onClick={() => onAction('cancel', budget)}
          className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg text-[var(--text-muted)] text-[12px] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
        >
          Cancelar orçamento
        </button>
      )}
    </div>
  )

  return (
    <EntityDrawer
      open={!!budget}
      onClose={onClose}
      title={budget.number}
      subtitle={`${budget.customerName} · ${budget.vehicle} · ${budget.plate}`}
      size="lg"
      footer={footer}
    >
      <div className="p-5 space-y-5">
        {/* Status + alerts */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={budget.status} />
          {expired && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border text-[var(--danger)] bg-[var(--danger-subtle)] border-[var(--danger-border)]">
              <AlertTriangle size={10} /> Prazo expirado
            </span>
          )}
          {budget.convertedToOsId && (
            <span className="text-[11px] text-[var(--text-muted)]">→ OS {budget.convertedToOsNumber}</span>
          )}
        </div>

        {/* Meta cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <User size={12} />, label: 'Cliente', value: budget.customerName },
            { icon: <Car size={12} />, label: 'Veículo', value: `${budget.vehicle} · ${budget.plate}` },
            { icon: <Calendar size={12} />, label: 'Válido até', value: fmtDate(budget.validUntil) },
            { icon: <Clock size={12} />, label: 'Prazo estimado', value: `${budget.estimatedDays} dia${budget.estimatedDays > 1 ? 's' : ''}` },
          ].map(m => (
            <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                {m.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wide">{m.label}</span>
              </div>
              <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Diagnóstico */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Diagnóstico</p>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-muted)] rounded-lg px-3 py-2.5 border border-[var(--border)]">
            {budget.diagnosis}
          </p>
        </div>

        {/* Itens */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Itens do orçamento</p>
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[var(--surface-muted)] border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Item</th>
                  <th className="text-center px-2 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide w-12">Qtd</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Unit.</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {budget.items.map((item, i) => (
                  <tr key={item.id} className={cn('border-b border-[var(--border)] last:border-0', i % 2 === 0 ? '' : 'bg-[var(--surface-muted)]/40')}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', {
                          SERVICO: 'bg-[var(--brand)]',
                          PECA:    'bg-[var(--info)]',
                          OUTRO:   'bg-[var(--text-muted)]',
                        }[item.type])} />
                        <span className="text-[var(--text-primary)] font-medium">{item.description}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center text-[var(--text-secondary)]">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-[var(--text-secondary)] financial-value">{fmtMoney(item.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right text-[var(--text-primary)] font-medium financial-value">{fmtMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totais */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] divide-y divide-[var(--border)]">
          <div className="flex justify-between items-center px-4 py-2.5 text-[13px]">
            <span className="text-[var(--text-secondary)]">Subtotal</span>
            <span className="font-medium financial-value">{fmtMoney(budget.subtotal)}</span>
          </div>
          {budget.discountValue > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5 text-[13px]">
              <span className="text-[var(--success)]">Desconto ({budget.discountPercent}%)</span>
              <span className="font-medium text-[var(--success)] financial-value">− {fmtMoney(budget.discountValue)}</span>
            </div>
          )}
          <div className="flex justify-between items-center px-4 py-3 text-[14px]">
            <span className="font-semibold text-[var(--text-primary)]">Total</span>
            <span className="font-bold text-[var(--text-primary)] financial-value">{fmtMoney(budget.total)}</span>
          </div>
        </div>

        {/* Condições */}
        <div className="grid grid-cols-1 gap-3">
          <InfoRow icon={<Tag size={12} />} label="Condições de pagamento" value={budget.paymentTerms} />
          <InfoRow icon={<CheckCircle2 size={12} />} label="Garantia" value={budget.warranty} />
          <InfoRow icon={<User size={12} />} label="Responsável" value={budget.responsibleName} />
        </div>

        {/* Histórico de status */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Histórico</p>
          <div className="space-y-3">
            {[
              { label: 'Criado',    date: budget.createdAt,   show: true },
              { label: 'Enviado',   date: budget.sentAt,      show: !!budget.sentAt },
              { label: 'Visualizado', date: budget.viewedAt,  show: !!budget.viewedAt },
              { label: 'Aprovado',  date: budget.approvedAt,  show: !!budget.approvedAt },
              { label: 'Recusado',  date: budget.rejectedAt,  show: !!budget.rejectedAt },
            ].filter(e => e.show).map((entry, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-medium text-[var(--text-primary)]">{entry.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{entry.date ? fmtDT(entry.date) : ''}</p>
                </div>
              </div>
            ))}
            {budget.rejectionReason && (
              <div className="ml-4.5 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-subtle)] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-[var(--danger)] mb-1">Motivo da recusa</p>
                <p className="text-[12px] text-[var(--danger)]">{budget.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </EntityDrawer>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <span className="text-[var(--text-muted)] mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <span className="text-[var(--text-muted)]">{label}: </span>
        <span className="text-[var(--text-primary)] font-medium">{value}</span>
      </div>
    </div>
  )
}

// ── New Budget Drawer ─────────────────────────────────────────────────────────

interface NewBudgetDrawerProps {
  open: boolean
  onClose: () => void
  onCreate: (budget: Budget) => void
}

function NewBudgetDrawer({ open, onClose, onCreate }: NewBudgetDrawerProps) {
  const [customerId, setCustomerId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('À vista')
  const [warranty, setWarranty] = useState('90 dias nos serviços')
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]
  })
  type ItemDraft = { id: string; type: 'SERVICO' | 'PECA' | 'OUTRO'; description: string; quantity: number; unitPrice: number; total: number; approved: boolean }
  const [items, setItems] = useState<ItemDraft[]>([
    { id: 'ni1', type: 'SERVICO', description: '', quantity: 1, unitPrice: 0, total: 0, approved: true },
  ])

  const customerVehicles = useMemo(
    () => mockVehicles.filter(v => v.customerId === customerId),
    [customerId]
  )

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  function updateItem(id: string, field: string, value: string | number) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      updated.total = updated.quantity * updated.unitPrice
      return updated
    }))
  }

  function addItem() {
    setItems(prev => [
      ...prev,
      { id: `ni${Date.now()}`, type: 'PECA' as const, description: '', quantity: 1, unitPrice: 0, total: 0, approved: true },
    ])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function handleCreate() {
    if (!customerId || !vehicleId || !diagnosis.trim()) {
      toast.error('Preencha cliente, veículo e diagnóstico')
      return
    }
    if (items.some(i => !i.description.trim())) {
      toast.error('Todos os itens precisam de descrição')
      return
    }
    const customer = mockCustomers.find(c => c.id === customerId)
    const vehicle  = mockVehicles.find(v => v.id === vehicleId)
    if (!customer || !vehicle) return

    const newBudget: Budget = {
      id: `b${Date.now()}`,
      number: `ORC-2026-${String(Date.now()).slice(-3)}`,
      status: 'RASCUNHO',
      version: 1,
      customerId,
      customerName: customer.name,
      vehicleId,
      vehicle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
      plate: vehicle.plate,
      diagnosis,
      items: items.map(i => ({ ...i, total: i.quantity * i.unitPrice })),
      subtotal,
      discountPercent: 0,
      discountValue: 0,
      total: subtotal,
      validUntil,
      estimatedDays: 1,
      paymentTerms,
      warranty,
      responsibleId: 'm1',
      responsibleName: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onCreate(newBudget)
    toast.success(`Orçamento ${newBudget.number} criado com sucesso`)
    onClose()
  }

  const inputClass = cn(
    'w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]',
    'text-[13px] text-[var(--text-primary)] px-3',
    'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50',
  )
  const labelClass = 'block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide'

  return (
    <EntityDrawer
      open={open}
      onClose={onClose}
      title="Novo Orçamento"
      subtitle="Preencha os dados para criar o rascunho"
      size="lg"
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-[var(--border)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
            Cancelar
          </button>
          <button onClick={handleCreate} className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-dark)] transition-colors">
            Criar rascunho
          </button>
        </div>
      }
    >
      <div className="p-5 space-y-5">
        {/* Cliente */}
        <div>
          <label className={labelClass}>Cliente *</label>
          <select className={inputClass} value={customerId} onChange={e => { setCustomerId(e.target.value); setVehicleId('') }}>
            <option value="">Selecione o cliente...</option>
            {mockCustomers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Veículo */}
        <div>
          <label className={labelClass}>Veículo *</label>
          <select className={inputClass} value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={!customerId}>
            <option value="">Selecione o veículo...</option>
            {customerVehicles.map(v => (
              <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} · {v.plate}</option>
            ))}
          </select>
          {customerId && customerVehicles.length === 0 && (
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Nenhum veículo cadastrado para este cliente.</p>
          )}
        </div>

        {/* Diagnóstico */}
        <div>
          <label className={labelClass}>Diagnóstico *</label>
          <textarea
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="Descreva o diagnóstico e o motivo do orçamento..."
            rows={3}
            className={cn(inputClass, 'h-auto py-2.5 resize-none')}
          />
        </div>

        {/* Itens */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass + ' mb-0'}>Itens</label>
            <button onClick={addItem} className="flex items-center gap-1 text-[11px] text-[var(--brand)] font-semibold hover:underline">
              <Plus size={11} /> Adicionar item
            </button>
          </div>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                <div className="col-span-3 flex gap-2">
                  <select
                    className={cn(inputClass, 'w-24 flex-shrink-0')}
                    value={item.type}
                    onChange={e => updateItem(item.id, 'type', e.target.value)}
                  >
                    <option value="SERVICO">Serviço</option>
                    <option value="PECA">Peça</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                  <input
                    className={cn(inputClass, 'flex-1')}
                    placeholder="Descrição do item..."
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-16">
                    <p className="text-[9px] text-[var(--text-muted)] mb-0.5">Qtd</p>
                    <input
                      type="number"
                      min="1"
                      className={cn(inputClass, 'text-center')}
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-[var(--text-muted)] mb-0.5">Preço unit. (R$)</p>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={item.unitPrice || ''}
                      onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                    />
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-[9px] text-[var(--text-muted)] mb-0.5">Total</p>
                    <p className="text-[12px] font-semibold text-[var(--text-primary)] financial-value">{fmtMoney(item.quantity * item.unitPrice)}</p>
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors mt-4"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-3 pt-3 border-t border-[var(--border)]">
            <div className="text-right">
              <p className="text-[11px] text-[var(--text-muted)]">Total estimado</p>
              <p className="text-[16px] font-bold text-[var(--text-primary)] financial-value">{fmtMoney(subtotal)}</p>
            </div>
          </div>
        </div>

        {/* Condições */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Válido até *</label>
            <input type="date" className={inputClass} value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Garantia</label>
            <input className={inputClass} value={warranty} onChange={e => setWarranty(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Condições de pagamento</label>
          <input className={inputClass} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
        </div>
      </div>
    </EntityDrawer>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: BudgetStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando' },
  { value: 'APROVADO', label: 'Aprovados' },
  { value: 'RECUSADO', label: 'Recusados' },
  { value: 'CONVERTIDO', label: 'Convertidos' },
]

type ConfirmAction = 'send' | 'approve' | 'reject' | 'convert' | 'cancel'

const CONFIRM_CFG: Record<ConfirmAction, {
  title: string; message: string; label: string; variant: 'danger' | 'warning' | 'default'; requireReason: boolean
}> = {
  send:    { title: 'Enviar orçamento',    message: 'O orçamento será marcado como enviado. Deseja continuar?', label: 'Enviar',   variant: 'default', requireReason: false },
  approve: { title: 'Aprovar orçamento',   message: 'Confirme que o cliente aprovou o orçamento.',              label: 'Aprovar',  variant: 'default', requireReason: false },
  reject:  { title: 'Recusar orçamento',   message: 'Registre o motivo da recusa informado pelo cliente.',      label: 'Recusar',  variant: 'danger',  requireReason: true },
  convert: { title: 'Converter em OS',     message: 'Uma Ordem de Serviço será criada a partir deste orçamento aprovado.', label: 'Converter', variant: 'default', requireReason: false },
  cancel:  { title: 'Cancelar orçamento',  message: 'O orçamento será cancelado. Informe o motivo.',           label: 'Cancelar', variant: 'danger',  requireReason: true },
}

export function OrcamentosPage() {
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | ''>('')
  const [selected, setSelected] = useState<Budget | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirm, setConfirm]   = useState<{ action: ConfirmAction; budget: Budget } | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return budgets.filter(b => {
      const matchSearch = !q || b.number.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) || b.vehicle.toLowerCase().includes(q) ||
        b.plate.toLowerCase().includes(q)
      const matchStatus = !statusFilter || b.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [budgets, search, statusFilter])

  // KPIs
  const kpis = useMemo(() => ({
    total:      budgets.length,
    aguardando: budgets.filter(b => b.status === 'AGUARDANDO_APROVACAO').length,
    aprovados:  budgets.filter(b => ['APROVADO','APROVADO_PARCIAL'].includes(b.status)).length,
    rascunhos:  budgets.filter(b => b.status === 'RASCUNHO').length,
    valorAberto: budgets
      .filter(b => ['AGUARDANDO_APROVACAO','ENVIADO','VISUALIZADO','RASCUNHO'].includes(b.status))
      .reduce((s, b) => s + b.total, 0),
  }), [budgets])

  function handleAction(action: ConfirmAction, budget: Budget) {
    setConfirm({ action, budget })
  }

  function executeAction(action: ConfirmAction, budget: Budget, reason?: string) {
    const now = new Date().toISOString()
    setBudgets(prev => prev.map(b => {
      if (b.id !== budget.id) return b
      switch (action) {
        case 'send':
          return { ...b, status: 'ENVIADO', sentAt: now, updatedAt: now }
        case 'approve':
          return { ...b, status: 'APROVADO', approvedAt: now, updatedAt: now }
        case 'reject':
          return { ...b, status: 'RECUSADO', rejectedAt: now, rejectionReason: reason, updatedAt: now }
        case 'convert': {
          const osNumber = `2026-0000${String(prev.length + 11).padStart(2, '0')}`
          return { ...b, status: 'CONVERTIDO', convertedToOsId: `os${Date.now()}`, convertedToOsNumber: osNumber, updatedAt: now }
        }
        case 'cancel':
          return { ...b, status: 'CANCELADO', rejectionReason: reason, updatedAt: now }
        default: return b
      }
    }))

    const messages: Record<ConfirmAction, string> = {
      send:    'Orçamento marcado como enviado',
      approve: 'Orçamento aprovado com sucesso',
      reject:  'Recusa registrada',
      convert: 'OS criada a partir do orçamento',
      cancel:  'Orçamento cancelado',
    }
    toast.success(messages[action])

    // Update selected if drawer is open
    setSelected(prev => prev?.id === budget.id
      ? budgets.find(b => b.id === budget.id) ?? prev
      : prev
    )
    if (action === 'convert') {
      setTimeout(() => setSelected(null), 500)
    }
  }

  const pendingApproval = budgets.filter(b => b.status === 'AGUARDANDO_APROVACAO').length
  const approvedPending = budgets.filter(b => b.status === 'APROVADO' && !b.convertedToOsId).length

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* ── Fixed header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* Title + CTA */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Orçamentos</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Gerencie propostas, acompanhe aprovações e converta em OS</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[11px] font-bold transition-all hover:shadow-md hover:-translate-y-px flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}
          >
            <Plus size={12} strokeWidth={2.5} /> Novo orçamento
          </button>
        </div>

        {/* KPI chips */}
        <div className="flex items-center gap-3 mb-3">
          {[
            { label: 'Total',      value: kpis.total,                  color: '#6B7280' },
            { label: 'Aguardando', value: kpis.aguardando,             color: '#F59E0B' },
            { label: 'Aprovados',  value: kpis.aprovados,              color: '#16A34A' },
            { label: 'Rascunhos',  value: kpis.rascunhos,              color: '#9CA3AF' },
            { label: 'Em aberto',  value: fmtMoney(kpis.valorAberto),  color: '#F97316' },
          ].map((k, i) => (
            <div key={k.label} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-3.5 bg-[var(--border)] flex-shrink-0" />}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: k.color }} />
                <span className="font-bold tabular-nums" style={{ color: k.color }}>{k.value}</span>
                <span className="text-[var(--text-muted)]">{k.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div className="space-y-2 mb-3">
          {pendingApproval > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px]"
              style={{ background: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
              <AlertTriangle size={12} style={{ color: 'var(--warning)' }} className="flex-shrink-0" />
              <p className="flex-1 font-medium" style={{ color: 'var(--warning)' }}>
                {pendingApproval} orçamento{pendingApproval > 1 ? 's' : ''} aguardando resposta do cliente
              </p>
              <button onClick={() => setStatusFilter('AGUARDANDO_APROVACAO')}
                className="font-semibold underline hover:no-underline flex-shrink-0" style={{ color: 'var(--warning)' }}>
                Ver →
              </button>
            </div>
          )}
          {approvedPending > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px]"
              style={{ background: 'var(--success-subtle)', borderColor: 'var(--success-border)' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--success)' }} className="flex-shrink-0" />
              <p className="flex-1 font-medium" style={{ color: 'var(--success)' }}>
                {approvedPending} orçamento{approvedPending > 1 ? 's' : ''} aprovado{approvedPending > 1 ? 's' : ''} — converta em OS
              </p>
              <button onClick={() => setStatusFilter('APROVADO')}
                className="font-semibold underline hover:no-underline flex-shrink-0" style={{ color: 'var(--success)' }}>
                Ver →
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-[340px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, veículo ou placa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'h-8 px-3 rounded-lg border text-[11px] font-medium transition-colors',
                  statusFilter === f.value
                    ? 'border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* ── Scrollable table area ── */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-5">
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={32} className="text-[var(--text-disabled)] mb-3" />
            <p className="text-[14px] font-semibold text-[var(--text-secondary)] mb-1">
              {search || statusFilter ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento ainda'}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">
              {search || statusFilter ? 'Tente ajustar os filtros' : 'Crie o primeiro orçamento para um cliente'}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold hover:bg-[var(--brand-dark)] transition-colors"
              >
                <Plus size={12} /> Criar orçamento
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Número</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Cliente · Veículo</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden md:table-cell">Próximo passo</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden lg:table-cell">Válido até</th>
                  <th className="w-8 px-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(budget => {
                  const nextAction = NEXT_ACTION[budget.status]
                  const expired = isExpired(budget)
                  return (
                    <tr
                      key={budget.id}
                      onClick={() => setSelected(budget)}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold text-[var(--text-primary)]">{budget.number}</span>
                          <StatusBadge status={budget.status} />
                        </div>
                        {expired && (
                          <span className="text-[10px] text-[var(--danger)] font-medium">prazo expirado</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)] leading-tight">{budget.customerName}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{budget.vehicle} · <span className="font-mono">{budget.plate}</span></p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {nextAction ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{
                              color: nextAction.color,
                              backgroundColor: nextAction.color + '12',
                              borderColor: nextAction.color + '30',
                            }}
                          >
                            {nextAction.label}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-[var(--text-primary)] financial-value">{fmtMoney(budget.total)}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[var(--text-muted)] hidden lg:table-cell">
                        <span className={expired ? 'text-[var(--danger)] font-medium' : ''}>{fmtDate(budget.validUntil)}</span>
                      </td>
                      <td className="px-2 py-3">
                        <ActionMenu
                          align="right"
                          items={[
                            { label: 'Ver detalhes', icon: <FileText size={13} />, onClick: () => setSelected(budget) },
                            ...(budget.status === 'RASCUNHO'
                              ? [{ label: 'Enviar ao cliente', icon: <Send size={13} />, onClick: () => handleAction('send', budget) }]
                              : []),
                            ...(budget.status === 'AGUARDANDO_APROVACAO'
                              ? [
                                  { label: 'Registrar aprovação', icon: <CheckCircle2 size={13} />, onClick: () => handleAction('approve', budget) },
                                  { label: 'Registrar recusa', icon: <XCircle size={13} />, onClick: () => handleAction('reject', budget), variant: 'danger' as const },
                                ]
                              : []),
                            ...(budget.status === 'APROVADO' && !budget.convertedToOsId
                              ? [{ label: 'Converter em OS', icon: <ClipboardList size={13} />, onClick: () => handleAction('convert', budget) }]
                              : []),
                            { separator: true } as ActionMenuItem,
                            { label: 'Imprimir', icon: <Printer size={13} />, onClick: () => toast.info('Impressão disponível em breve') },
                            ...(!['CANCELADO','CONVERTIDO','RECUSADO'].includes(budget.status)
                              ? [{ label: 'Cancelar', icon: <XCircle size={13} />, onClick: () => handleAction('cancel', budget), variant: 'danger' as const }]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="border-t border-[var(--border)] px-4 py-2.5 flex items-center justify-between">
              <p className="text-[12px] text-[var(--text-muted)]">
                {filtered.length} orçamento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[12px] text-[var(--text-muted)]">
                Total em aberto: <span className="font-semibold text-[var(--text-primary)] financial-value">{fmtMoney(kpis.valorAberto)}</span>
              </p>
            </div>
          </>
        )}
      </div>
      </div>

      {/* ── Drawers ── */}
      <BudgetDetailDrawer
        budget={selected}
        onClose={() => setSelected(null)}
        onAction={(action, budget) => {
          handleAction(action, budget)
          setSelected(null)
        }}
      />

      <NewBudgetDrawer
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(b) => setBudgets(prev => [b, ...prev])}
      />

      {/* ── Confirm ── */}
      {confirm && (() => {
        const cfg = CONFIRM_CFG[confirm.action]
        return (
          <ConfirmModal
            open
            onClose={() => setConfirm(null)}
            onConfirm={(reason) => executeAction(confirm.action, confirm.budget, reason)}
            title={cfg.title}
            message={cfg.message}
            confirmLabel={cfg.label}
            variant={cfg.variant}
            requireReason={cfg.requireReason}
            reasonLabel="Motivo"
          />
        )
      })()}
    </div>
  )
}

