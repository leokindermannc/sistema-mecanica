import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X, Truck, Clock, Plus, Minus, ArrowDownToLine,
  ShoppingCart, Pencil, CheckCircle2, AlertTriangle,
  ChevronRight, FileText,
} from 'lucide-react'
import { mockSuppliers }      from '../../mocks/suppliers'
import { mockStockMovements } from '../../mocks/stock-movements'
import { mockServiceOrders }  from '../../mocks/service-orders'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import type { Part, PartStatus, StockMovementType } from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

export const PART_STATUS_STYLE: Record<PartStatus, { bg: string; text: string; label: string }> = {
  NORMAL:      { bg: 'rgba(22,163,74,0.10)',  text: '#16A34A', label: 'Normal' },
  BAIXO:       { bg: 'rgba(180,83,9,0.10)',   text: '#B45309', label: 'Estoque Baixo' },
  SEM_ESTOQUE: { bg: 'rgba(239,68,68,0.10)',  text: '#EF4444', label: 'Sem Estoque' },
  INATIVO:     { bg: 'rgba(82,82,91,0.10)',   text: '#52525B', label: 'Inativo' },
}

const MOVEMENT_CFG: Record<StockMovementType, { label: string; color: string; sign: '+' | '−' }> = {
  ENTRADA_COMPRA:       { label: 'Entrada de compra',   color: '#16A34A', sign: '+' },
  SAIDA_OS:             { label: 'Saída para OS',        color: '#B45309', sign: '−' },
  ESTORNO_OS:           { label: 'Estorno de OS',        color: '#2563EB', sign: '+' },
  AJUSTE_POSITIVO:      { label: 'Ajuste positivo',      color: '#16A34A', sign: '+' },
  AJUSTE_NEGATIVO:      { label: 'Ajuste negativo',      color: '#EF4444', sign: '−' },
  DEVOLUCAO_FORNECEDOR: { label: 'Devolução fornecedor', color: '#7C3AED', sign: '−' },
}

const SAIDA_REASONS = ['Uso interno', 'Descarte', 'Devolução ao fornecedor', 'Ajuste de estoque', 'Outro']

// ── Local types ───────────────────────────────────────────────────────────────

type DrawerTab   = 'resumo' | 'movimentacoes' | 'os' | 'fornecedores' | 'dados'
type DrawerModal = 'entrada' | 'saida' | 'compra' | 'editar' | null

const TABS: { key: DrawerTab; label: string }[] = [
  { key: 'resumo',        label: 'Resumo' },
  { key: 'movimentacoes', label: 'Movimentações' },
  { key: 'os',            label: 'OS vinculadas' },
  { key: 'fornecedores',  label: 'Fornecedores' },
  { key: 'dados',         label: 'Dados' },
]

interface LocalMovement {
  id: string; type: StockMovementType; quantity: number; date: string
  notes?: string; supplierName?: string; invoiceNumber?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeStatus(stock: number, min: number, prev: PartStatus): PartStatus {
  if (prev === 'INATIVO') return 'INATIVO'
  if (stock === 0)        return 'SEM_ESTOQUE'
  if (stock <= min)       return 'BAIXO'
  return 'NORMAL'
}

const SI = [
  'w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[12px]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all',
  'focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)]',
].join(' ')

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, variant, onDismiss }: {
  message: string; variant: 'success' | 'error'; onDismiss: () => void
}) {
  useEffect(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t) }, [onDismiss])
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[12px] font-medium shadow-lg pointer-events-none"
      style={variant === 'success'
        ? { backgroundColor: 'var(--success-subtle)', color: 'var(--success)', borderColor: 'var(--success-border)' }
        : { backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
      {variant === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      {message}
    </div>
  )
}

// ── ModalBase ─────────────────────────────────────────────────────────────────

function ModalBase({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = prev }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[480px] max-h-[90vh] bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
          {footer}
        </div>
      </div>
    </div>
  )
}

// ── StockEntryModal ───────────────────────────────────────────────────────────

