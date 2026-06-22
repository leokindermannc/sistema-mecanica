import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Users, Car, ClipboardList, Repeat,
  ChevronRight, Phone, Building2, User,
} from 'lucide-react'
import { mockCustomers } from '../../mocks/customers'
import { mockVehicles }  from '../../mocks/vehicles'
import { mockServiceOrders } from '../../mocks/service-orders'
import { cn, formatDate } from '../../lib/utils'

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'clientes' | 'veiculos' | 'historico'

const TABS: { key: Tab; label: string }[] = [
  { key: 'clientes',  label: 'Clientes' },
  { key: 'veiculos',  label: 'Veículos' },
  { key: 'historico', label: 'Histórico' },
]

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, accent }: {
  label: string; value: number; icon: React.ReactNode; accent: string
}) {
  return (
    <div className="relative flex flex-col gap-2 p-3.5 rounded-lg border bg-[var(--surface)] border-[var(--border)]">
      <span className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-lg" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">{label}</span>
        <span className="p-1.5 rounded" style={{ backgroundColor: accent + '18', color: accent }}>{icon}</span>
      </div>
      <span className="text-[22px] font-extrabold text-[var(--text-primary)] leading-none">{value}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CadastrosPage() {
  const [tab, setTab]       = useState<Tab>('clientes')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => ({
    clientes:    mockCustomers.length,
    veiculos:    mockVehicles.length,
    recentes:    mockServiceOrders.filter(os => ['CONCLUIDO', 'ENTREGUE'].includes(os.status)).length,
    recorrentes: mockCustomers.filter(c => c.openOrdersCount > 0).length,
  }), [])

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return mockCustomers
    const q = search.toLowerCase()
    return mockCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.document?.toLowerCase().includes(q),
    )
  }, [search])

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return mockVehicles
    const q = search.toLowerCase()
    return mockVehicles.filter(v =>
      v.plate?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q) ||
      v.customerName?.toLowerCase().includes(q),
    )
  }, [search])

  const filteredHistory = useMemo(() => {
    if (!search.trim()) return mockServiceOrders
    const q = search.toLowerCase()
    return mockServiceOrders.filter(os =>
      os.plate?.toLowerCase().includes(q) ||
      os.vehicle.toLowerCase().includes(q) ||
      os.customerName?.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--text-primary)] tracking-tight">Cadastros</h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
              Gerencie clientes, veículos e dados importantes da oficina.
            </p>
          </div>
          <Link
            to="/clientes"
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--brand)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
          >
            <Plus size={13} strokeWidth={2.5} />
            Novo cadastro
          </Link>
        </div>

        {/* ── Search bar ────────────────────────────────────────── */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone, placa ou modelo..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
          />
        </div>

        {/* ── KPI row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Clientes"           value={stats.clientes}    icon={<Users size={13} />}        accent="#2563EB" />
          <KpiCard label="Veículos"           value={stats.veiculos}    icon={<Car size={13} />}          accent="var(--brand)" />
          <KpiCard label="Atendidos recentes" value={stats.recentes}    icon={<ClipboardList size={13} />} accent="var(--success)" />
          <KpiCard label="Recorrentes"        value={stats.recorrentes} icon={<Repeat size={13} />}       accent="#7C3AED" />
        </div>

        {/* ── Tab panel ─────────────────────────────────────────── */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)] px-4" role="tablist">
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

          {/* ── Tab: Clientes ─────────────────────────────────── */}
          {tab === 'clientes' && (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">Nome</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-32">Telefone</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-20 text-center">Veículos</span>
                <span className="w-10" />
              </div>
              <div className="divide-y divide-[var(--border)]">
                {filteredCustomers.length === 0 ? (
                  <EmptyRow label="Nenhum cliente encontrado" />
                ) : filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ backgroundColor: 'var(--brand-muted)', color: 'var(--brand)' }}
                    >
                      {c.type === 'PJ' ? <Building2 size={12} /> : c.name.charAt(0).toUpperCase()}
                    </div>
                    <Link to={`/cadastros/clientes/${c.id}`} className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{c.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">{c.email ?? 'Sem e-mail'}</p>
                      </div>
                      <span className="hidden sm:flex items-center gap-1 text-[12px] text-[var(--text-secondary)] w-32">
                        <Phone size={10} className="text-[var(--text-muted)]" />
                        {c.phone ?? '—'}
                      </span>
                      <span className="hidden sm:block text-[12px] font-medium text-center text-[var(--text-secondary)] w-20">
                        {c.vehiclesCount} {c.vehiclesCount === 1 ? 'veículo' : 'veículos'}
                      </span>
                    </Link>
                    <Link
                      to="/servicos"
                      className="hidden sm:flex flex-shrink-0 items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded border transition-colors hover:opacity-80"
                      style={{ color: 'var(--brand)', backgroundColor: 'rgba(212,96,26,0.07)', borderColor: 'rgba(212,96,26,0.25)' }}
                    >
                      <Plus size={9} /> Nova OS
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Tab: Veículos ─────────────────────────────────── */}
          {tab === 'veiculos' && (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">Veículo</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-24">Placa</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-28">Proprietário</span>
                <span className="w-10" />
              </div>
              <div className="divide-y divide-[var(--border)]">
                {filteredVehicles.length === 0 ? (
                  <EmptyRow label="Nenhum veículo encontrado" />
                ) : filteredVehicles.map(v => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group"
                  >
                    <span
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563EB' }}
                    >
                      <Car size={13} />
                    </span>
                    <Link to="/veiculos" className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                          {v.brand} {v.model} {v.year}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">{v.color ?? ''}</p>
                      </div>
                      <span className="hidden sm:block font-mono text-[12px] font-medium text-[var(--text-secondary)] w-24">{v.plate}</span>
                      <span className="hidden sm:flex items-center gap-1 text-[12px] text-[var(--text-secondary)] w-28">
                        <User size={10} className="text-[var(--text-muted)]" />
                        <span className="truncate">{v.customerName ?? '—'}</span>
                      </span>
                    </Link>
                    <Link
                      to="/patio"
                      className="hidden sm:flex flex-shrink-0 items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded border transition-colors hover:opacity-80"
                      style={{ color: '#1A4E8C', backgroundColor: 'rgba(26,78,140,0.07)', borderColor: 'rgba(26,78,140,0.25)' }}
                    >
                      <ChevronRight size={9} /> Pátio
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Tab: Histórico ────────────────────────────────── */}
          {tab === 'historico' && (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">OS / Veículo</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-24">Data</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] w-28 text-center">Status</span>
                <span className="w-10" />
              </div>
              <div className="divide-y divide-[var(--border)]">
                {filteredHistory.length === 0 ? (
                  <EmptyRow label="Nenhum histórico encontrado" />
                ) : filteredHistory.map(os => {
                  const statusKey = os.status === 'ENTREGUE' ? 'entregue'
                    : os.status === 'CONCLUIDO' ? 'concluido'
                    : os.status === 'CANCELADO' ? 'cancelado'
                    : os.status === 'EM_ANDAMENTO' ? 'andamento'
                    : 'agendado'
                  return (
                    <Link
                      key={os.id}
                      to={`/ordens-servico/${os.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group"
                    >
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                            {os.vehicle}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">
                            {os.customerName} · #{os.number}
                          </p>
                        </div>
                        <span className="hidden sm:block text-[12px] text-[var(--text-muted)] w-24">
                          {formatDate(os.entryDate)}
                        </span>
                        <span
                          className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border w-28 justify-center"
                          style={{
                            color:           `var(--os-${statusKey}-text)`,
                            backgroundColor: `var(--os-${statusKey}-bg)`,
                            borderColor:     `var(--os-${statusKey}-border)`,
                          }}
                        >
                          {os.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]">
            <span className="text-[11px] text-[var(--text-muted)]">
              {tab === 'clientes' && `${filteredCustomers.length} clientes`}
              {tab === 'veiculos' && `${filteredVehicles.length} veículos`}
              {tab === 'historico' && `${filteredHistory.length} atendimentos`}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-[13px] text-[var(--text-muted)]">
      {label}
    </div>
  )
}
