import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, TrendingUp, TrendingDown,
  Wallet, FileText, ChevronRight, ArrowRight, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { mockFinance }  from '../../mocks/finance'
import { mockInvoices } from '../../mocks/invoices'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import type { FinancialStatus } from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<FinancialStatus, { label: string; color: string }> = {
  ABERTA:    { label: 'Em aberto', color: 'var(--info)' },
  PAGA:      { label: 'Paga',      color: 'var(--success)' },
  VENCIDA:   { label: 'Vencida',   color: 'var(--danger)' },
  CANCELADA: { label: 'Cancelada', color: 'var(--text-muted)' },
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'receber' | 'pagar' | 'caixa' | 'faturamento'

const TABS: { key: Tab; label: string }[] = [
  { key: 'receber',    label: 'Receber' },
  { key: 'pagar',      label: 'Pagar' },
  { key: 'caixa',      label: 'Caixa' },
  { key: 'faturamento', label: 'Faturamento' },
]

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, accent, onClick }: {
  label: string; value: string; icon: React.ReactNode; accent: string; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative text-left flex flex-col gap-2 p-3.5 rounded-lg border bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] transition-all duration-[160ms]"
    >
      <span className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-lg" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">{label}</span>
        <span className="p-1.5 rounded" style={{ backgroundColor: accent + '18', color: accent }}>{icon}</span>
      </div>
      <span className="text-[20px] font-extrabold text-[var(--text-primary)] leading-none tabular-nums">{value}</span>
    </button>
  )
}

// ── Finance row ───────────────────────────────────────────────────────────────