function StockEntryModal({ part, onConfirm, onClose }: {
  part: Part
  onConfirm: (qty: number, cost: number, supplierName: string, invoice: string, notes: string) => void
  onClose: () => void
}) {
  const [qty, setQty]               = useState('1')
  const [cost, setCost]             = useState(part.averageCost.toFixed(2))
  const [supplierId, setSupplierId] = useState(part.supplierId ?? '')
  const [invoice, setInvoice]       = useState('')
  const [notes, setNotes]           = useState('')
  const [err, setErr]               = useState<string | null>(null)
  const suppliers = mockSuppliers.filter(s => s.status === 'ATIVO')

  function handleConfirm() {
    const q = Number(qty); const c = Number(cost.replace(',', '.'))
    if (!q || q <= 0 || isNaN(q)) { setErr('Quantidade inválida'); return }
    if (isNaN(c) || c < 0)        { setErr('Custo inválido'); return }
    setErr(null)
    const sup = suppliers.find(s => s.id === supplierId)
    onConfirm(q, c, sup ? (sup.tradeName ?? sup.corporateName) : '', invoice, notes)
  }

  return (
    <ModalBase title="Nova entrada de estoque" onClose={onClose} footer={<>
      <button onClick={onClose} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancelar</button>
      <button onClick={handleConfirm} className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
        <ArrowDownToLine size={12} />Registrar entrada
      </button>
    </>}>
      <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
        <p className="text-[11px] text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">{part.description}</strong>
          {' · '}Estoque atual: <strong>{part.currentStock} {part.unit}</strong>
        </p>
      </div>
      {err && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{err}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Quantidade *</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className={SI} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Custo unitário</label>
          <input value={cost} onChange={e => setCost(e.target.value)} className={cn(SI, 'font-mono')} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Fornecedor</label>
        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={SI}>
          <option value="">Selecionar fornecedor...</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.tradeName ?? s.corporateName}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Nº da nota</label>
          <input value={invoice} onChange={e => setInvoice(e.target.value)} placeholder="NF-001234" className={cn(SI, 'font-mono')} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Data de entrada</label>
          <input type="date" defaultValue="2026-06-10" className={SI} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Observação</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Observações..." className={cn(SI, 'h-auto py-2 resize-none')} />
      </div>
    </ModalBase>
  )
}

// ── StockExitModal ────────────────────────────────────────────────────────────

