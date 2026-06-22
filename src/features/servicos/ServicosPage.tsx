import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, ClipboardList,
  CheckCircle2, AlertTriangle, ChevronRight, ArrowRight,
} from 'lucide-react'
import { mockServiceOrders } from '../../mocks/service-orders'
import { cn, formatCurrency } from '../../lib/utils'
import type { ServiceOrderStatus } from '../../types'

// ── Status display config ─────────────────────────────────────────────────────

const STATUS_CFG: Record<ServiceOrderStatus, { label: string; cssKey: string }> = {
  AGENDADO:              { label: 'Agendado',             cssKey: 'agendado' },
  EM_ANALISE:            { label: 'Em diagnóstico',       cssKey: 'analise' },
  AGUARDANDO_APROVACAO:  { label: 'Aguard. aprovação',    cssKey: 'aprovacao' },
  EM_ANDAMENTO:          { label: 'Em serviço',           cssKey: 'andamento' },
  CONCLUIDO:             { label: 'Concluído',            cssKey: 'concluido' },
  ENTREGUE:              { label: 'Entregue',             cssKey: 'entregue' },
  CANCELADO:             { label: 'Cancelado',            cssKey: 'cancelado' },
}

const NEXT_STEP_CFG: Partial<Record<ServiceOrderStatus, { label: string; color: string }>> = {
  AGENDADO:             { label: 'Iniciar diagnóstico', color: '#7C3AED' },
  EM_ANALISE:           { label: 'Criar orçamento',     color: '#7C3AED' },
  AGUARDANDO_APROVACAO: { label: 'Cobrar retorno',      color: 'var(--warning)' },
  EM_ANDAMENTO:         { label: 'Concluir serviço',    color: 'var(--brand)' },
  CONCLUIDO:            { label: 'Entregar veículo',    color: 'var(--success)' },
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'ordens' | 'orcamentos' | 'diagnosticos' | 'finalizados'

const TABS: { key: Tab; label: string }[] = [
  { key: 'ordens',       label: 'Ordens' },
  { key: 'orcamentos',   label: 'Orçamentos' },
  { key: 'diagnosticos', label: 'Diagnósticos' },
  { key: 'finalizados',  label: 'Finalizados' },
]

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, accent, icon, onClick,
}: {
  label: string; value: number; accent: string; icon: React.ReactNode; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative text-left flex flex-col gap-2 p-3.5 rounded-lg border bg-[var(--surface)]',
        'border-[var(--border)] hover:border-[var(--border-strong)] transition-all duration-[160ms]',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <span className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-lg" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">{label}</span>
        <span className="p-1.5 rounded" style={{ backgroundColor: accent + '18', color: accent }}>{icon}</span>
      </div>
      <span className="text-[22px] font-extrabold text-[var(--text-primary)] leading-none">{value}</span>
    </button>
  )
}

// ── OS row ────────────────────────────────────────────────────────────────────

