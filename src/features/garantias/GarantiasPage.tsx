import { useState, useMemo } from 'react'
import { Shield, Search, Plus, CheckCircle2, AlertTriangle, Clock, XCircle, ChevronRight } from 'lucide-react'
import { mockWarranties } from '../../mocks/warranties'
import type { Warranty, WarrantyStatus } from '../../types'
import { EntityDrawer } from '../../components/ui/EntityDrawer'
import { cn } from '../../lib/utils'

const STATUS_CFG: Record<WarrantyStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  ATIVA:     { label: 'Ativa',     color: 'var(--success)', bg: 'var(--success-subtle)', border: 'var(--success-border)', icon: <CheckCircle2 size={11} /> },
  EXPIRADA:  { label: 'Expirada',  color: 'var(--text-muted)', bg: 'var(--surface-muted)', border: 'var(--border)', icon: <Clock size={11} /> },
  UTILIZADA: { label: 'Utilizada', color: 'var(--info)', bg: 'var(--info-subtle)', border: 'var(--info-border)', icon: <CheckCircle2 size={11} /> },
  CANCELADA: { label: 'Cancelada', color: 'var(--danger)', bg: 'var(--danger-subtle)', border: 'var(--danger-border)', icon: <XCircle size={11} /> },
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')

function daysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
}

function WarrantyBadge({ status }: { status: WarrantyStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border" style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
      {c.icon}{c.label}
    </span>
  )
}

export function GarantiasPage() {
  const [warranties]     = useState<Warranty[]>(mockWarranties)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<WarrantyStatus | ''>('')
  const [selected, setSelected] = useState<Warranty | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return warranties.filter(w =>
      (!q || w.customerName.toLowerCase().includes(q) || w.vehicle.toLowerCase().includes(q) || w.plate.toLowerCase().includes(q) || w.serviceOrderNumber.includes(q)) &&
      (!filter || w.status === filter)
    )
  }, [warranties, search, filter])

  const ativas    = warranties.filter(w => w.status === 'ATIVA').length
  const expiradas = warranties.filter(w => w.status === 'EXPIRADA').length
  const expiring  = warranties.filter(w => w.status === 'ATIVA' && daysLeft(w.endDate) <= 14).length

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* ── Fixed header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* Title + CTA */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Garantias</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Controle de garantias emitidas por OS</p>
          </div>
          <button className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[11px] font-bold transition-all hover:shadow-md hover:-translate-y-px flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}>
            <Plus size={12} strokeWidth={2.5} /> Nova garantia
          </button>
        </div>

        {/* KPI chips */}
        <div className="flex items-center gap-3 mb-3">
          {[
            { label: 'Total',        value: warranties.length, color: '#6B7280' },
            { label: 'Ativas',       value: ativas,            color: '#16A34A' },
            { label: 'Expiradas',    value: expiradas,         color: '#9CA3AF' },
            { label: 'Vencendo 14d', value: expiring,          color: '#F59E0B' },
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

        {/* Alert */}
        {expiring > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] mb-3"
            style={{ background: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
            <AlertTriangle size={12} style={{ color: 'var(--warning)' }} className="flex-shrink-0" />
            <p className="flex-1 font-medium" style={{ color: 'var(--warning)' }}>
              {expiring} garantia{expiring > 1 ? 's' : ''} vencem nos próximos 14 dias — avise os clientes
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-[340px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input type="text" placeholder="Buscar por cliente, veículo, placa ou OS..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[12px] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50" />
          </div>
          <div className="flex gap-1.5">
            {(['', 'ATIVA', 'EXPIRADA', 'UTILIZADA'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('h-8 px-3 rounded-lg border text-[11px] font-medium transition-colors',
                  filter === f ? 'border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]')}>
                {f === '' ? 'Todas' : STATUS_CFG[f]?.label ?? f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-5">
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Shield size={32} className="text-[var(--text-disabled)] mb-3" />
            <p className="text-[14px] font-semibold text-[var(--text-secondary)] mb-1">Nenhuma garantia encontrada</p>
            <p className="text-[12px] text-[var(--text-muted)]">As garantias são criadas automaticamente ao finalizar uma OS</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Cliente · Veículo</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden md:table-cell">Serviço coberto</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden lg:table-cell">Validade</th>
                <th className="w-8 px-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const days  = daysLeft(w.endDate)
                const soon  = w.status === 'ATIVA' && days <= 14 && days > 0
                return (
                  <tr key={w.id} onClick={() => setSelected(w)}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{w.customerName}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{w.vehicle} · <span className="font-mono">{w.plate}</span></p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-[var(--text-primary)] line-clamp-1">{w.description}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">OS {w.serviceOrderNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <WarrantyBadge status={w.status} />
                      {soon && <p className="text-[10px] text-[var(--warning)] font-semibold mt-0.5">vence em {days} dia{days !== 1 ? 's' : ''}</p>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--text-muted)] hidden lg:table-cell">
                      <p>{fmtDate(w.startDate)} → {fmtDate(w.endDate)}</p>
                      {w.kmLimit && <p className="text-[11px]">até {w.kmLimit.toLocaleString('pt-BR')} km</p>}
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight size={14} className="text-[var(--text-muted)]" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>

      {/* Drawer */}
      <EntityDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Garantia — ${selected.description}` : ''}
        subtitle={selected ? `${selected.customerName} · ${selected.plate}` : ''}
        size="md"
      >
        {selected && (
          <div className="p-5 space-y-5">
            <WarrantyBadge status={selected.status} />

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Cliente',   value: selected.customerName },
                { label: 'Veículo',   value: `${selected.vehicle} · ${selected.plate}` },
                { label: 'OS origem', value: selected.serviceOrderNumber },
                { label: 'Início',    value: fmtDate(selected.startDate) },
                { label: 'Fim',       value: fmtDate(selected.endDate) },
                { label: 'Km no serviço', value: selected.kmAtService.toLocaleString('pt-BR') + ' km' },
              ].map(r => (
                <div key={r.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{r.label}</p>
                  <p className="text-[12px] font-medium text-[var(--text-primary)]">{r.value}</p>
                </div>
              ))}
            </div>

            {selected.coveredServices.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Serviços cobertos</p>
                <ul className="space-y-1">
                  {selected.coveredServices.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                      <CheckCircle2 size={12} className="text-[var(--success)] flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.coveredParts.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Peças cobertas</p>
                <ul className="space-y-1">
                  {selected.coveredParts.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                      <CheckCircle2 size={12} className="text-[var(--success)] flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.notes && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Observações</p>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </EntityDrawer>
    </div>
  )
}