function StockExitModal({ part, currentStock, onConfirm, onClose }: {
  part: Part; currentStock: number
  onConfirm: (qty: number, reason: string, notes: string) => void
  onClose: () => void
}) {
  const [qty, setQty]       = useState('1')
  const [reason, setReason] = useState('')
  const [notes, setNotes]   = useState('')
  const [err, setErr]       = useState<string | null>(null)

  function handleConfirm() {
    const q = Number(qty)
    if (!q || q <= 0 || isNaN(q)) { setErr('Quantidade inválida'); return }
    if (q > currentStock)          { setErr(`Disponível: ${currentStock} ${part.unit}`); return }
    if (!reason)                   { setErr('Selecione o motivo'); return }
    setErr(null); onConfirm(q, reason, notes)
  }

  return (
    <ModalBase title="Saída manual de estoque" onClose={onClose} footer={<>
      <button onClick={onClose} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancelar</button>
      <button onClick={handleConfirm} className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--danger)' }}>
        <Minus size={12} />Registrar saída
      </button>
    </>}>
      <div className="p-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-subtle)]">
        <p className="text-[11px] font-medium" style={{ color: 'var(--danger)' }}>
          <strong>{part.description}</strong> · Estoque: <strong>{currentStock} {part.unit}</strong>
        </p>
      </div>
      {err && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{err}</p>}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Quantidade *</label>
        <input type="number" min="1" max={currentStock} value={qty} onChange={e => setQty(e.target.value)} className={SI} />
        <p className="text-[10px] text-[var(--text-muted)] mt-1">Máximo: {currentStock} {part.unit}</p>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-2">Motivo *</label>
        <div className="space-y-2">
          {SAIDA_REASONS.map(r => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="exit-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--brand)]" />
              <span className="text-[12px] text-[var(--text-primary)]">{r}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Observação</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Observações..." className={cn(SI, 'h-auto py-2 resize-none')} />
      </div>
    </ModalBase>
  )
}

// ── PurchaseRequestModal ──────────────────────────────────────────────────────

function PurchaseRequestModal({ part, currentStock, onConfirm, onClose }: {
  part: Part; currentStock: number
  onConfirm: (qty: number, urgency: string, notes: string) => void
  onClose: () => void
}) {
  const suggested               = Math.max(part.minimumStock * 2 - currentStock, part.minimumStock, 1)
  const [qty, setQty]           = useState(String(suggested))
  const [supplierId, setSupplierId] = useState(part.supplierId ?? '')
  const [urgency, setUrgency]   = useState('NORMAL')
  const [notes, setNotes]       = useState('')
  const suppliers = mockSuppliers.filter(s => s.status === 'ATIVO')

  return (
    <ModalBase title="Gerar solicitação de compra" onClose={onClose} footer={<>
      <button onClick={onClose} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancelar</button>
      <button onClick={() => onConfirm(Number(qty) || 1, urgency, notes)}
        className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
        <ShoppingCart size={12} />Criar solicitação
      </button>
    </>}>
      <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-1">
        <p className="text-[12px] font-bold text-[var(--text-primary)]">{part.description}</p>
        <div className="flex gap-4 text-[11px] text-[var(--text-muted)]">
          <span>Atual: <strong className="text-[var(--text-primary)]">{currentStock} {part.unit}</strong></span>
          <span>Mínimo: <strong className="text-[var(--text-primary)]">{part.minimumStock} {part.unit}</strong></span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Quantidade</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className={SI} />
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Sugestão: {suggested} un.</p>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Urgência</label>
          <select value={urgency} onChange={e => setUrgency(e.target.value)} className={SI}>
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Fornecedor preferido</label>
        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={SI}>
          <option value="">Selecionar...</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.tradeName ?? s.corporateName}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Observação</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Informações adicionais..." className={cn(SI, 'h-auto py-2 resize-none')} />
      </div>
    </ModalBase>
  )
}

// ── EditPartModal ─────────────────────────────────────────────────────────────

function EditPartModal({ part, onConfirm, onClose }: {
  part: Part
  onConfirm: (fields: { description: string; salePrice: number; minimumStock: number; location: string }) => void
  onClose: () => void
}) {
  const [description, setDescription] = useState(part.description)
  const [salePrice, setSalePrice]     = useState(part.salePrice.toFixed(2))
  const [minStock, setMinStock]       = useState(String(part.minimumStock))
  const [location, setLocation]       = useState(part.location ?? '')
  const [err, setErr]                 = useState<string | null>(null)

  function handleSave() {
    if (!description.trim()) { setErr('Nome obrigatório'); return }
    const price = Number(salePrice.replace(',', '.'))
    if (isNaN(price) || price < 0) { setErr('Preço inválido'); return }
    const min = Number(minStock)
    if (isNaN(min) || min < 0) { setErr('Estoque mínimo inválido'); return }
    setErr(null)
    onConfirm({ description: description.trim(), salePrice: price, minimumStock: min, location })
  }

  return (
    <ModalBase title="Editar peça" onClose={onClose} footer={<>
      <button onClick={onClose} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancelar</button>
      <button onClick={handleSave} className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
        Salvar alterações
      </button>
    </>}>
      {err && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{err}</p>}
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Nome da peça *</label>
        <input value={description} onChange={e => setDescription(e.target.value)} className={SI} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Preço de venda</label>
          <input value={salePrice} onChange={e => setSalePrice(e.target.value)} className={cn(SI, 'font-mono')} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Estoque mínimo</label>
          <input type="number" min="0" value={minStock} onChange={e => setMinStock(e.target.value)} className={SI} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Localização no estoque</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: A1-P1" className={cn(SI, 'font-mono')} />
      </div>
    </ModalBase>
  )
}