function OsRow({ os }: { os: (typeof mockServiceOrders)[number] }) {
  const cfg = STATUS_CFG[os.status]
  return (
    <Link
      to={`/ordens-servico/${os.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors group"
    >
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: `var(--os-${cfg.cssKey}-text)` }}
      />

      {/* OS info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
            {os.vehicle}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">
            {os.customerName} · #{os.number}
          </p>
        </div>
        <span className="font-mono text-[12px] font-medium text-[var(--text-secondary)] hidden sm:block">{os.plate}</span>
        {NEXT_STEP_CFG[os.status] ? (
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-sm border"
            style={{
              color:           NEXT_STEP_CFG[os.status]!.color,
              backgroundColor: NEXT_STEP_CFG[os.status]!.color + '12',
              borderColor:     NEXT_STEP_CFG[os.status]!.color + '35',
            }}
          >
            <ArrowRight size={9} />{NEXT_STEP_CFG[os.status]!.label}
          </span>
        ) : (
          <span
            className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border"
            style={{
              color:           `var(--os-${cfg.cssKey}-text)`,
              backgroundColor: `var(--os-${cfg.cssKey}-bg)`,
              borderColor:     `var(--os-${cfg.cssKey}-border)`,
            }}
          >
            {cfg.label}
          </span>
        )}
        <span className="text-[12px] font-medium text-[var(--text-secondary)] hidden sm:block tabular-nums">
          {os.estimatedValue ? formatCurrency(os.estimatedValue) : '—'}
        </span>
      </div>

      <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
    </Link>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ServicosPage() {
  const [tab, setTab]       = useState<Tab>('ordens')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => ({
    abertos:       mockServiceOrders.filter(os => !['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status)).length,
    diagnosticos:  mockServiceOrders.filter(os => os.status === 'EM_ANALISE').length,
    aprovacao:     mockServiceOrders.filter(os => os.status === 'AGUARDANDO_APROVACAO').length,
    finalizados:   mockServiceOrders.filter(os => ['CONCLUIDO', 'ENTREGUE'].includes(os.status)).length,
  }), [])

  const filtered = useMemo(() => {
    let list = mockServiceOrders

    // Tab filter
    if (tab === 'orcamentos')   list = list.filter(os => os.status === 'AGUARDANDO_APROVACAO')
    if (tab === 'diagnosticos') list = list.filter(os => os.status === 'EM_ANALISE')
    if (tab === 'finalizados')  list = list.filter(os => ['CONCLUIDO', 'ENTREGUE'].includes(os.status))

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(os =>
        os.plate?.toLowerCase().includes(q) ||
        os.vehicle.toLowerCase().includes(q) ||
        os.customerName?.toLowerCase().includes(q) ||
        os.number.includes(q),
      )
    }

    return list
  }, [tab, search])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--text-primary)] tracking-tight">Serviços</h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
              Acompanhe ordens de serviço, diagnósticos, orçamentos e finalizações.
            </p>
          </div>
          <Link
            to="/ordens-servico"
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--brand)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
          >
            <Plus size={13} strokeWidth={2.5} />
            Novo serviço
          </Link>
        </div>

        {/* ── KPI row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Serviços abertos"
            value={stats.abertos}
            icon={<ClipboardList size={13} />}
            accent="var(--brand)"
            onClick={() => setTab('ordens')}
          />
          <KpiCard
            label="Em diagnóstico"
            value={stats.diagnosticos}
            icon={<Search size={13} />}
            accent="#7C3AED"
            onClick={() => setTab('diagnosticos')}
          />
          <KpiCard
            label="Aguard. aprovação"
            value={stats.aprovacao}
            icon={<AlertTriangle size={13} />}
            accent="var(--warning)"
            onClick={() => setTab('orcamentos')}
          />
          <KpiCard
            label="Finalizados no mês"
            value={stats.finalizados}
            icon={<CheckCircle2 size={13} />}
            accent="var(--success)"
            onClick={() => setTab('finalizados')}
          />
        </div>

        {/* ── Callout urgente ───────────────────────────────────── */}
        {(stats.aprovacao > 0 || stats.diagnosticos > 0) && (
          <div className="space-y-2">
            {stats.aprovacao > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg border"
                style={{ backgroundColor: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                    {stats.aprovacao} {stats.aprovacao === 1 ? 'orçamento aguarda' : 'orçamentos aguardam'} aprovação do cliente
                  </span>
                </div>
                <button onClick={() => setTab('orcamentos')}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--warning)', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                  Revisar <ArrowRight size={10} />
                </button>
              </div>
            )}
            {stats.diagnosticos > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg border"
                style={{ backgroundColor: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.20)' }}>
                <div className="flex items-center gap-2">
                  <Search size={13} style={{ color: '#7C3AED' }} />
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                    {stats.diagnosticos} {stats.diagnosticos === 1 ? 'diagnóstico pendente' : 'diagnósticos pendentes'} — orçamento ainda não enviado
                  </span>
                </div>
                <button onClick={() => setTab('diagnosticos')}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: '#7C3AED', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                  Ver <ArrowRight size={10} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tabs + table ──────────────────────────────────────── */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

          {/* Tab bar + search */}
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

            {/* Search */}
            <div className="relative hidden sm:flex items-center">
              <Search size={12} className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Placa, cliente ou OS..."
                className="h-7 w-44 pl-7 pr-3 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)] transition-all"
              />
            </div>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_40px] items-center px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">Veículo / Cliente</span>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-24 text-center">Placa</span>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-32 text-center">Próx. passo</span>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-24 text-right">Valor</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border)]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList size={28} className="text-[var(--text-disabled)] mb-2" />
                <p className="text-[13px] font-medium text-[var(--text-secondary)]">Nenhum resultado</p>
                <p className="text-[12px] text-[var(--text-muted)]">Tente ajustar a busca ou o filtro.</p>
              </div>
            ) : (
              filtered.map(os => <OsRow key={os.id} os={os} />)
            )}
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]">
              <span className="text-[11px] text-[var(--text-muted)]">{filtered.length} {filtered.length === 1 ? 'ordem' : 'ordens'}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
