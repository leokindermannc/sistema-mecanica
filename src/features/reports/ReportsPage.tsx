import { useState } from 'react'
import { TrendingUp, TrendingDown, Download, ArrowRight } from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import { mockFinance }    from '../../mocks/finance'
import { mockPurchases }  from '../../mocks/purchases'
import { mockParts }      from '../../mocks/parts'
import { mockSchedule }   from '../../mocks/schedule'
import { mockServiceOrders } from '../../mocks/service-orders'

// ─── Period ───────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | 'mes'
const PERIOD_LABELS: Record<Period, string> = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', 'mes': 'Este mês' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const WEEKLY_REVENUE = [
  { day: 'Seg', value: 1200 }, { day: 'Ter', value: 2850 },
  { day: 'Qua', value: 1980 }, { day: 'Qui', value: 3400 },
  { day: 'Sex', value: 4200 }, { day: 'Sáb', value: 2100 },
  { day: 'Dom', value:  890 },
]
const PREV_WEEKLY_REVENUE = [980, 2100, 1600, 2900, 3100, 1800, 700]

function computeData() {
  const received   = mockFinance.filter(f => f.type === 'RECEBER' && f.status === 'PAGA')
  const expenses   = mockFinance.filter(f => f.type === 'PAGAR'   && f.status === 'PAGA')
  const totalRec   = received.reduce((s, f) => s + (f.paidValue ?? f.value), 0)
  const totalExp   = expenses.reduce((s, f) => s + (f.paidValue ?? f.value), 0)
  const ticketMed  = mockServiceOrders.length > 0
    ? mockServiceOrders.reduce((s, o) => s + o.estimatedValue, 0) / mockServiceOrders.length
    : 0

  // OS por status
  const statusCount: Record<string, number> = {}
  for (const o of mockServiceOrders) {
    statusCount[o.status] = (statusCount[o.status] ?? 0) + 1
  }

  // OS por tipo
  const typeMap: Record<string, number> = {}
  for (const o of mockServiceOrders) {
    typeMap[o.type] = (typeMap[o.type] ?? 0) + 1
  }

  // Receita por cliente
  const clientMap = new Map<string, number>()
  for (const f of received) clientMap.set(f.entity, (clientMap.get(f.entity) ?? 0) + (f.paidValue ?? f.value))
  const byClient = [...clientMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  // Por mecânico
  const mechMap: Record<string, number> = {}
  for (const o of mockServiceOrders) {
    mechMap[o.mechanic.name] = (mechMap[o.mechanic.name] ?? 0) + o.estimatedValue
  }
  const byMechanic = Object.entries(mechMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

  // Compras por fornecedor
  const purchMap = new Map<string, number>()
  for (const p of mockPurchases.filter(p => p.status === 'RECEBIDA'))
    purchMap.set(p.supplierName, (purchMap.get(p.supplierName) ?? 0) + p.totalValue)
  const bySupplier = [...purchMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5)

  const lowStock  = mockParts.filter(p => p.status === 'BAIXO').length
  const outStock  = mockParts.filter(p => p.status === 'SEM_ESTOQUE').length
  const stockVal  = mockParts.reduce((s, p) => s + p.currentStock * p.averageCost, 0)

  return { totalRec, totalExp, ticketMed, statusCount, typeMap, byClient, byMechanic, bySupplier, lowStock, outStock, stockVal }
}

// ─── SVG Line/Area Chart ──────────────────────────────────────────────────────

function LineChart({ data, prev, color }: { data: { day: string; value: number }[]; prev: number[]; color: string }) {
  const W = 480; const H = 140; const PAD = 16
  const vals = data.map(d => d.value)
  const max  = Math.max(...vals, ...prev) * 1.15
  const toX  = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const toY  = (v: number) => H - PAD - (v / max) * (H - PAD * 2)

  const curPts  = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
  const prevPts = prev.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const areaPath = `M${toX(0)},${toY(data[0].value)} ` +
    data.slice(1).map((d, i) => `L${toX(i + 1)},${toY(d.value)}`).join(' ') +
    ` L${toX(data.length - 1)},${H - PAD} L${toX(0)},${H - PAD} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y grid lines */}
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD} x2={W - PAD} y1={toY(max * t)} y2={toY(max * t)}
          stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />
      {/* Previous week dashed */}
      <polyline points={prevPts} fill="none" stroke="currentColor" strokeOpacity="0.2"
        strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Current line */}
      <polyline points={curPts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.value)} r="3.5" fill={color} stroke="white" strokeWidth="2" />
      ))}
    </svg>
  )
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total  = slices.reduce((s, sl) => s + sl.value, 0)
  const R = 52; const CX = 70; const CY = 70; const STROKE = 18
  let cumAngle = -90

  const arcs = slices.map((sl) => {
    const pct   = total > 0 ? sl.value / total : 0
    const angle = pct * 360
    const start = cumAngle
    cumAngle += angle
    const r = R
    const x1 = CX + r * Math.cos((start * Math.PI) / 180)
    const y1 = CY + r * Math.sin((start * Math.PI) / 180)
    const x2 = CX + r * Math.cos(((start + angle) * Math.PI) / 180)
    const y2 = CY + r * Math.sin(((start + angle) * Math.PI) / 180)
    const large = angle > 180 ? 1 : 0
    return { ...sl, pct, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, angle }
  })

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="w-[140px] h-[140px] flex-shrink-0">
        {arcs.map((arc, i) => (
          arc.angle > 0 && (
            <path key={i} d={arc.d} fill="none" stroke={arc.color}
              strokeWidth={STROKE} strokeLinecap="butt" />
          )
        ))}
        <circle cx={CX} cy={CY} r={R - STROKE / 2 - 1} fill="transparent" />
        <text x={CX} y={CY - 6} textAnchor="middle" className="fill-current" fontSize="18" fontWeight="800" fill="currentColor">
          {total}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.45" fontWeight="600">
          TOTAL OS
        </text>
      </svg>
      <div className="space-y-2 flex-1 min-w-0">
        {slices.map((sl) => (
          <div key={sl.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sl.color }} />
            <span className="text-[10px] text-t-secondary truncate flex-1">{sl.label}</span>
            <span className="text-[10px] font-bold text-t-text tabular-nums">{sl.value}</span>
            <span className="text-[9px] text-t-muted tabular-nums w-9 text-right">
              {total > 0 ? `${Math.round((sl.value / total) * 100)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────

function HBar({ label, value, max, color, format = (v: number) => String(v) }: {
  label: string; value: number; max: number; color: string; format?: (v: number) => string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-t-secondary w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-t-surface rounded-full h-[6px] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-semibold text-t-text w-20 text-right flex-shrink-0 tabular-nums">{format(value)}</span>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, color }: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down'; color: string
}) {
  return (
    <div className="bg-t-card rounded-2xl border border-t-border p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />
      <p className="text-[10px] font-bold text-t-muted uppercase tracking-wider mb-2">{label}</p>
      <p className="text-[22px] font-black text-t-text leading-none tabular-nums">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend === 'up'   && <TrendingUp  size={10} className="text-green-600" />}
          {trend === 'down' && <TrendingDown size={10} className="text-red-500" />}
          <span className={cn('text-[9px] font-semibold', trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-t-muted')}>
            {sub}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ title, action, children, className }: {
  title: string; action?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('bg-t-card rounded-2xl border border-t-border overflow-hidden', className)}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-t-border">
        <h3 className="text-[12px] font-bold text-t-text">{title}</h3>
        {action && (
          <button className="flex items-center gap-1 text-[10px] text-t-muted hover:text-accent transition-colors">
            {action} <ArrowRight size={9} />
          </button>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  AGENDADO: 'Agendado', EM_ANALISE: 'Diagnóstico', AGUARDANDO_APROVACAO: 'Ag. Aprovação',
  EM_ANDAMENTO: 'Em serviço', CONCLUIDO: 'Concluído', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  AGENDADO: '#9CA3AF', EM_ANALISE: '#60A5FA', AGUARDANDO_APROVACAO: '#F97316',
  EM_ANDAMENTO: '#A78BFA', CONCLUIDO: '#34D399', ENTREGUE: '#6EE7B7', CANCELADO: '#F87171',
}
const TYPE_LABEL: Record<string, string> = {
  DIAGNOSTICO: 'Diagnóstico', REVISAO: 'Revisão', TROCA_PECA: 'Troca de peça',
  GARANTIA: 'Garantia', RETORNO: 'Retorno', ORCAMENTO: 'Orçamento',
}

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const d = computeData()

  const weeklyCur  = WEEKLY_REVENUE.reduce((s, r) => s + r.value, 0)
  const weeklyPrev = PREV_WEEKLY_REVENUE.reduce((s, v) => s + v, 0)
  const weeklyDiff = weeklyPrev > 0 ? ((weeklyCur - weeklyPrev) / weeklyPrev) * 100 : 0

  const osStatusSlices = Object.entries(d.statusCount).map(([key, val]) => ({
    label: STATUS_LABEL[key] ?? key,
    value: val,
    color: STATUS_COLOR[key] ?? '#9CA3AF',
  })).sort((a, b) => b.value - a.value)

  const osTypeData = Object.entries(d.typeMap).map(([key, val]) => ({
    label: TYPE_LABEL[key] ?? key, value: val,
  })).sort((a, b) => b.value - a.value)
  const maxType = osTypeData[0]?.value ?? 1

  const maxClient  = d.byClient[0]?.value  ?? 1
  const maxMechanic = d.byMechanic[0]?.value ?? 1
  const maxSupplier = d.bySupplier[0]?.value ?? 1

  const recentOS = [...mockServiceOrders]
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
    .slice(0, 6)

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-t-border bg-t-topbar">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[15px] font-bold text-t-text leading-tight tracking-tight">Relatórios</h1>
            <p className="text-[10px] text-t-muted mt-0.5">Análise de desempenho e receita da oficina.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center bg-t-surface border border-t-border rounded-lg p-[3px] gap-[2px]">
              {(['7d', '30d', 'mes'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'h-6 px-2.5 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap',
                    period === p
                      ? 'bg-white dark:bg-white/10 text-t-text shadow-sm'
                      : 'text-t-muted hover:text-t-secondary',
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-t-border bg-t-surface text-t-secondary text-[10px] font-semibold hover:text-t-text transition-colors">
              <Download size={11} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* ── KPI row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Receita recebida" value={formatCurrency(d.totalRec)}
            sub={`+${weeklyDiff.toFixed(1)}% vs semana anterior`} trend="up" color="#22C55E" />
          <KpiCard label="Despesas pagas"   value={formatCurrency(d.totalExp)}
            sub="período selecionado" color="#EF4444" />
          <KpiCard label="Ticket médio OS"  value={formatCurrency(d.ticketMed)}
            sub={`${mockServiceOrders.length} ordens no período`} color="#F97316" />
          <KpiCard label="Agendamentos"     value={String(mockSchedule.length)}
            sub="total do período" color="#A78BFA" />
        </div>

        {/* ── Row 1: Line chart + Donut ────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Line chart */}
          <div className="col-span-3 bg-t-card rounded-2xl border border-t-border overflow-hidden">
            <div className="flex items-start justify-between px-5 py-3.5 border-b border-t-border">
              <div>
                <h3 className="text-[12px] font-bold text-t-text">Receita Semanal</h3>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-[20px] font-black text-t-text tabular-nums">{formatCurrency(weeklyCur)}</span>
                  <span className={cn('flex items-center gap-0.5 text-[10px] font-bold',
                    weeklyDiff >= 0 ? 'text-green-600' : 'text-red-500')}>
                    {weeklyDiff >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(weeklyDiff).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-t-muted mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-[2px] rounded bg-[#F97316] inline-block" />
                  Semana atual
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-[2px] rounded border-t border-dashed border-t-muted inline-block" />
                  Semana anterior
                </span>
              </div>
            </div>
            <div className="px-5 pt-3 pb-1 h-[170px]">
              <LineChart data={WEEKLY_REVENUE} prev={PREV_WEEKLY_REVENUE} color="#F97316" />
            </div>
            <div className="flex justify-between px-5 pb-3">
              {WEEKLY_REVENUE.map((d) => (
                <span key={d.day} className="text-[9px] text-t-muted">{d.day}</span>
              ))}
            </div>
          </div>

          {/* Donut: OS por Status */}
          <div className="col-span-2 bg-t-card rounded-2xl border border-t-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-t-border">
              <h3 className="text-[12px] font-bold text-t-text">OS por Status</h3>
              <p className="text-[10px] text-t-muted mt-0.5">Distribuição das ordens de serviço</p>
            </div>
            <div className="px-5 py-4">
              <DonutChart slices={osStatusSlices} />
            </div>
          </div>
        </div>

        {/* ── Row 2: three columns ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Receita por cliente */}
          <Card title="Receita por Cliente" action="Ver todos">
            <div className="space-y-3">
              {d.byClient.map(r => (
                <HBar key={r.label} label={r.label} value={r.value} max={maxClient}
                  color="#22C55E" format={formatCurrency} />
              ))}
              {d.byClient.length === 0 && (
                <p className="text-[11px] text-t-muted text-center py-4">Sem dados</p>
              )}
            </div>
          </Card>

          {/* OS por mecânico */}
          <Card title="OS por Mecânico">
            <div className="space-y-3">
              {d.byMechanic.map(r => (
                <HBar key={r.label} label={r.label.split(' ')[0]} value={r.value} max={maxMechanic}
                  color="#A78BFA" format={formatCurrency} />
              ))}
              <div className="pt-2 border-t border-t-border space-y-2">
                <p className="text-[8px] font-bold text-t-muted uppercase tracking-wider">Por tipo de serviço</p>
                {osTypeData.map(r => (
                  <HBar key={r.label} label={r.label} value={r.value} max={maxType} color="#60A5FA" />
                ))}
              </div>
            </div>
          </Card>

          {/* OS Recentes */}
          <Card title="OS Recentes" action="Ver todas">
            <div className="space-y-2">
              {recentOS.map(os => (
                <div key={os.id} className="flex items-center gap-3 py-1.5 border-b border-t-border last:border-0">
                  <div className="w-6 h-6 rounded-lg bg-t-surface flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-t-muted">{os.mechanic.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-t-text truncate">{os.customerName}</p>
                    <p className="text-[9px] text-t-muted font-mono">{os.plate}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {os.estimatedValue > 0 ? (
                      <p className="text-[11px] font-bold text-t-text tabular-nums">{formatCurrency(os.estimatedValue)}</p>
                    ) : (
                      <p className="text-[10px] italic text-t-muted">A definir</p>
                    )}
                    <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                      style={{ backgroundColor: `${STATUS_COLOR[os.status]}20`, color: STATUS_COLOR[os.status] }}>
                      {STATUS_LABEL[os.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row 3: Compras + Estoque ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <Card title="Compras por Fornecedor" className="col-span-2">
            <div className="space-y-3">
              {d.bySupplier.map(r => (
                <HBar key={r.label} label={r.label} value={r.value} max={maxSupplier}
                  color="#6366F1" format={formatCurrency} />
              ))}
              {d.bySupplier.length === 0 && (
                <p className="text-[11px] text-t-muted text-center py-4">Sem compras recebidas</p>
              )}
            </div>
          </Card>

          <Card title="Estoque">
            <div className="space-y-3">
              <div className="rounded-xl bg-t-surface border border-t-border p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-t-muted">Valor total</p>
                  <p className="text-[13px] font-black text-t-text tabular-nums">{formatCurrency(d.stockVal)}</p>
                </div>
                <div className="h-px bg-t-border" />
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-t-muted">Abaixo do mínimo</p>
                  <span className="text-[11px] font-bold text-amber-600">{d.lowStock} peças</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-t-muted">Sem estoque</p>
                  <span className="text-[11px] font-bold text-red-600">{d.outStock} peças</span>
                </div>
              </div>
              <div className="rounded-xl bg-t-surface border border-t-border p-3">
                <p className="text-[10px] text-t-muted mb-1">Total de peças cadastradas</p>
                <p className="text-[20px] font-black text-t-text">{mockParts.length}</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