function FinRow({ f }: { f: (typeof mockFinance)[number] }) {
  const cfg = STATUS_CFG[f.status]
  const overdue = f.status === 'ABERTA' && new Date(f.dueDate) < new Date()
  const isUrgent = overdue || f.status === 'VENCIDA'

  const nextAction = isUrgent
    ? { label: 'Cobrar agora', color: 'var(--danger)', bg: 'var(--danger-subtle)' }
    : f.status === 'ABERTA'
      ? { label: 'Marcar pago', color: 'var(--success)', bg: 'var(--success-subtle)' }
      : null

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0',
      isUrgent && 'bg-[var(--danger-subtle)]/30',
    )}>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
        <div className="min-w-0 flex items-center gap-2">
          {isUrgent && <AlertTriangle size={11} className="flex-shrink-0" style={{ color: 'var(--danger)' }} />}
          {f.status === 'PAGA' && <CheckCircle2 size={11} className="flex-shrink-0 text-[var(--success)]" />}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{f.entity}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{f.description}</p>
          </div>
        </div>
        <span className={cn('hidden sm:block text-[12px] w-24', overdue ? 'text-[var(--danger)] font-semibold' : 'text-[var(--text-muted)]')}>
          {formatDate(f.dueDate)}
        </span>
        {nextAction ? (
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-sm w-28 justify-center border"
            style={{ color: nextAction.color, backgroundColor: nextAction.bg, borderColor: nextAction.color + '30' }}
          >
            <ArrowRight size={9} />{nextAction.label}
          </span>
        ) : (
          <span
            className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm w-28 justify-center"
            style={{ color: cfg.color, backgroundColor: cfg.color + '14' }}
          >
            {overdue ? 'Vencida' : cfg.label}
          </span>
        )}
        <span className="hidden sm:block text-[12px] font-bold tabular-nums text-[var(--text-primary)] w-24 text-right">
          {formatCurrency(f.value)}
        </span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function FinanceiroHubPage() {
  const [tab, setTab]       = useState<Tab>('receber')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    const receber    = mockFinance.filter(f => f.type === 'RECEBER' && f.status !== 'CANCELADA')
    const pagar      = mockFinance.filter(f => f.type === 'PAGAR'   && f.status !== 'CANCELADA')
    const abertosRec = receber.filter(f => f.status === 'ABERTA')
    const abertosPag = pagar.filter(f => f.status === 'ABERTA')
    const pago       = receber.filter(f => f.status === 'PAGA').reduce((s, f) => s + f.value, 0)
    const saldo      = abertosRec.reduce((s, f) => s + f.value, 0) - abertosPag.reduce((s, f) => s + f.value, 0)
    return {
      aReceber:      abertosRec.reduce((s, f) => s + f.value, 0),
      aPagar:        abertosPag.reduce((s, f) => s + f.value, 0),
      faturadoMes:   pago,
      saldoPrevisto: saldo,
    }
  }, [])

  const receber = useMemo(() => {
    let list = mockFinance.filter(f => f.type === 'RECEBER')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f => f.entity.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
    }
    return list
  }, [search])

  const pagar = useMemo(() => {
    let list = mockFinance.filter(f => f.type === 'PAGAR')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f => f.entity.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
    }
    return list
  }, [search])

  const caixaMovimentos = useMemo(() => {
    return mockFinance.filter(f => f.status === 'PAGA').slice(0, 10)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--text-primary)] tracking-tight">Financeiro</h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
              Acompanhe recebimentos, pagamentos, faturamento e caixa.
            </p>
          </div>
          <Link
            to="/financeiro"
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--brand)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
          >
            <Plus size={13} strokeWidth={2.5} />
            Novo lançamento
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="A receber"
            value={formatCurrency(stats.aReceber)}
            icon={<TrendingUp size={13} />}
            accent="var(--success)"
            onClick={() => setTab('receber')}
          />
          <KpiCard
            label="A pagar"
            value={formatCurrency(stats.aPagar)}
            icon={<TrendingDown size={13} />}
            accent="var(--danger)"
            onClick={() => setTab('pagar')}
          />
          <KpiCard
            label="Faturado no mês"
            value={formatCurrency(stats.faturadoMes)}
            icon={<Wallet size={13} />}
            accent="var(--brand)"
            onClick={() => setTab('faturamento')}
          />
          <KpiCard
            label="Saldo previsto"
            value={formatCurrency(stats.saldoPrevisto)}
            icon={<FileText size={13} />}
            accent={stats.saldoPrevisto >= 0 ? 'var(--success)' : 'var(--danger)'}
            onClick={() => setTab('caixa')}
          />
        </div>

        {/* ── Callout vencidos ──────────────────────────────────── */}
        {(() => {
          const vencidas = mockFinance.filter(f => f.status === 'VENCIDA' || (f.status === 'ABERTA' && new Date(f.dueDate) < new Date()))
          if (vencidas.length === 0) return null
          const totalVencido = vencidas.reduce((s, f) => s + f.value, 0)
          return (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg border"
              style={{ backgroundColor: 'var(--danger-subtle)', borderColor: 'var(--danger-border)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} style={{ color: 'var(--danger)' }} />
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                  {vencidas.length} {vencidas.length === 1 ? 'lançamento vencido' : 'lançamentos vencidos'} · {formatCurrency(totalVencido)} em aberto
                </span>
              </div>
              <button onClick={() => setTab('receber')}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--danger)', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                Cobrar agora <ArrowRight size={10} />
              </button>
            </div>
          )
        })()}

        {/* Tab panel */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4">
            <div className="flex" role="tablist">
              {TABS.map(t => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'relative h-10 px-3 text-[12px] font-medium transition-colors duration-[140ms]',
                    tab === t.key
                      ? 'text-[var(--brand)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}
                >
                  {t.label}
                  {tab === t.key && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                      style={{ backgroundColor: 'var(--brand)' }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="relative hidden sm:flex items-center">
              <Search size={12} className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="h-7 w-40 pl-7 pr-3 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)] transition-all"
              />
            </div>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
            {['Entidade / Descrição', 'Vencimento', 'Ação', 'Valor'].map(c => (
              <span key={c} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">{c}</span>
            ))}
          </div>

          {/* ── Tab content ─────────────────────────────────────── */}
          <div>
            {tab === 'receber' && (
              receber.length === 0
                ? <EmptyRow label="Nenhum lançamento a receber" />
                : receber.map(f => <FinRow key={f.id} f={f} />)
            )}

            {tab === 'pagar' && (
              pagar.length === 0
                ? <EmptyRow label="Nenhum lançamento a pagar" />
                : pagar.map(f => <FinRow key={f.id} f={f} />)
            )}

            {tab === 'caixa' && (
              caixaMovimentos.length === 0
                ? <EmptyRow label="Sem movimentações" />
                : caixaMovimentos.map(f => <FinRow key={f.id} f={f} />)
            )}

            {tab === 'faturamento' && (
              mockInvoices.length === 0
                ? <EmptyRow label="Nenhuma fatura emitida" />
                : mockInvoices.map(inv => (
                  <Link
                    key={inv.id}
                    to="/faturamento"
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors group"
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{inv.customerName}</p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">{inv.number}</p>
                      </div>
                      <span className="hidden sm:block text-[12px] text-[var(--text-muted)] w-24">
                        {inv.dueDate ? formatDate(inv.dueDate) : inv.paidAt ? formatDate(inv.paidAt!) : '—'}
                      </span>
                      <span className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm w-24 justify-center"
                        style={
                          inv.status === 'PAGA'
                            ? { color: 'var(--success)', backgroundColor: 'var(--success-subtle)' }
                            : { color: 'var(--info)',    backgroundColor: 'var(--info-subtle)' }
                        }
                      >
                        {inv.status === 'PAGA' ? 'Paga' : 'Em aberto'}
                      </span>
                      <span className="hidden sm:block text-[12px] font-bold tabular-nums text-[var(--text-primary)] w-24 text-right">
                        {formatCurrency(inv.totalValue)}
                      </span>
                    </div>
                    <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
                  </Link>
                ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]">
            <span className="text-[11px] text-[var(--text-muted)]">
              {tab === 'receber'    && `${receber.length} lançamentos`}
              {tab === 'pagar'      && `${pagar.length} lançamentos`}
              {tab === 'caixa'      && `${caixaMovimentos.length} movimentos`}
              {tab === 'faturamento' && `${mockInvoices.length} faturas`}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-[13px] text-[var(--text-muted)]">{label}</div>
  )
}
