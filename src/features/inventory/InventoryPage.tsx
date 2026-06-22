import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownToLine, SlidersHorizontal, Search, X, FileCode, FileSpreadsheet, Zap } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { PartDrawer, PART_STATUS_STYLE } from './PartDrawer'
import { mockParts } from '../../mocks/parts'
import { mockStockMovements } from '../../mocks/stock-movements'
import { formatCurrency } from '../../lib/utils'
import type { PartStatus } from '../../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  Filtros:       { bg: 'rgba(37,99,235,0.10)',  text: '#2563EB' },
  Freios:        { bg: 'rgba(239,68,68,0.10)',  text: '#DC2626' },
  Motor:         { bg: 'rgba(124,58,237,0.10)', text: '#7C3AED' },
  Óleos:         { bg: 'rgba(180,83,9,0.10)',   text: '#B45309' },
  Fluidos:       { bg: 'rgba(8,145,178,0.10)',  text: '#0891B2' },
  Ignição:       { bg: 'rgba(249,115,22,0.10)', text: '#EA580C' },
  Suspensão:     { bg: 'rgba(22,163,74,0.10)',  text: '#15803D' },
  Elétrica:      { bg: 'rgba(234,179,8,0.12)',  text: '#A16207' },
}

const CATEGORIES = [...new Set(mockParts.map((p) => p.category))].sort()

// ── Helpers ───────────────────────────────────────────────────────────────────

function StockBar({ current, min }: { current: number; min: number }) {
  const pct = min > 0 ? Math.min((current / (min * 2)) * 100, 100) : 100
  const color =
    current === 0 ? '#EF4444' : current <= min ? '#B45309' : '#16A34A'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 rounded-full bg-t-surface border border-t-border overflow-hidden flex-shrink-0">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[11px] font-semibold" style={{ color }}>
        {current}
      </span>
    </div>
  )
}

