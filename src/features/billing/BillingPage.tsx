import { useState, useMemo } from 'react'
import {
  Search, Plus, MoreVertical, Edit2, Trash2,
  Phone, Mail, MapPin, Car, FileText, Send, X,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import { mockInvoices }  from '../../mocks/invoices'
import { mockCustomers } from '../../mocks/customers'
import type { Invoice, Customer } from '../../types'

// ─── Config ───────────────────────────────────────────────────────────────────

const TODAY = '2026-06-17'

type EffectiveStatus = 'EM_ABERTO' | 'VENCIDA' | 'PAGA' | 'PAGA_PARCIAL' | 'CANCELADA'

function effectiveStatus(inv: Invoice): EffectiveStatus {
  if (inv.status === 'ABERTA' && inv.dueDate && inv.dueDate < TODAY) return 'VENCIDA'
  if (inv.status === 'ABERTA') return 'EM_ABERTO'
  if (inv.status === 'PAGA') return 'PAGA'
  if (inv.status === 'PAGA_PARCIAL') return 'PAGA_PARCIAL'
  return 'CANCELADA'
}

const STATUS_CFG: Record<EffectiveStatus, { label: string; color: string; bg: string }> = {
  EM_ABERTO:   { label: 'Em aberto',   color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
  VENCIDA:     { label: 'Vencida',     color: '#EF4444', bg: 'rgba(239,68,68,0.10)'  },
  PAGA:        { label: 'Pago',        color: '#22C55E', bg: 'rgba(34,197,94,0.10)'  },
  PAGA_PARCIAL:{ label: 'Pago parcial',color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  CANCELADA:   { label: 'Cancelada',   color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)'},
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX', BOLETO: 'Boleto', CARTAO_CREDITO: 'Crédito',
  CARTAO_DEBITO: 'Débito', DINHEIRO: 'Dinheiro', TRANSFERENCIA: 'Transferência',
}

function invoiceType(inv: Invoice) {
  if (inv.partsValue > 0 && inv.servicesValue > 0) return 'Mista'
  if (inv.partsValue > 0) return 'Peças'
  if (inv.servicesValue > 0) return 'Serviços'
  return '—'
}

function initials(name: string) {
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function CustomerItem({ customer, invoices, selected, onClick }: {
  customer: Customer; invoices: Invoice[]; selected: boolean; onClick: () => void
}) {
  const pending = invoices.filter(i => i.status === 'ABERTA').reduce((s, i) => s + i.totalValue, 0)
  const isPJ = customer.type === 'PJ'

  return (
    <button onClick={onClick}
      className={cn(
        'w-full px-4 py-3 flex items-center gap-3 border-b border-t-border text-left transition-colors',
        selected
          ? 'bg-orange-500/[0.06] border-l-[3px] border-l-[#F97316] pl-[13px]'
          : 'hover:bg-t-card-hover border-l-[3px] border-l-transparent',
      )}
    >
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-extrabold"
        style={{
          backgroundColor: isPJ ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)',
          color: isPJ ? '#3B82F6' : '#F97316',
        }}>
        {initials(customer.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-t-text truncate leading-tight">{customer.name}</p>
        <p className="text-[10px] text-t-muted mt-0.5">
          {invoices.length} fatura{invoices.length !== 1 ? 's' : ''}
          {' · '}
          <span className={cn(isPJ ? 'text-blue-500' : 'text-orange-500')}>{customer.type}</span>
        </p>
      </div>
      {pending > 0 && (
        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full flex-shrink-0 tabular-nums border border-amber-200 dark:border-amber-500/20">
          {formatCurrency(pending)}
        </span>
      )}
    </button>
  )
}

function CustomerProfile({ customer, invoices, onClose }: {
  customer: Customer; invoices: Invoice[]; onClose: () => void
}) {
  const isPJ = customer.type === 'PJ'
  const totalPaid = invoices.filter(i => i.status === 'PAGA').reduce((s, i) => s + (i.paidValue ?? i.totalValue), 0)

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-5 pt-5 pb-4">
        {/* Close */}
        <button onClick={onClose} className="mb-3 flex items-center gap-1 text-[10px] text-t-muted hover:text-t-text transition-colors">
          <X size={11} /> Limpar seleção
        </button>

        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-black mb-2 border-2 border-t-border"
            style={{
              backgroundColor: isPJ ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)',
              color: isPJ ? '#3B82F6' : '#F97316',
            }}>
            {initials(customer.name)}
          </div>
          <p className="text-[14px] font-bold text-t-text leading-tight">{customer.name}</p>
          <p className="text-[10px] text-t-muted mt-0.5">
            {isPJ ? 'Pessoa Jurídica' : 'Pessoa Física'}
          </p>
          <span className={cn(
            'mt-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full',
            customer.status === 'ATIVO'
              ? 'text-green-700 bg-green-50 dark:bg-green-500/10 dark:text-green-400'
              : 'text-gray-500 bg-gray-100 dark:bg-white/5',
          )}>
            {customer.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4">
          <button className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[10px] font-semibold transition-colors">
            <Plus size={10} strokeWidth={2.5} /> Pagamento
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg border border-t-border bg-t-surface hover:bg-t-card-hover text-t-text text-[10px] font-semibold transition-colors">
            <FileText size={10} /> Nova fatura
          </button>
        </div>

        {/* Dados */}
        <p className="text-[9px] font-bold text-t-muted uppercase tracking-widest mb-2">Dados do cliente</p>
        <div className="bg-t-surface border border-t-border rounded-xl divide-y divide-t-border mb-4 overflow-hidden">
          <InfoRow icon={<FileText size={10} />} label={isPJ ? 'CNPJ' : 'CPF'} value={customer.document ?? '—'} />
          <InfoRow icon={<Phone size={10} />} label="Telefone" value={customer.phone} />
          <InfoRow icon={<Mail size={10} />} label="E-mail" value={customer.email ?? '—'} truncate />
          <InfoRow icon={<MapPin size={10} />} label="Cidade" value={`${customer.city ?? '—'}${customer.state ? `, ${customer.state}` : ''}`} />
          <InfoRow icon={<Car size={10} />} label="Veículos" value={`${customer.vehiclesCount ?? 0} cadastrado(s)`} />
        </div>

        {/* Histórico */}
        <p className="text-[9px] font-bold text-t-muted uppercase tracking-widest mb-2">Histórico de faturamento</p>
        <div className="bg-t-surface border border-t-border rounded-xl divide-y divide-t-border overflow-hidden">
          <InfoRow label="Total faturas"    value={`${invoices.length}`} />
          <InfoRow label="Total recebido"   value={formatCurrency(totalPaid)} />
          <InfoRow label="Última OS"        value={customer.lastServiceDate ? formatDate(customer.lastServiceDate) : '—'} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, truncate }: {
  icon?: React.ReactNode; label: string; value: string; truncate?: boolean
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {icon && <span className="text-t-muted flex-shrink-0">{icon}</span>}
      <span className="text-[10px] text-t-muted flex-1">{label}</span>
      <span className={cn('text-[10px] font-semibold text-t-text text-right', truncate && 'truncate max-w-[110px]')}>
        {value}
      </span>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean
}) {
  return (
    <div className={cn(
      'flex-1 rounded-xl border p-4',
      highlight
        ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/[0.07]'
        : 'border-t-border bg-t-card',
    )}>
      <p className="text-[10px] text-t-muted mb-1">{label}</p>
      <p className={cn(
        'text-[20px] font-black tabular-nums leading-tight',
        highlight ? 'text-amber-700 dark:text-amber-400' : 'text-t-text',
      )}>
        {value}
      </p>
      {sub && <p className="text-[9px] text-t-muted mt-1">{sub}</p>}
    </div>
  )
}

// ─── Checkbox ────────────────────────────────────────────────────────────────

function Cb() {
  return (
    <div className="w-[14px] h-[14px] rounded-[3px] border border-t-border flex-shrink-0" />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BillingPage() {
  const [selectedCid, setSelectedCid]   = useState<string | null>(null)
  const [customerSearch, setCSearch]     = useState('')
  const [statusFilter, setStatusFilter]  = useState<EffectiveStatus | ''>('')
  const [methodFilter, setMethodFilter]  = useState('')

  // Map customers → their invoices
  const customerInvoiceMap = useMemo(() => {
    const m = new Map<string, Invoice[]>()
    for (const inv of mockInvoices) {
      if (!m.has(inv.customerId)) m.set(inv.customerId, [])
      m.get(inv.customerId)!.push(inv)
    }
    return m
  }, [])

  // Customers who have invoices, searchable
  const billingCustomers = useMemo(() =>
    mockCustomers.filter(c => customerInvoiceMap.has(c.id) &&
      (customerSearch === '' || c.name.toLowerCase().includes(customerSearch.toLowerCase()))
    ), [customerSearch, customerInvoiceMap])

  const selectedCustomer = selectedCid ? mockCustomers.find(c => c.id === selectedCid) ?? null : null
  const selectedInvoices = selectedCid ? (customerInvoiceMap.get(selectedCid) ?? []) : mockInvoices

  // Filtered invoices for table
  const tableInvoices = useMemo(() => {
    let list = [...selectedInvoices]
    if (statusFilter) list = list.filter(i => effectiveStatus(i) === statusFilter)
    return list.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
  }, [selectedInvoices, statusFilter])

  // Payment history
  const payments = useMemo(() => {
    let list = selectedInvoices.filter(i => i.paidAt && i.paidValue)
    if (methodFilter) list = list.filter(i => i.paymentMethod === methodFilter)
    return list.sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
  }, [selectedInvoices, methodFilter])

  // KPIs
  const kpiOpen      = selectedInvoices.filter(i => i.status === 'ABERTA').reduce((s, i) => s + i.totalValue, 0)
  const kpiCollected = selectedInvoices.filter(i => i.status === 'PAGA').reduce((s, i) => s + (i.paidValue ?? i.totalValue), 0)
  const kpiOverdue   = selectedInvoices.filter(i => i.status === 'ABERTA' && i.dueDate && i.dueDate < TODAY).length
  const kpiServices  = selectedInvoices.filter(i => i.status === 'ABERTA').reduce((s, i) => s + i.servicesValue, 0)

  return (
    <div className="flex h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="w-[272px] flex-shrink-0 border-r border-t-border bg-t-topbar flex flex-col">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-t-border flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-bold text-t-text">Clientes</h2>
            <span className="text-[10px] font-semibold text-t-muted bg-t-surface border border-t-border px-2 py-0.5 rounded-full">
              {billingCustomers.length}
            </span>
          </div>
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={customerSearch}
              onChange={e => setCSearch(e.target.value)}
              className="w-full h-7 pl-7 pr-3 bg-t-surface border border-t-border rounded-lg text-[11px] text-t-text placeholder:text-t-muted focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-colors"
            />
          </div>
        </div>

        {/* List or Profile */}
        {selectedCustomer ? (
          <CustomerProfile
            customer={selectedCustomer}
            invoices={selectedInvoices}
            onClose={() => setSelectedCid(null)}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {billingCustomers.map(c => (
              <CustomerItem
                key={c.id}
                customer={c}
                invoices={customerInvoiceMap.get(c.id) ?? []}
                selected={selectedCid === c.id}
                onClick={() => setSelectedCid(c.id)}
              />
            ))}
            {billingCustomers.length === 0 && (
              <p className="text-[11px] text-t-muted text-center py-10">Nenhum cliente encontrado</p>
            )}
          </div>
        )}

        {/* Bottom: select prompt */}
        {!selectedCustomer && (
          <div className="px-4 py-2.5 border-t border-t-border flex-shrink-0">
            <p className="text-[9px] text-t-muted text-center leading-relaxed">
              Selecione um cliente para filtrar
            </p>
          </div>
        )}
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 space-y-5">

          {/* Billing Summary */}
          <div>
            <h2 className="text-[13px] font-bold text-t-text mb-3">
              Resumo de cobrança
              {selectedCustomer && (
                <span className="ml-2 text-[11px] font-normal text-t-muted">— {selectedCustomer.name}</span>
              )}
            </h2>
            <div className="flex gap-3">
              <KpiCard label="Saldo em aberto"    value={formatCurrency(kpiOpen)}
                sub={`${selectedInvoices.filter(i=>i.status==='ABERTA').length} fatura(s)`} />
              <KpiCard label="Serviços pendentes" value={formatCurrency(kpiServices)} />
              <KpiCard label="Faturas vencidas"   value={`${kpiOverdue}`}
                sub={kpiOverdue > 0 ? 'requer atenção' : 'nenhuma vencida'}
                highlight={kpiOverdue > 0} />
              <KpiCard label="Total recebido"     value={formatCurrency(kpiCollected)}
                sub={`${selectedInvoices.filter(i=>i.status==='PAGA').length} paga(s)`} />
            </div>
          </div>

          {/* Faturas */}
          <div className="bg-t-card rounded-2xl border border-t-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-t-border">
              <h3 className="text-[12px] font-bold text-t-text">Faturas</h3>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as EffectiveStatus | '')}
                  className="h-7 px-2.5 pr-6 bg-t-surface border border-t-border rounded-lg text-[10px] text-t-secondary focus:outline-none focus:ring-1 focus:ring-accent/40 cursor-pointer appearance-none"
                >
                  <option value="">Por status</option>
                  {(Object.entries(STATUS_CFG) as [EffectiveStatus, typeof STATUS_CFG[EffectiveStatus]][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[10px] font-semibold transition-colors">
                  <Plus size={10} strokeWidth={2.5} /> Nova fatura
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-t-border bg-t-surface">
                    <th className="px-4 py-2.5 w-8" />
                    {['Data', 'Nº Fatura', 'OS', 'Tipo', 'Fiscal', 'Status', 'Valor', 'Ação'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold text-t-muted uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-t-border">
                  {tableInvoices.map(inv => {
                    const st  = STATUS_CFG[effectiveStatus(inv)]
                    return (
                      <tr key={inv.id} className="hover:bg-t-card-hover transition-colors group">
                        <td className="px-4 py-3"><Cb /></td>
                        <td className="px-3 py-3 text-[10px] text-t-muted tabular-nums">{formatDate(inv.issuedAt)}</td>
                        <td className="px-3 py-3">
                          <span className="text-[11px] font-mono font-semibold text-t-text">{inv.number}</span>
                          <p className="text-[9px] text-t-muted mt-0.5 truncate max-w-[140px]">{inv.customerName}</p>
                        </td>
                        <td className="px-3 py-3 text-[10px] font-mono text-t-muted">{inv.serviceOrderNumber}</td>
                        <td className="px-3 py-3 text-[11px] text-t-secondary">{invoiceType(inv)}</td>
                        <td className="px-3 py-3 text-[10px] text-t-muted">Não emitido</td>
                        <td className="px-3 py-3">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                            style={{ color: st.color, backgroundColor: st.bg }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[12px] font-bold text-t-text tabular-nums">
                          {formatCurrency(inv.totalValue)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="h-6 px-2.5 text-[10px] font-semibold text-t-secondary border border-t-border rounded-md hover:text-t-text hover:bg-t-surface transition-colors">
                              Ver
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-surface border border-t-border rounded-md transition-colors">
                              <MoreVertical size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {tableInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[11px] text-t-muted">
                        Nenhuma fatura encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagamentos */}
          <div className="bg-t-card rounded-2xl border border-t-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-t-border">
              <h3 className="text-[12px] font-bold text-t-text">Histórico de pagamentos</h3>
              <div className="flex items-center gap-2">
                <select
                  value={methodFilter}
                  onChange={e => setMethodFilter(e.target.value)}
                  className="h-7 px-2.5 pr-6 bg-t-surface border border-t-border rounded-lg text-[10px] text-t-secondary focus:outline-none focus:ring-1 focus:ring-accent/40 cursor-pointer appearance-none"
                >
                  <option value="">Por método</option>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-t-border bg-t-surface hover:bg-t-card-hover text-t-text text-[10px] font-semibold transition-colors">
                  <Send size={10} /> Emitir NF-e
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-t-border bg-t-surface">
                    <th className="px-4 py-2.5 w-8" />
                    {['Data', 'Nº Fatura', 'Status', 'Tipo', 'Método', 'Pago por', 'Valor', 'Desconto', 'Ação'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold text-t-muted uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-t-border">
                  {payments.map(inv => (
                    <tr key={inv.id} className="hover:bg-t-card-hover transition-colors group">
                      <td className="px-4 py-3"><Cb /></td>
                      <td className="px-3 py-3 text-[10px] text-t-muted tabular-nums">{formatDate(inv.paidAt!)}</td>
                      <td className="px-3 py-3 text-[11px] font-mono font-semibold text-t-text">{inv.number}</td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg text-green-700 dark:text-green-400"
                          style={{ backgroundColor: 'rgba(34,197,94,0.10)' }}>
                          Pago
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-t-secondary">{invoiceType(inv)}</td>
                      <td className="px-3 py-3 text-[11px] text-t-secondary">{PAYMENT_LABELS[inv.paymentMethod ?? ''] ?? '—'}</td>
                      <td className="px-3 py-3 text-[10px] text-t-secondary truncate max-w-[120px]">{inv.customerName}</td>
                      <td className="px-3 py-3 text-[12px] font-bold text-t-text tabular-nums">{formatCurrency(inv.paidValue ?? inv.totalValue)}</td>
                      <td className="px-3 py-3 text-[11px] text-t-muted">R$ 0,00</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="w-6 h-6 flex items-center justify-center text-t-muted hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-t-border rounded-md transition-colors">
                            <Edit2 size={10} />
                          </button>
                          <button className="w-6 h-6 flex items-center justify-center text-t-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-t-border rounded-md transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-[11px] text-t-muted">
                        Nenhum pagamento registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
