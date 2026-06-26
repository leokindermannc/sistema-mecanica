import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, AlertTriangle,
  ChevronRight, ArrowRight,
} from 'lucide-react'
import { mockParts }     from '../../mocks/parts'
import { mockPurchases } from '../../mocks/purchases'
import { mockSuppliers } from '../../mocks/suppliers'
import { PartDrawer }    from '../inventory/PartDrawer'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import type { Part, PartStatus, PurchaseStatus } from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

const PART_STATUS_CFG: Record<PartStatus, { label: string; color: string; bg: string }> = {
  NORMAL:      { label: 'Normal',       color: 'var(--success)', bg: 'var(--success-subtle)' },
  BAIXO:       { label: 'Baixo',        color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  SEM_ESTOQUE: { label: 'Sem estoque',  color: 'var(--danger)',  bg: 'var(--danger-subtle)' },
  INATIVO:     { label: 'Inativo',      color: 'var(--text-muted)', bg: 'var(--surface-muted)' },
}

const PURCHASE_STATUS_CFG: Record<PurchaseStatus, { label: string; color: string }> = {
  RASCUNHO:               { label: 'Rascunho',          color: 'var(--text-muted)' },
  AGUARDANDO_RECEBIMENTO: { label: 'Aguard. recebimento', color: 'var(--warning)' },
  RECEBIDA:               { label: 'Recebida',           color: 'var(--success)' },
  CANCELADA:              { label: 'Cancelada',           color: 'var(--danger)' },
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'pecas' | 'compras' | 'entradas' | 'fornecedores'

const TABS: { key: Tab; label: string }[] = [
  { key: 'pecas',        label: 'Peças' },
  { key: 'compras',      label: 'Compras' },
  { key: 'entradas',     label: 'Entradas' },
  { key: 'fornecedores', label: 'Fornecedores' },
]


// ── Main page ─────────────────────────────────────────────────────────────────

export function EstoqueHubPage() {
  const [tab, setTab]               = useState<Tab>('pecas')
  const [search, setSearch]         = useState('')
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)

  const selectedPart = useMemo<Part | null>(
    () => (selectedPartId ? mockParts.find(p => p.id === selectedPartId) ?? null : null),
    [selectedPartId],
  )

  const stats = useMemo(() => ({
    baixoEstoque:      mockParts.filter(p => p.status === 'BAIXO' || p.status === 'SEM_ESTOQUE').length,
    totalPecas:        mockParts.length,
    comprasPendentes:  mockPurchases.filter(p => p.status === 'AGUARDANDO_RECEBIMENTO').length,
    fornecedoresAtivos: mockSuppliers.filter(s => s.status === 'ATIVO').length,
  }), [])

  const filteredParts = useMemo(() => {
    if (!search.trim()) return mockParts
    const q = search.toLowerCase()
    return mockParts.filter(p =>
      p.description.toLowerCase().includes(q) ||
      p.internalCode?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q),
    )
  }, [search])

  const filteredPurchases = useMemo(() => {
    if (!search.trim()) return mockPurchases
    const q = search.toLowerCase()
    return mockPurchases.filter(p =>
      p.supplierName.toLowerCase().includes(q) ||
      p.number.toLowerCase().includes(q),
    )
  }, [search])

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return mockSuppliers
    const q = search.toLowerCase()
    return mockSuppliers.filter(s =>
      (s.tradeName ?? s.corporateName).toLowerCase().includes(q),
    )
  }, [search])

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* Fixed header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* Title + CTA */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Estoque</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Controle peças, compras, entradas e itens com baixa quantidade.
            </p>
          </div>
          <Link
            to="/compras"
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[11px] font-bold transition-all hover:shadow-md hover:-translate-y-px flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Nova compra
          </Link>
        </div>

        {/* KPI chips */}
        <div className="flex items-center gap-3 mb-3">
          {[
            { label: 'Est. baixo',   value: stats.baixoEstoque,      color: stats.baixoEstoque > 0 ? 'var(--warning)' : 'var(--success)', key: 'pecas'        as Tab },
            { label: 'Peças',        value: stats.totalPecas,         color: 'var(--brand)',                                               key: 'pecas'        as Tab },
            { label: 'Compras',      value: stats.comprasPendentes,   color: 'var(--info)',                                                key: 'compras'      as Tab },
            { label: 'Fornecedores', value: stats.fornecedoresAtivos, color: '#7C3AED',                                                   key: 'fornecedores' as Tab },
          ].map((k, i) => (
            <button key={k.label} onClick={() => setTab(k.key)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {i > 0 && <span className="w-px h-3.5 bg-[var(--border)] flex-shrink-0" />}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: k.color }} />
                <span className="font-bold tabular-nums" style={{ color: k.color }}>{k.value}</span>
                <span className="text-[var(--text-muted)]">{k.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Alert */}
        {stats.baixoEstoque > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px]"
            style={{ background: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
            <AlertTriangle size={12} style={{ color: 'var(--warning)' }} className="flex-shrink-0" />
            <span className="font-semibold flex-1" style={{ color: 'var(--warning)' }}>
              {stats.baixoEstoque} {stats.baixoEstoque === 1 ? 'peça' : 'peças'} com estoque abaixo do mínimo — reposição necessária
            </span>
            <button onClick={() => setTab('pecas')} className="text-[11px] font-bold hover:opacity-80 flex items-center gap-1" style={{ color: 'var(--warning)' }}>
              Ver peças <ArrowRight size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4">

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

          {/* ── Tab: Peças ─────────────────────────────────────── */}
          {tab === 'pecas' && (
            <>
              <TableHeader cols={['Descrição / Código', 'Categoria', 'Estoque', 'Ação']} />
              <div className="divide-y divide-[var(--border)]">
                {filteredParts.length === 0
                  ? <EmptyRow label="Nenhuma peça encontrada" />
                  : filteredParts.map(p => {
                    const cfg       = PART_STATUS_CFG[p.status]
                    const isSelected = p.id === selectedPartId
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPartId(isSelected ? null : p.id)}
                        className={cn(
                          'w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors group',
                          isSelected ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]',
                        )}
                      >
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{p.description}</p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono">{p.internalCode}</p>
                          </div>
                          <span className="hidden sm:block text-[12px] text-[var(--text-secondary)] w-28 truncate">{p.category}</span>
                          <div className="hidden sm:block w-28 text-right">
                            <p className="text-[12px] font-semibold tabular-nums" style={{ color: p.currentStock === 0 ? 'var(--danger)' : p.currentStock <= p.minimumStock ? 'var(--warning)' : 'var(--text-primary)' }}>
                              {p.currentStock} {p.unit ?? 'un.'}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)]">mín. {p.minimumStock}</p>
                          </div>
                              {(p.status === 'BAIXO' || p.status === 'SEM_ESTOQUE') ? (
                            <span
                              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-sm w-32 justify-center border"
                              style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.color + '30' }}
                            >
                              <ArrowRight size={9} />
                              {p.status === 'SEM_ESTOQUE' ? 'Repor urgente' : 'Solicitar reposição'}
                            </span>
                          ) : (
                            <span
                              className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm w-24 justify-center"
                              style={{ color: cfg.color, backgroundColor: cfg.bg }}
                            >
                              {cfg.label}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={13} className={cn('flex-shrink-0 transition-colors', isSelected ? 'text-[var(--brand)]' : 'text-[var(--text-disabled)] group-hover:text-[var(--text-muted)]')} />
                      </button>
                    )
                  })
                }
              </div>
            </>
          )}

          {/* ── Tab: Compras ───────────────────────────────────── */}
          {tab === 'compras' && (
            <>
              <TableHeader cols={['Pedido / Fornecedor', 'Data', 'Total', 'Status']} />
              <div className="divide-y divide-[var(--border)]">
                {filteredPurchases.length === 0
                  ? <EmptyRow label="Nenhuma compra encontrada" />
                  : filteredPurchases.map(p => {
                    const cfg = PURCHASE_STATUS_CFG[p.status]
                    return (
                      <Link
                        key={p.id}
                        to="/compras"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group"
                      >
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{p.supplierName}</p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono">{p.number}</p>
                          </div>
                          <span className="hidden sm:block text-[12px] text-[var(--text-muted)] w-24">{formatDate(p.date)}</span>
                          <span className="hidden sm:block text-[12px] font-medium tabular-nums text-[var(--text-primary)] w-24 text-right">
                            {formatCurrency(p.totalValue)}
                          </span>
                          <span
                            className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm w-32 justify-center"
                            style={{ color: cfg.color, backgroundColor: cfg.color + '14' }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
                      </Link>
                    )
                  })
                }
              </div>
            </>
          )}

          {/* ── Tab: Entradas ──────────────────────────────────── */}
          {tab === 'entradas' && (
            <>
              <TableHeader cols={['Compra / Fornecedor', 'Recebido em', 'Itens', 'Total']} />
              <div className="divide-y divide-[var(--border)]">
                {mockPurchases.filter(p => p.status === 'RECEBIDA').length === 0
                  ? <EmptyRow label="Nenhuma entrada registrada" />
                  : mockPurchases
                    .filter(p => p.status === 'RECEBIDA')
                    .map(p => (
                      <Link
                        key={p.id}
                        to="/estoque/importar"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group"
                      >
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{p.supplierName}</p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono">{p.number}</p>
                          </div>
                          <span className="hidden sm:block text-[12px] text-[var(--text-muted)] w-24">
                            {p.receivedAt ? formatDate(p.receivedAt) : '—'}
                          </span>
                          <span className="hidden sm:block text-[12px] font-medium text-[var(--text-secondary)] w-16 text-center">
                            {p.totalItems} itens
                          </span>
                          <span className="hidden sm:block text-[12px] font-medium tabular-nums text-[var(--text-primary)] w-24 text-right">
                            {formatCurrency(p.totalValue)}
                          </span>
                        </div>
                        <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
                      </Link>
                    ))
                }
              </div>
            </>
          )}

          {/* ── Tab: Fornecedores ──────────────────────────────── */}
          {tab === 'fornecedores' && (
            <>
              <TableHeader cols={['Fornecedor', 'Telefone', 'Prazo', 'Status']} />
              <div className="divide-y divide-[var(--border)]">
                {filteredSuppliers.length === 0
                  ? <EmptyRow label="Nenhum fornecedor encontrado" />
                  : filteredSuppliers.map(s => (
                    <Link
                      key={s.id}
                      to="/fornecedores"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group"
                    >
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                            {s.tradeName ?? s.corporateName}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{s.document}</p>
                        </div>
                        <span className="hidden sm:block text-[12px] text-[var(--text-secondary)] w-36">{s.phone ?? '—'}</span>
                        <span className="hidden sm:block text-[12px] text-[var(--text-secondary)] w-20">
                          {s.deliveryDays ? `${s.deliveryDays}d` : '—'}
                        </span>
                        <span
                          className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm w-16 justify-center"
                          style={
                            s.status === 'ATIVO'
                              ? { color: 'var(--success)', backgroundColor: 'var(--success-subtle)' }
                              : { color: 'var(--text-muted)', backgroundColor: 'var(--surface-muted)' }
                          }
                        >
                          {s.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
                    </Link>
                  ))
                }
              </div>
            </>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface-muted)]">
            <span className="text-[11px] text-[var(--text-muted)]">
              {tab === 'pecas' && `${filteredParts.length} peças`}
              {tab === 'compras' && `${filteredPurchases.length} compras`}
              {tab === 'entradas' && `${mockPurchases.filter(p => p.status === 'RECEBIDA').length} entradas`}
              {tab === 'fornecedores' && `${filteredSuppliers.length} fornecedores`}
            </span>
          </div>
        </div>

      </div>

      <PartDrawer part={selectedPart} onClose={() => setSelectedPartId(null)} />
    </div>
  )
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div
      className="hidden sm:grid items-center px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]"
      style={{ gridTemplateColumns: `1fr repeat(${cols.length - 1}, auto) 40px` }}
    >
      {cols.map(c => (
        <span key={c} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">{c}</span>
      ))}
      <span />
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-[13px] text-[var(--text-muted)]">{label}</div>
  )
}