function MarginCell({ cost, price }: { cost: number; price: number }) {
  const pct = cost > 0 ? ((price - cost) / cost) * 100 : 0
  const color = pct >= 30 ? '#16A34A' : pct >= 15 ? '#B45309' : '#EF4444'
  return (
    <span className="font-mono text-[11px] font-semibold" style={{ color }}>
      {pct.toFixed(0)}%
    </span>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 bg-t-card border border-t-border rounded-md text-[11px] text-t-text pl-2.5 pr-6 focus:outline-none focus:ring-1 focus:ring-accent/40 appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Filters {
  search: string
  category: string
  status: PartStatus | ''
}

export function InventoryPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>({ search: '', category: '', status: '' })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => mockParts.filter((p) => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !p.description.toLowerCase().includes(q) &&
        !p.internalCode.toLowerCase().includes(q) &&
        !(p.manufacturerCode ?? '').toLowerCase().includes(q) &&
        !(p.barcode ?? '').includes(q)
      ) return false
    }
    if (filters.category && p.category !== filters.category) return false
    if (filters.status   && p.status   !== filters.status)   return false
    return true
  }), [filters])

  const selectedPart = selectedId ? mockParts.find((p) => p.id === selectedId) ?? null : null

  // ── Summary stats ──────────────────────────────────────────────────────────
  const total     = mockParts.length
  const baixo     = mockParts.filter((p) => p.status === 'BAIXO').length
  const semEstq   = mockParts.filter((p) => p.status === 'SEM_ESTOQUE').length
  const inativos  = mockParts.filter((p) => p.status === 'INATIVO').length
  const valorEstq = mockParts
    .filter((p) => p.status !== 'INATIVO')
    .reduce((s, p) => s + p.currentStock * p.averageCost, 0)
  const movsThisMonth = mockStockMovements.filter((m) =>
    m.createdAt.startsWith('2026-06')
  ).length

  const activeFilters = [filters.category, filters.status].filter(Boolean).length

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-t-border bg-t-topbar">
        <PageHeader
          title="Estoque"
          subtitle="Controle de peças, níveis de estoque e movimentações."
          actions={
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate('/estoque/importar?open=xml')}
                className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-t-border bg-t-card text-[11px] font-medium text-t-secondary hover:text-t-text transition-colors shadow-card"
              >
                <FileCode size={11} />
                Importar XML
              </button>
              <button
                onClick={() => navigate('/estoque/importar?open=spreadsheet')}
                className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-t-border bg-t-card text-[11px] font-medium text-t-secondary hover:text-t-text transition-colors shadow-card"
              >
                <FileSpreadsheet size={11} />
                Importar Planilha
              </button>
              <button className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-t-border bg-t-card text-[11px] font-medium text-t-secondary hover:text-t-text transition-colors shadow-card">
                <SlidersHorizontal size={11} />
                Ajuste
              </button>
              <button className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-t-border bg-t-card text-[11px] font-medium text-t-secondary hover:text-t-text transition-colors shadow-card">
                <ArrowDownToLine size={11} />
                Entrada
              </button>
              <button
                onClick={() => navigate('/estoque/importar?open=quick')}
                className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-gray-900 hover:bg-black dark:bg-t-text dark:text-gray-900 text-white text-[11px] font-semibold transition-colors shadow-sm"
              >
                <Zap size={12} />
                Nova Peça Rápida
              </button>
            </div>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-2.5 mb-4 mt-4">
          {[
            { label: 'Total Peças',      value: total,                    color: '#2563EB' },
            { label: 'Estoque Baixo',    value: baixo,                    color: '#B45309' },
            { label: 'Sem Estoque',      value: semEstq,                  color: '#EF4444' },
            { label: 'Inativos',         value: inativos,                 color: '#52525B' },
            { label: 'Valor em Estoque', value: formatCurrency(valorEstq), color: '#16A34A' },
          ].map((s) => (
            <div
              key={s.label}
              className="relative rounded-lg border border-t-border bg-t-card overflow-hidden p-3"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: s.color }} />
              <p className="text-[10px] font-semibold text-t-muted uppercase tracking-[0.06em] mb-1 mt-0.5">
                {s.label}
              </p>
              <p className="text-[18px] font-bold text-t-text leading-none tracking-tight">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-t-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Código, descrição ou código de barras..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="h-7 w-64 bg-t-surface border border-t-border rounded-md text-[11px] text-t-text placeholder:text-t-muted pl-7 pr-3 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-colors"
            />
          </div>

          <FilterSelect
            value={filters.category}
            onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
            placeholder="Categoria"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <FilterSelect
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v as PartStatus | '' }))}
            placeholder="Status"
            options={[
              { value: 'NORMAL',      label: 'Normal' },
              { value: 'BAIXO',       label: 'Estoque Baixo' },
              { value: 'SEM_ESTOQUE', label: 'Sem Estoque' },
              { value: 'INATIVO',     label: 'Inativo' },
            ]}
          />

          {(activeFilters > 0 || filters.search) && (
            <button
              onClick={() => setFilters({ search: '', category: '', status: '' })}
              className="flex items-center gap-1 text-[11px] text-t-muted hover:text-danger transition-colors"
            >
              <X size={11} /> Limpar
            </button>
          )}

          <span className="ml-auto text-[11px] text-t-muted">
            {filtered.length} peça{filtered.length !== 1 ? 's' : ''} · {movsThisMonth} mov. no mês
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 bg-t-bg"
        style={{ paddingRight: selectedId ? 620 : 20 }}
      >
        {/* Import banner */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 mb-3">
          <div>
            <p className="text-xs font-semibold text-t-text">Cadastro facilitado</p>
            <p className="text-xs text-t-muted">Importe XML de compra ou planilha para cadastrar peças automaticamente.</p>
          </div>
          <button
            onClick={() => navigate('/estoque/importar')}
            className="flex-shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold transition-colors"
          >
            Importar agora
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={16} />}
            title="Nenhuma peça encontrada"
            description="Tente ajustar os filtros ou cadastre uma nova peça."
          />
        ) : (
          <div
            className="rounded-lg border border-t-border bg-t-card overflow-hidden overflow-x-auto"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-t-border bg-t-surface">
                  {['Código', 'Descrição', 'Estoque', 'Mín', 'Custo', 'Preço', 'Margem', 'Fornecedor', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 text-[10px] font-semibold text-t-muted uppercase tracking-widest whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-t-border">
                {filtered.map((p) => {
                  const catStyle = CATEGORY_COLOR[p.category] ?? { bg: 'rgba(82,82,91,0.10)', text: '#52525B' }
                  const ss = PART_STATUS_STYLE[p.status]
                  const isSelected = p.id === selectedId
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(isSelected ? null : p.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-t-surface' : 'hover:bg-t-card-hover'
                      }`}
                    >
                      {/* Código */}
                      <td className="px-3 py-2.5 w-[80px]">
                        <span className="font-mono text-[10px] text-t-muted bg-t-surface border border-t-border rounded px-1.5 py-[2px]">
                          {p.internalCode}
                        </span>
                      </td>

                      {/* Descrição + categoria */}
                      <td className="px-3 py-2.5 max-w-[240px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[12px] font-medium text-t-text leading-tight truncate">
                            {p.description}
                          </span>
                          <span
                            className="text-[9px] font-semibold uppercase rounded px-1.5 py-[2px] flex-shrink-0 whitespace-nowrap"
                            style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
                          >
                            {p.category}
                          </span>
                        </div>
                      </td>

                      {/* Estoque */}
                      <td className="px-3 py-2.5 w-[100px]">
                        <StockBar current={p.currentStock} min={p.minimumStock} />
                      </td>

                      {/* Mín */}
                      <td className="px-3 py-2.5 w-[50px]">
                        <span className="text-[11px] text-t-muted">{p.minimumStock}</span>
                      </td>

                      {/* Custo */}
                      <td className="px-3 py-2.5 w-[90px]">
                        <span className="font-mono text-[11px] text-t-secondary">
                          {formatCurrency(p.averageCost)}
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="px-3 py-2.5 w-[90px]">
                        <span className="font-mono text-[11px] font-medium text-t-text">
                          {formatCurrency(p.salePrice)}
                        </span>
                      </td>

                      {/* Margem */}
                      <td className="px-3 py-2.5 w-[65px]">
                        <MarginCell cost={p.averageCost} price={p.salePrice} />
                      </td>

                      {/* Fornecedor */}
                      <td className="px-3 py-2.5 w-[130px]">
                        <span className="text-[11px] text-t-secondary truncate block max-w-[120px]">
                          {p.supplierName ?? '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase rounded-[3px] px-1.5 py-[2px] leading-none whitespace-nowrap"
                          style={{ backgroundColor: ss.bg, color: ss.text }}
                        >
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {ss.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Drawer ────────────────────────────────────────────────────────── */}
      <PartDrawer part={selectedPart} onClose={() => setSelectedId(null)} />
    </div>
  )
}
