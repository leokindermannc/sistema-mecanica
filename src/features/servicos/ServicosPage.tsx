import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, ClipboardList,
  AlertTriangle, ChevronRight, ArrowRight,
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
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* Fixed header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* Title + CTA */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Serviços</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Acompanhe ordens de serviço, diagnósticos, orçamentos e finalizações.
            </p>
          </div>
          <Link
            to="/ordens-servico"
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[11px] font-bold transition-all hover:shadow-md hover:-translate-y-px flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Novo serviço
          </Link>
        </div>

        {/* KPI chips */}
        <div className="flex items-center gap-3 mb-3">
          {[
            { label: 'Abertos',     value: stats.abertos,      color: 'var(--brand)',   key: 'ordens'       as Tab },
            { label: 'Diagnóstico', value: stats.diagnosticos,  color: '#7C3AED',        key: 'diagnosticos' as Tab },
            { label: 'Aprovação',   value: stats.aprovacao,     color: 'var(--warning)', key: 'orcamentos'   as Tab },
            { label: 'Finalizados', value: stats.finalizados,   color: 'var(--success)', key: 'finalizados'  as Tab },
          ].map((k, i) => (
            <button key={k.key} onClick={() => setTab(k.key)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {i > 0 && <span className="w-px h-3.5 bg-[var(--border)] flex-shrink-0" />}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: k.color }} />
                <span className="font-bold tabular-nums" style={{ color: k.color }}>{k.value}</span>
                <span className="text-[var(--text-muted)]">{k.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {(stats.aprovacao > 0 || stats.diagnosticos > 0) && (
          <div className="flex flex-col gap-2">
            {stats.aprovacao > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px]"
                style={{ background: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
                <AlertTriangle size={12} style={{ color: 'var(--warning)' }} className="flex-shrink-0" />
                <span className="font-semibold flex-1" style={{ color: 'var(--warning)' }}>
                  {stats.aprovacao} {stats.aprovacao === 1 ? 'orçamento aguarda' : 'orçamentos aguardam'} aprovação
                </span>
                <button onClick={() => setTab('orcamentos')} className="text-[11px] font-bold hover:opacity-80 flex items-center gap-1" style={{ color: 'var(--warning)' }}>
                  Revisar <ArrowRight size={10} />
                </button>
              </div>
            )}
            {stats.diagnosticos > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px]"
                style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.20)' }}>
                <Search size={12} style={{ color: '#7C3AED' }} className="flex-shrink-0" />
                <span className="font-semibold flex-1" style={{ color: '#7C3AED' }}>
                  {stats.diagnosticos} {stats.diagnosticos === 1 ? 'diagnóstico pendente' : 'diagnósticos pendentes'}
                </span>
                <button onClick={() => setTab('diagnosticos')} className="text-[11px] font-bold hover:opacity-80 flex items-center gap-1" style={{ color: '#7C3AED' }}>
                  Ver <ArrowRight size={10} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4">

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