// ── Tab: Resumo ───────────────────────────────────────────────────────────────

function ResumoTab({ part, currentStock, partStatus, supplier }: {
  part: Part; currentStock: number; partStatus: PartStatus
  supplier: (typeof mockSuppliers)[0] | null | undefined
}) {
  const ss       = PART_STATUS_STYLE[partStatus]
  const stockPct = Math.min((currentStock / Math.max(part.minimumStock * 2, 1)) * 100, 100)
  const barColor = currentStock === 0 ? '#EF4444' : currentStock <= part.minimumStock ? '#B45309' : '#16A34A'
  const margin   = part.averageCost > 0 ? ((part.salePrice - part.averageCost) / part.averageCost) * 100 : 0

  return (
    <div className="p-5 space-y-5">
      {/* Stock card */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Estoque atual</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-extrabold leading-none tabular-nums" style={{ color: barColor }}>{currentStock}</span>
              <span className="text-[13px] font-medium text-[var(--text-muted)]">{part.unit}</span>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ color: ss.text, backgroundColor: ss.bg }}>{ss.label}</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${stockPct}%`, backgroundColor: barColor }} />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--text-muted)]">Mínimo: <strong className="text-[var(--text-primary)]">{part.minimumStock} {part.unit}</strong></span>
          <span style={{ color: barColor }}>
            {currentStock > part.minimumStock
              ? `+${currentStock - part.minimumStock} acima do mín`
              : currentStock === 0 ? 'Sem estoque'
              : `${Math.abs(currentStock - part.minimumStock)} abaixo do mín`}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Preço venda',   value: formatCurrency(part.salePrice), highlight: true },
          { label: 'Custo médio',   value: formatCurrency(part.averageCost) },
          { label: 'Margem',        value: `${margin.toFixed(1)}%`, color: margin >= 30 ? '#16A34A' : margin >= 15 ? '#B45309' : '#EF4444' },
          { label: 'Valor estoque', value: formatCurrency(currentStock * part.averageCost) },
          { label: 'Localização',   value: part.location ?? '—' },
          { label: 'Última mov.',   value: part.lastMovementDate ? formatDate(part.lastMovementDate) : '—' },
        ].map(m => (
          <div key={m.label} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.08em] mb-1">{m.label}</p>
            <p className="text-[12px] font-bold font-mono leading-tight"
              style={{ color: m.color ?? (m.highlight ? 'var(--text-primary)' : 'var(--text-secondary)') }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Supplier */}
      {supplier && (
        <div>
          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-2">Fornecedor principal</p>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center flex-shrink-0">
              <Truck size={13} className="text-[var(--text-muted)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{supplier.tradeName ?? supplier.corporateName}</p>
              {supplier.phone && <p className="text-[10px] text-[var(--text-muted)]">{supplier.phone}</p>}
            </div>
            {supplier.deliveryDays && (
              <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{supplier.deliveryDays}d prazo</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Movimentações ────────────────────────────────────────────────────────

function MovimentacoesTab({ movements }: { movements: LocalMovement[] }) {
  if (movements.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Clock size={24} className="text-[var(--text-disabled)]" />
      <p className="text-[13px] text-[var(--text-muted)]">Nenhuma movimentação registrada.</p>
    </div>
  )
  return (
    <div className="p-5 space-y-2">
      {movements.map((m, i) => {
        const cfg = MOVEMENT_CFG[m.type]
        return (
          <div key={m.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-9 h-7 rounded flex items-center justify-center text-[11px] font-extrabold"
                style={{ backgroundColor: `${cfg.color}14`, color: cfg.color }}>
                {cfg.sign}{m.quantity}
              </div>
              {i < movements.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: 'var(--border)' }} />}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{cfg.label}</p>
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap flex-shrink-0">{formatDate(m.date)}</span>
              </div>
              {m.supplierName && (
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {m.supplierName}{m.invoiceNumber ? ` · ${m.invoiceNumber}` : ''}
                </p>
              )}
              {m.notes && <p className="text-[10px] text-[var(--text-muted)] italic mt-0.5 truncate">{m.notes}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: OS vinculadas ────────────────────────────────────────────────────────

const OS_SC: Record<string, { color: string; bg: string; label: string }> = {
  ABERTA:               { color: '#6B7280', bg: 'rgba(107,114,128,0.10)', label: 'Aberta' },
  EM_ANALISE:           { color: '#2563EB', bg: 'rgba(37,99,235,0.10)',   label: 'Em análise' },
  AGUARDANDO_APROVACAO: { color: '#B45309', bg: 'rgba(180,83,9,0.10)',    label: 'Aguard. aprovação' },
  EM_ANDAMENTO:         { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)',  label: 'Em andamento' },
  CONCLUIDO:            { color: '#16A34A', bg: 'rgba(22,163,74,0.10)',   label: 'Concluído' },
  ENTREGUE:             { color: '#16A34A', bg: 'rgba(22,163,74,0.10)',   label: 'Entregue' },
  CANCELADO:            { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   label: 'Cancelado' },
}

function OSTab({ partId }: { partId: string }) {
  const linkedOS = useMemo(
    () => mockServiceOrders.filter(os => os.parts.some((p: { partId: string }) => p.partId === partId)),
    [partId],
  )
  if (linkedOS.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <FileText size={24} className="text-[var(--text-disabled)]" />
      <p className="text-[13px] text-[var(--text-muted)]">Esta peça não foi usada em nenhuma OS.</p>
    </div>
  )
  return (
    <div className="p-5 space-y-2">
      {linkedOS.map(os => {
        const up = os.parts.find((p: { partId: string }) => p.partId === partId) as { quantity: number; total: number } | undefined
        const sc = OS_SC[os.status] ?? { color: '#6B7280', bg: 'rgba(107,114,128,0.10)', label: os.status }
        return (
          <div key={os.id} className="flex items-center gap-3 p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-bold font-mono text-[var(--text-primary)]">#{os.number}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">{os.customerName}</p>
              {up && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{up.quantity}× usadas · {formatCurrency(up.total)}</p>}
            </div>
            <Link to={`/ordens-servico/${os.id}`} className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--brand)' }}>
              Ver OS<ChevronRight size={11} />
            </Link>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Fornecedores ─────────────────────────────────────────────────────────

function FornecedoresTab({ part, supplier, onCreatePurchase }: {
  part: Part; supplier: (typeof mockSuppliers)[0] | null | undefined; onCreatePurchase: () => void
}) {
  if (!supplier) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Truck size={24} className="text-[var(--text-disabled)]" />
      <p className="text-[13px] text-[var(--text-muted)]">Nenhum fornecedor vinculado.</p>
      <button onClick={onCreatePurchase} className="flex items-center gap-1.5 h-8 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
        <Plus size={12} />Gerar compra
      </button>
    </div>
  )
  return (
    <div className="p-5 space-y-4">
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center">
              <Truck size={15} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[var(--text-primary)]">{supplier.tradeName ?? supplier.corporateName}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{supplier.document}</p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--success)', backgroundColor: 'var(--success-subtle)' }}>Principal</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Telefone',     value: supplier.phone ?? '—' },
            { label: 'Prazo médio',  value: supplier.deliveryDays ? `${supplier.deliveryDays} dias` : '—' },
            { label: 'Última compra',value: supplier.lastPurchaseDate ? formatDate(supplier.lastPurchaseDate) : '—' },
            { label: 'Último custo', value: formatCurrency(part.averageCost) },
          ].map(r => (
            <div key={r.label}>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.07em] mb-0.5">{r.label}</p>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">{r.value}</p>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onCreatePurchase} className="flex items-center gap-1.5 h-8 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
        <ShoppingCart size={12} />Gerar solicitação de compra
      </button>
    </div>
  )
}

// ── Tab: Dados ────────────────────────────────────────────────────────────────

function DadosTab({ part }: { part: Part }) {
  const rows = [
    { label: 'Código interno',  value: part.internalCode,        mono: true },
    { label: 'Cód. fabricante', value: part.manufacturerCode ?? '—', mono: true },
    { label: 'Cód. de barras',  value: part.barcode ?? '—',      mono: true },
    { label: 'NCM',             value: part.ncm ?? '—',          mono: true },
    { label: 'Categoria',       value: part.category },
    { label: 'Unidade',         value: part.unit },
    { label: 'Localização',     value: part.location ?? '—' },
    { label: 'Estoque mínimo',  value: `${part.minimumStock} ${part.unit}` },
    { label: 'Status',          value: PART_STATUS_STYLE[part.status].label },
    { label: 'Cadastrado em',   value: formatDate(part.createdAt) },
  ]
  return (
    <div className="p-5">
      <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-muted)] transition-colors">
            <span className="text-[11px] text-[var(--text-muted)]">{r.label}</span>
            <span className={cn('text-[11px] font-semibold text-[var(--text-primary)]', r.mono && 'font-mono')}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main PartDrawer ───────────────────────────────────────────────────────────

export function PartDrawer({ part, onClose }: { part: Part | null; onClose: () => void }) {
  const [tab,          setTab]          = useState<DrawerTab>('resumo')
  const [modal,        setModal]        = useState<DrawerModal>(null)
  const [toast,        setToast]        = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [currentStock, setCurrentStock] = useState(0)
  const [partStatus,   setPartStatus]   = useState<PartStatus>('NORMAL')
  const [localMoves,   setLocalMoves]   = useState<LocalMovement[]>([])

  useEffect(() => {
    if (part) {
      setCurrentStock(part.currentStock)
      setPartStatus(part.status)
      setLocalMoves([])
      setTab('resumo')
      setModal(null)
      setToast(null)
    }
  }, [part?.id])

  useEffect(() => {
    if (modal) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [modal, onClose])

  const supplier = useMemo(
    () => (part?.supplierId ? mockSuppliers.find(s => s.id === part.supplierId) : null),
    [part?.supplierId],
  )

  const allMovements = useMemo<LocalMovement[]>(() => {
    if (!part) return []
    const real: LocalMovement[] = mockStockMovements
      .filter(m => m.partId === part.id)
      .map(m => ({
        id: m.id, type: m.type, quantity: m.quantity,
        date: m.createdAt.slice(0, 10),
        notes: m.reason ?? (m.relatedServiceOrderNumber ? `OS #${m.relatedServiceOrderNumber}` : undefined),
        supplierName: m.supplierName,
      }))
    return [...localMoves, ...real].sort((a, b) => b.date.localeCompare(a.date))
  }, [part, localMoves])

  function showToast(msg: string, variant: 'success' | 'error' = 'success') {
    setToast({ message: msg, variant })
  }

  function handleEntry(qty: number, _cost: number, supplierName: string, invoice: string, notes: string) {
    const next = currentStock + qty
    setCurrentStock(next)
    setPartStatus(computeStatus(next, part!.minimumStock, part!.status))
    setLocalMoves(p => [{ id: `lm-${Date.now()}`, type: 'ENTRADA_COMPRA', quantity: qty, date: '2026-06-10', supplierName: supplierName || undefined, invoiceNumber: invoice || undefined, notes: notes || undefined }, ...p])
    setModal(null)
    showToast(`Entrada de ${qty} ${part!.unit} registrada. Novo estoque: ${next}.`)
  }

  function handleExit(qty: number, _reason: string, notes: string) {
    const next = currentStock - qty
    const ns   = computeStatus(next, part!.minimumStock, part!.status)
    setCurrentStock(next)
    setPartStatus(ns)
    setLocalMoves(p => [{ id: `lm-${Date.now()}`, type: 'AJUSTE_NEGATIVO', quantity: qty, date: '2026-06-10', notes: notes || undefined }, ...p])
    setModal(null)
    if (next === 0)      showToast('Estoque zerado! Considere gerar uma solicitação de compra.', 'error')
    else if (ns === 'BAIXO') showToast(`Atenção: estoque abaixo do mínimo (${next} ${part!.unit}).`, 'error')
    else                 showToast(`Saída de ${qty} ${part!.unit} registrada. Novo estoque: ${next}.`)
  }

  function handlePurchase(_qty: number, urgency: string, _notes: string) {
    setModal(null)
    showToast(`Solicitação de compra criada com urgência ${urgency.toLowerCase()}.`)
  }

  function handleEdit(fields: { description: string }) {
    setModal(null)
    showToast(`"${fields.description}" atualizado com sucesso.`)
  }

  const ss = part ? PART_STATUS_STYLE[partStatus] : null

  return (
    <>
      <div className={`fixed right-0 top-[44px] bottom-0 z-[15] w-full sm:w-[600px] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shadow-2xl transition-transform duration-200 ease-out ${part ? 'translate-x-0' : 'translate-x-full'}`}>
        {part && (
          <>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <code className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-muted)] border border-[var(--border)] rounded px-1.5 py-[2px]">
                  {part.internalCode}
                </code>
                <span className="text-[10px] text-[var(--text-muted)]">·</span>
                <span className="text-[11px] text-[var(--text-secondary)]">{part.category}</span>
                {ss && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase rounded px-1.5 py-[2px] ml-auto"
                    style={{ backgroundColor: ss.bg, color: ss.text }}>
                    <span className="w-1 h-1 rounded-full bg-current" />{ss.label}
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[16px] font-extrabold text-[var(--text-primary)] leading-snug">{part.description}</h2>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  <button onClick={() => setModal('editar')} className="flex items-center gap-1 h-7 px-2.5 rounded border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                    <Pencil size={10} />Editar
                  </button>
                  <button onClick={() => setModal('entrada')} className="flex items-center gap-1 h-7 px-2.5 rounded border text-[11px] font-semibold transition-colors"
                    style={{ color: 'var(--success)', borderColor: 'rgba(22,163,74,0.25)', backgroundColor: 'rgba(22,163,74,0.06)' }}>
                    <ArrowDownToLine size={10} />Entrada
                  </button>
                  <button onClick={() => setModal('saida')} className="flex items-center gap-1 h-7 px-2.5 rounded border text-[11px] font-semibold transition-colors"
                    style={{ color: 'var(--warning)', borderColor: 'rgba(180,83,9,0.25)', backgroundColor: 'rgba(180,83,9,0.06)' }}>
                    <Minus size={10} />Saída
                  </button>
                  <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex-shrink-0 flex items-center border-b border-[var(--border)] px-2 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn('relative flex-shrink-0 h-9 px-3 text-[12px] font-medium transition-colors whitespace-nowrap',
                    tab === t.key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
                  {t.label}
                  {t.key === 'movimentacoes' && allMovements.length > 0 && (
                    <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)]">
                      {allMovements.length}
                    </span>
                  )}
                  {tab === t.key && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full" style={{ backgroundColor: 'var(--brand)' }} />}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto relative">
              {tab === 'resumo'        && <ResumoTab part={part} currentStock={currentStock} partStatus={partStatus} supplier={supplier} />}
              {tab === 'movimentacoes' && <MovimentacoesTab movements={allMovements} />}
              {tab === 'os'            && <OSTab partId={part.id} />}
              {tab === 'fornecedores'  && <FornecedoresTab part={part} supplier={supplier} onCreatePurchase={() => setModal('compra')} />}
              {tab === 'dados'         && <DadosTab part={part} />}
              {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal === 'entrada' && part && (
        <StockEntryModal part={{ ...part, currentStock }} onConfirm={handleEntry} onClose={() => setModal(null)} />
      )}
      {modal === 'saida' && part && (
        <StockExitModal part={part} currentStock={currentStock} onConfirm={handleExit} onClose={() => setModal(null)} />
      )}
      {modal === 'compra' && part && (
        <PurchaseRequestModal part={part} currentStock={currentStock} onConfirm={handlePurchase} onClose={() => setModal(null)} />
      )}
      {modal === 'editar' && part && (
        <EditPartModal part={part} onConfirm={handleEdit} onClose={() => setModal(null)} />
      )}
    </>
  )
}
