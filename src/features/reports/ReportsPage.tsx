import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Download, Calendar, DollarSign,
  Package, Users, ClipboardList, Wrench, BarChart3,
  CheckCircle2, AlertTriangle, Clock, ArrowRight,
} from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import { mockFinance }       from '../../mocks/finance'
import { mockPurchases }     from '../../mocks/purchases'
import { mockParts }         from '../../mocks/parts'
import { mockSchedule }      from '../../mocks/schedule'
import { mockServiceOrders } from '../../mocks/service-orders'
import { mockCustomers }     from '../../mocks/customers'
import { mockMechanics }     from '../../mocks/mechanics'

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = '2026-06-10'

type Period  = '7d' | '30d' | '90d' | 'mes' | 'custom'
type Section = 'geral' | 'financeiro' | 'servicos' | 'clientes' | 'estoque' | 'agenda' | 'equipe'

const PERIOD_OPTS: { key: Period; label: string }[] = [
  { key: '7d',     label: 'Últimos 7 dias'  },
  { key: '30d',    label: 'Últimos 30 dias' },
  { key: '90d',    label: 'Últimos 90 dias' },
  { key: 'mes',    label: 'Este mês'        },
  { key: 'custom', label: 'Personalizado'   },
]

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'geral',      label: 'Visão Geral', icon: <BarChart3     size={12} /> },
  { key: 'financeiro', label: 'Financeiro',  icon: <DollarSign    size={12} /> },
  { key: 'servicos',   label: 'Serviços',    icon: <ClipboardList size={12} /> },
  { key: 'clientes',   label: 'Clientes',    icon: <Users         size={12} /> },
  { key: 'estoque',    label: 'Estoque',     icon: <Package       size={12} /> },
  { key: 'agenda',     label: 'Agenda',      icon: <Calendar      size={12} /> },
  { key: 'equipe',     label: 'Equipe',      icon: <Wrench        size={12} /> },
]

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
const APT_LABEL: Record<string, string> = {
  REVISAO: 'Revisão', REPARO: 'Reparo', ORCAMENTO: 'Orçamento', RETORNO_GARANTIA: 'Garantia',
}
const APT_COLOR: Record<string, string> = {
  REVISAO: '#A78BFA', REPARO: '#F59E0B', ORCAMENTO: '#60A5FA', RETORNO_GARANTIA: '#34D399',
}
const APT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  CONFIRMADO: { label: 'Confirmado', color: '#22C55E' },
  AGENDADO:   { label: 'Agendado',   color: '#60A5FA' },
  CANCELADO:  { label: 'Cancelado',  color: '#EF4444' },
  REALIZADO:  { label: 'Realizado',  color: '#A78BFA' },
}
const PAY_LABEL: Record<string, string> = {
  PIX: 'PIX', CARTAO_CREDITO: 'Cartão Crédito', CARTAO_DEBITO: 'Cartão Débito',
  DINHEIRO: 'Dinheiro', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência',
}

// ── Module CTA ─────────────────────────────────────────────────────────────────

function ModuleCTA({ to, label, sub }: { to: string; label: string; sub: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between mt-6 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all"
    >
      <div>
        <p className="text-[12px] font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{sub}</p>
      </div>
      <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors flex-shrink-0" />
    </Link>
  )
}

const WEEKLY_REV  = [
  { day: 'Seg', value: 1200 }, { day: 'Ter', value: 2850 },
  { day: 'Qua', value: 1980 }, { day: 'Qui', value: 3400 },
  { day: 'Sex', value: 4200 }, { day: 'Sáb', value: 2100 },
  { day: 'Dom', value:  890 },
]
const PREV_REV = [980, 2100, 1600, 2900, 3100, 1800, 700]

// ── Helpers ───────────────────────────────────────────────────────────────────

function periodBounds(p: Period, cs: string, ce: string): [Date, Date] {
  const ref = new Date(TODAY + 'T00:00:00')
  const d   = 86_400_000
  if (p === '7d')  return [new Date(ref.getTime() - 7  * d), ref]
  if (p === '30d') return [new Date(ref.getTime() - 30 * d), ref]
  if (p === '90d') return [new Date(ref.getTime() - 90 * d), ref]
  if (p === 'mes') return [new Date('2026-06-01T00:00:00'), new Date('2026-06-30T23:59:59')]
  return [
    cs ? new Date(cs + 'T00:00:00') : new Date(ref.getTime() - 30 * d),
    ce ? new Date(ce + 'T23:59:59') : ref,
  ]
}

function inRange(dateStr: string | undefined, from: Date, to: Date) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  return d >= from && d <= to
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

// ── Chart: Line ───────────────────────────────────────────────────────────────

function LineChart({ data, prev = [], color }: {
  data: { day: string; value: number }[]
  prev?: number[]
  color: string
}) {
  const W = 480; const H = 140; const PAD = 16
  const vals = data.map(d => d.value)
  const all  = prev.length ? [...vals, ...prev] : vals
  const max  = Math.max(...all, 1) * 1.15
  const n    = Math.max(data.length - 1, 1)
  const toX  = (i: number) => PAD + (i / n) * (W - PAD * 2)
  const toY  = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
  const pts  = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
  const pvPts = prev.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const area = data.length > 0
    ? `M${toX(0)},${toY(data[0].value)} ` +
      data.slice(1).map((d, i) => `L${toX(i + 1)},${toY(d.value)}`).join(' ') +
      ` L${toX(data.length - 1)},${H - PAD} L${toX(0)},${H - PAD} Z`
    : ''
  const gid = `g${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD} x2={W - PAD} y1={toY(max * t)} y2={toY(max * t)}
          stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
      ))}
      {area && <path d={area} fill={`url(#${gid})`} />}
      {prev.length > 0 && (
        <polyline points={pvPts} fill="none" stroke="currentColor" strokeOpacity="0.2"
          strokeWidth="1.5" strokeDasharray="4 3" />
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.value)} r="3.5" fill={color} stroke="white" strokeWidth="2" />
      ))}
    </svg>
  )
}

// ── Chart: Donut ──────────────────────────────────────────────────────────────

function DonutChart({ slices, label }: {
  slices: { label: string; value: number; color: string }[]
  label?: string
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  const R = 50; const CX = 68; const CY = 68; const SW = 17
  let cum = -90
  const arcs = slices.map(sl => {
    const a = total > 0 ? (sl.value / total) * 360 : 0
    const s = cum; cum += a
    const x1 = CX + R * Math.cos(s * Math.PI / 180)
    const y1 = CY + R * Math.sin(s * Math.PI / 180)
    const x2 = CX + R * Math.cos((s + a) * Math.PI / 180)
    const y2 = CY + R * Math.sin((s + a) * Math.PI / 180)
    return { ...sl, a, d: `M ${x1} ${y1} A ${R} ${R} 0 ${a > 180 ? 1 : 0} 1 ${x2} ${y2}` }
  })
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 136 136" className="w-[110px] h-[110px] flex-shrink-0">
        {arcs.map((arc, i) => arc.a > 0 && (
          <path key={i} d={arc.d} fill="none" stroke={arc.color}
            strokeWidth={SW} strokeLinecap="butt" />
        ))}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor">{total}</text>
        {label && (
          <text x={CX} y={CY + 11} textAnchor="middle" fontSize="9"
            fill="currentColor" fillOpacity="0.4" fontWeight="600">{label}</text>
        )}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(sl => (
          <div key={sl.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sl.color }} />
            <span className="text-[10px] text-[var(--text-secondary)] truncate flex-1">{sl.label}</span>
            <span className="text-[10px] font-bold text-[var(--text-primary)] tabular-nums">{sl.value}</span>
            <span className="text-[9px] text-[var(--text-muted)] w-7 text-right tabular-nums">
              {total > 0 ? `${Math.round(sl.value / total * 100)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chart: Horizontal Bar ─────────────────────────────────────────────────────

function HBar({ label, value, max, color, fmt = String }: {
  label: string; value: number; max: number; color: string; fmt?: (v: number) => string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[var(--text-secondary)] w-32 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-[var(--surface-muted)] rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-semibold text-[var(--text-primary)] w-20 text-right tabular-nums">{fmt(value)}</span>
    </div>
  )
}

// ── Reusable UI ───────────────────────────────────────────────────────────────

function Kpi({ label, value, sub, trend, color, icon }: {
  label: string; value: string; sub?: string
  trend?: 'up' | 'down' | 'neutral'; color: string; icon?: React.ReactNode
}) {
  return (
    <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3.5 overflow-hidden">
      <span className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-lg" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between gap-2 mt-0.5">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide leading-tight">{label}</p>
        {icon && <span className="p-1 rounded" style={{ backgroundColor: color + '20', color }}>{icon}</span>}
      </div>
      <p className="text-[22px] font-extrabold text-[var(--text-primary)] tabular-nums leading-none mt-2">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend === 'up'   && <TrendingUp  size={9} style={{ color: 'var(--success)' }} />}
          {trend === 'down' && <TrendingDown size={9} style={{ color: 'var(--danger)'  }} />}
          <span className={cn('text-[9px] font-semibold',
            trend === 'up'   ? 'text-[var(--success)]' :
            trend === 'down' ? 'text-[var(--danger)]'  : 'text-[var(--text-muted)]')}>
            {sub}
          </span>
        </div>
      )}
    </div>
  )
}

function Panel({ title, sub, children, className, action }: {
  title: string; sub?: string; children: React.ReactNode; className?: string; action?: React.ReactNode
}) {
  return (
    <div className={cn('bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden', className)}>
      <div className="flex items-start justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <div>
          <p className="text-[12px] font-bold text-[var(--text-primary)]">{title}</p>
          {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-[11px] text-[var(--text-muted)] text-center py-6">{text}</p>
}

// ── Section: Visão Geral ──────────────────────────────────────────────────────

function GeralSection({ from, to }: { from: Date; to: Date }) {
  const received = mockFinance.filter(f => f.type === 'RECEBER' && f.status === 'PAGA' && inRange(f.paidDate, from, to))
  const expenses = mockFinance.filter(f => f.type === 'PAGAR'   && f.status === 'PAGA' && inRange(f.paidDate, from, to))
  const totalRec = received.reduce((s, f) => s + (f.paidValue ?? f.value), 0)
  const totalExp = expenses.reduce((s, f) => s + (f.paidValue ?? f.value), 0)
  const periodOS = mockServiceOrders.filter(o => inRange(o.entryDate, from, to))
  const ticketMed = periodOS.length > 0
    ? periodOS.reduce((s, o) => s + (o.finalValue ?? o.estimatedValue), 0) / periodOS.length : 0
  const periodApts = mockSchedule.filter(a => inRange(a.date, from, to))

  const statusMap: Record<string, number> = {}
  for (const o of mockServiceOrders) statusMap[o.status] = (statusMap[o.status] ?? 0) + 1
  const statusSlices = Object.entries(statusMap)
    .map(([k, v]) => ({ label: STATUS_LABEL[k] ?? k, value: v, color: STATUS_COLOR[k] ?? '#9CA3AF' }))
    .sort((a, b) => b.value - a.value)

  const clientMap = new Map<string, number>()
  for (const f of received) clientMap.set(f.entity, (clientMap.get(f.entity) ?? 0) + (f.paidValue ?? f.value))
  const topClients = [...clientMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  const maxCli = topClients[0]?.value ?? 1

  const typeMap: Record<string, number> = {}
  for (const o of mockServiceOrders) typeMap[o.type] = (typeMap[o.type] ?? 0) + 1
  const typeItems = Object.entries(typeMap).map(([k, v]) => ({ label: TYPE_LABEL[k] ?? k, value: v })).sort((a, b) => b.value - a.value)
  const maxType = typeItems[0]?.value ?? 1

  const recentOS = [...mockServiceOrders].sort((a, b) => b.entryDate.localeCompare(a.entryDate)).slice(0, 5)
  const weeklyTotal = WEEKLY_REV.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Receita recebida" value={formatCurrency(totalRec)} color="#22C55E" trend="up"
          sub="no período" icon={<DollarSign size={11} />} />
        <Kpi label="Despesas pagas" value={formatCurrency(totalExp)} color="#EF4444"
          sub="no período" icon={<TrendingDown size={11} />} />
        <Kpi label="Ticket médio OS" value={formatCurrency(ticketMed)} color="#F97316"
          sub={`${periodOS.length} OS no período`} icon={<ClipboardList size={11} />} />
        <Kpi label="Agendamentos" value={String(periodApts.length)} color="#A78BFA"
          sub="no período" icon={<Calendar size={11} />} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="flex items-start justify-between px-4 py-3 border-b border-[var(--border)]">
            <div>
              <p className="text-[12px] font-bold text-[var(--text-primary)]">Receita Semanal</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[20px] font-extrabold text-[var(--text-primary)] tabular-nums">{formatCurrency(weeklyTotal)}</span>
                <span className="text-[10px] font-bold text-[var(--success)] flex items-center gap-0.5">
                  <TrendingUp size={10} /> +26.1%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] text-[var(--text-muted)] mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-[2px] rounded inline-block" style={{ backgroundColor: 'var(--brand)' }} />
                Semana atual
              </span>
              <span className="flex items-center gap-1.5 opacity-50">
                <span className="w-4 h-[2px] rounded inline-block border-t border-dashed border-[var(--text-muted)]" />
                Semana anterior
              </span>
            </div>
          </div>
          <div className="px-4 pt-3 pb-1 h-[155px]">
            <LineChart data={WEEKLY_REV} prev={PREV_REV} color="#F97316" />
          </div>
          <div className="flex justify-between px-4 pb-3">
            {WEEKLY_REV.map(d => <span key={d.day} className="text-[9px] text-[var(--text-muted)]">{d.day}</span>)}
          </div>
        </div>

        <Panel title="OS por Status" sub="Distribuição atual" className="col-span-2">
          <DonutChart slices={statusSlices} label="TOTAL OS" />
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel title="Top Clientes" sub="Receita no período">
          {topClients.length === 0
            ? <Empty text="Sem receitas no período" />
            : <div className="space-y-3">{topClients.map(r => <HBar key={r.label} label={r.label} value={r.value} max={maxCli} color="#22C55E" fmt={formatCurrency} />)}</div>}
        </Panel>

        <Panel title="OS por Tipo">
          <div className="space-y-3">
            {typeItems.map(r => <HBar key={r.label} label={r.label} value={r.value} max={maxType} color="#60A5FA" />)}
          </div>
        </Panel>

        <Panel title="OS Recentes">
          <div className="space-y-2">
            {recentOS.map(os => (
              <div key={os.id} className="flex items-center gap-2.5 py-1.5 border-b border-[var(--border)] last:border-0">
                <div className="w-6 h-6 rounded bg-[var(--surface-muted)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold text-[var(--text-muted)]">{os.mechanic.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{os.customerName}</p>
                  <p className="text-[9px] text-[var(--text-muted)] font-mono">{os.plate}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(os.estimatedValue)}</p>
                  <span className="text-[8px] font-semibold px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${STATUS_COLOR[os.status]}20`, color: STATUS_COLOR[os.status] }}>
                    {STATUS_LABEL[os.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ── Section: Financeiro ───────────────────────────────────────────────────────

function FinanceiroSection({ from, to }: { from: Date; to: Date }) {
  const rec      = mockFinance.filter(f => f.type === 'RECEBER' && f.status === 'PAGA' && inRange(f.paidDate, from, to))
  const exp      = mockFinance.filter(f => f.type === 'PAGAR'   && f.status === 'PAGA' && inRange(f.paidDate, from, to))
  const aRec     = mockFinance.filter(f => f.type === 'RECEBER' && f.status === 'ABERTA')
  const aPag     = mockFinance.filter(f => f.type === 'PAGAR'   && f.status === 'ABERTA')
  const venc     = mockFinance.filter(f => f.status === 'VENCIDA')
  const totalRec = rec.reduce((s, f) => s + (f.paidValue ?? f.value), 0)
  const totalExp = exp.reduce((s, f) => s + (f.paidValue ?? f.value), 0)
  const totalARec = aRec.reduce((s, f) => s + f.value, 0)
  const totalAPag = aPag.reduce((s, f) => s + f.value, 0)
  const margem   = totalRec > 0 ? ((totalRec - totalExp) / totalRec) * 100 : 0
  const saldo    = totalARec - totalAPag

  const payMap: Record<string, number> = {}
  for (const f of rec) {
    const m = f.paymentMethod ?? 'Não informado'
    payMap[m] = (payMap[m] ?? 0) + (f.paidValue ?? f.value)
  }
  const byPay  = Object.entries(payMap).map(([l, v]) => ({ label: PAY_LABEL[l] ?? l, value: v })).sort((a, b) => b.value - a.value)
  const maxPay = byPay[0]?.value ?? 1

  const MONTHS  = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  const recData = MONTHS.map((m, i) => ({ day: m, value: [800, 1200, 1500, 900, 2100, totalRec || 1800][i] }))
  const expNums = [600, 900, 1100, 700, 1400, totalExp || 1200]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-3">
        <Kpi label="Receita recebida" value={formatCurrency(totalRec)} color="#22C55E" trend="up" sub="no período" icon={<TrendingUp size={11} />} />
        <Kpi label="Despesas pagas"   value={formatCurrency(totalExp)} color="#EF4444"             sub="no período" icon={<TrendingDown size={11} />} />
        <Kpi label="Margem líquida"   value={`${margem.toFixed(0)}%`}
          color={margem > 30 ? '#22C55E' : '#F97316'}
          trend={margem > 30 ? 'up' : 'neutral'} sub={margem > 30 ? 'Saudável' : 'Atenção'} />
        <Kpi label="A receber"  value={formatCurrency(totalARec)} color="#60A5FA" sub={`${aRec.length} lançamentos`} />
        <Kpi label="A pagar"    value={formatCurrency(totalAPag)} color="#F97316" sub={`${aPag.length} lançamentos`} />
        <Kpi label="Saldo previsto" value={formatCurrency(saldo)}
          color={saldo >= 0 ? '#22C55E' : '#EF4444'}
          trend={saldo >= 0 ? 'up' : 'down'} sub="A receber − A pagar" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-[12px] font-bold text-[var(--text-primary)]">Receita vs Despesas</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Evolução mensal (estimativa)</p>
          </div>
          <div className="px-4 pt-3 pb-1 h-[150px]">
            <LineChart data={recData} prev={expNums} color="#22C55E" />
          </div>
          <div className="flex justify-between px-4 pb-1">
            {MONTHS.map(m => <span key={m} className="text-[9px] text-[var(--text-muted)]">{m}</span>)}
          </div>
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)]">
            <span className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)]">
              <span className="w-3 h-[2px] rounded inline-block bg-[#22C55E]" /> Receita
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)] opacity-60">
              <span className="w-3 h-[1px] rounded inline-block bg-current" style={{ borderTop: '1px dashed' }} /> Despesas
            </span>
          </div>
        </div>

        <Panel title="Forma de pagamento" sub="Receitas recebidas" className="col-span-2">
          {byPay.length === 0
            ? <Empty text="Sem pagamentos no período" />
            : <div className="space-y-3">{byPay.map(r => <HBar key={r.label} label={r.label} value={r.value} max={maxPay} color="#22C55E" fmt={formatCurrency} />)}</div>}
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Contas a Receber" sub={`${aRec.length} em aberto · ${formatCurrency(totalARec)}`}>
          {aRec.length === 0
            ? <Empty text="Nenhuma conta a receber" />
            : (
              <div className="space-y-1">
                {aRec.slice(0, 7).map(f => (
                  <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{f.entity}</p>
                      <p className="text-[9px] text-[var(--text-muted)] truncate">{f.description}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(f.value)}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">venc. {f.dueDate}</p>
                    </div>
                  </div>
                ))}
                {aRec.length > 7 && <p className="text-[10px] text-[var(--text-muted)] text-center pt-2">+{aRec.length - 7} contas</p>}
              </div>
            )}
        </Panel>

        <Panel title="Vencidas & A Pagar" sub={`${venc.length + aPag.length} pendentes`}>
          {(venc.length + aPag.length) === 0
            ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                <p className="text-[11px] text-[var(--text-muted)]">Tudo em dia</p>
              </div>
            )
            : (
              <div className="space-y-1">
                {[...venc, ...aPag].slice(0, 7).map(f => (
                  <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{f.entity}</p>
                      <span className="text-[9px] font-semibold px-1 py-0.5 rounded"
                        style={f.status === 'VENCIDA'
                          ? { color: 'var(--danger)', backgroundColor: 'var(--danger-subtle)' }
                          : { color: 'var(--text-muted)', backgroundColor: 'var(--surface-muted)' }}>
                        {f.status === 'VENCIDA' ? 'Vencida' : 'A pagar'}
                      </span>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-[11px] font-bold tabular-nums"
                        style={{ color: f.status === 'VENCIDA' ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {formatCurrency(f.value)}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)]">venc. {f.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </Panel>
      </div>
    </div>
  )
}

// ── Section: Serviços ─────────────────────────────────────────────────────────

function ServicosSection({ from, to }: { from: Date; to: Date }) {
  const all      = mockServiceOrders
  const period   = all.filter(o => inRange(o.entryDate, from, to))
  const active   = all.filter(o => ['EM_ANALISE', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO'].includes(o.status))
  const done     = all.filter(o => ['CONCLUIDO', 'ENTREGUE'].includes(o.status))
  const canceled = all.filter(o => o.status === 'CANCELADO')
  const awaiting = all.filter(o => o.status === 'AGUARDANDO_APROVACAO')

  const statusMap: Record<string, number> = {}
  for (const o of all) statusMap[o.status] = (statusMap[o.status] ?? 0) + 1
  const statusSlices = Object.entries(statusMap)
    .map(([k, v]) => ({ label: STATUS_LABEL[k] ?? k, value: v, color: STATUS_COLOR[k] ?? '#9CA3AF' }))
    .sort((a, b) => b.value - a.value)

  const typeMap: Record<string, number> = {}
  for (const o of all) typeMap[o.type] = (typeMap[o.type] ?? 0) + 1
  const typeItems = Object.entries(typeMap).map(([k, v]) => ({ label: TYPE_LABEL[k] ?? k, value: v })).sort((a, b) => b.value - a.value)
  const maxType  = typeItems[0]?.value ?? 1

  const mechMap: Record<string, { count: number; value: number }> = {}
  for (const o of all) {
    const n = o.mechanic.name
    if (!mechMap[n]) mechMap[n] = { count: 0, value: 0 }
    mechMap[n].count++
    mechMap[n].value += o.estimatedValue
  }
  const byMech  = Object.entries(mechMap).map(([l, v]) => ({ label: l, ...v })).sort((a, b) => b.count - a.count)
  const maxMech = byMech[0]?.count ?? 1

  const recentOS = [...all].sort((a, b) => b.entryDate.localeCompare(a.entryDate)).slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <Kpi label="OS no período" value={String(period.length)} color="#60A5FA"
          sub={`de ${all.length} total`} icon={<ClipboardList size={11} />} />
        <Kpi label="Em andamento" value={String(active.length)} color="#A78BFA"
          icon={<Clock size={11} />} />
        <Kpi label="Concluídas" value={String(done.length)} color="#22C55E" trend="up"
          sub={`${pct(done.length, all.length)}% do total`} icon={<CheckCircle2 size={11} />} />
        <Kpi label="Ag. aprovação" value={String(awaiting.length)}
          color={awaiting.length > 0 ? '#F97316' : '#22C55E'}
          trend={awaiting.length > 0 ? 'down' : 'neutral'}
          sub={awaiting.length > 0 ? 'Requer atenção' : 'Nenhuma'} icon={<AlertTriangle size={11} />} />
        <Kpi label="Canceladas" value={String(canceled.length)} color="#EF4444"
          sub={`${pct(canceled.length, all.length)}% do total`} icon={<TrendingDown size={11} />} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Panel title="Por Status" className="col-span-2">
          <DonutChart slices={statusSlices} label="TOTAL" />
        </Panel>
        <Panel title="Por Tipo de Serviço" className="col-span-3">
          <div className="space-y-3">
            {typeItems.map(r => <HBar key={r.label} label={r.label} value={r.value} max={maxType} color="#60A5FA" />)}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Por Mecânico" sub="OS atribuídas · receita estimada">
          <div className="space-y-2.5">
            {byMech.map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-[11px] text-[var(--text-secondary)] w-24 flex-shrink-0 truncate">{r.label.split(' ')[0]}</span>
                <div className="flex-1 bg-[var(--surface-muted)] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#A78BFA]"
                    style={{ width: `${maxMech > 0 ? (r.count / maxMech) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-[var(--text-primary)] tabular-nums w-5">{r.count}</span>
                <span className="text-[10px] text-[var(--text-muted)] tabular-nums w-20 text-right">{formatCurrency(r.value)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="OS Recentes" sub="Ordenadas por data de entrada">
          <div className="space-y-1.5">
            {recentOS.map(os => (
              <div key={os.id} className="flex items-center gap-2 py-1 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{os.customerName}</p>
                    <span className="text-[8px] font-mono text-[var(--text-muted)] flex-shrink-0">{os.plate}</span>
                  </div>
                  <p className="text-[9px] text-[var(--text-muted)]">{os.mechanic.name.split(' ')[0]} · {os.entryDate}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(os.estimatedValue)}</p>
                  <span className="text-[8px] font-semibold px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${STATUS_COLOR[os.status]}20`, color: STATUS_COLOR[os.status] }}>
                    {STATUS_LABEL[os.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ── Section: Clientes ─────────────────────────────────────────────────────────

function ClientesSection({ from, to }: { from: Date; to: Date }) {
  const all    = mockCustomers
  const ativos = all.filter(c => c.status === 'ATIVO')
  const novos  = all.filter(c => inRange(c.lastServiceDate, from, to))
  const pf     = all.filter(c => c.type === 'PF').length
  const pj     = all.filter(c => c.type === 'PJ').length

  const recMap = new Map<string, number>()
  for (const f of mockFinance.filter(f => f.type === 'RECEBER' && f.status === 'PAGA'))
    recMap.set(f.entity, (recMap.get(f.entity) ?? 0) + (f.paidValue ?? f.value))
  const byRev  = [...recMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  const maxRev = byRev[0]?.value ?? 1

  const typeSlices = [
    { label: 'Pessoa Física',   value: pf, color: '#60A5FA' },
    { label: 'Pessoa Jurídica', value: pj, color: '#F97316' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Total de clientes"   value={String(all.length)}    color="#60A5FA" icon={<Users size={11} />} />
        <Kpi label="Clientes ativos"     value={String(ativos.length)} color="#22C55E"
          sub={`${pct(ativos.length, all.length)}% do total`} icon={<CheckCircle2 size={11} />} />
        <Kpi label="Com serviço recente" value={String(novos.length)}  color="#A78BFA" sub="no período selecionado" />
        <Kpi label="Empresas (PJ)"       value={String(pj)}            color="#F97316" sub={`${pf} pessoas físicas`} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Panel title="Receita por Cliente" sub="Top clientes — total recebido" className="col-span-3">
          {byRev.length === 0
            ? <Empty text="Sem dados de receita" />
            : <div className="space-y-3">{byRev.map(r => <HBar key={r.label} label={r.label} value={r.value} max={maxRev} color="#22C55E" fmt={formatCurrency} />)}</div>}
        </Panel>

        <Panel title="Tipo de cliente" sub="PF vs PJ" className="col-span-2">
          <DonutChart slices={typeSlices} label="TOTAL" />
        </Panel>
      </div>

      <Panel title="Todos os Clientes" sub={`${all.length} cadastrados`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Nome', 'Tipo', 'Cidade', 'Veículos', 'OS abertas', 'Último atendimento', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map(c => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-2 pr-4 font-semibold text-[var(--text-primary)] max-w-[160px] truncate">{c.name}</td>
                  <td className="py-2 pr-4">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={c.type === 'PJ'
                        ? { color: '#F97316', backgroundColor: '#F9741620' }
                        : { color: '#60A5FA', backgroundColor: '#60A5FA20' }}>
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[var(--text-secondary)]">{c.city ?? '—'}</td>
                  <td className="py-2 pr-4 tabular-nums text-center">{c.vehiclesCount ?? 0}</td>
                  <td className="py-2 pr-4 tabular-nums text-center">{c.openOrdersCount ?? 0}</td>
                  <td className="py-2 pr-4 text-[var(--text-muted)]">{c.lastServiceDate ?? '—'}</td>
                  <td className="py-2 pr-4">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={c.status === 'ATIVO'
                        ? { color: 'var(--success)', backgroundColor: 'var(--success-subtle)' }
                        : { color: 'var(--text-muted)', backgroundColor: 'var(--surface-muted)' }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

// ── Section: Estoque ──────────────────────────────────────────────────────────

function EstoqueSection() {
  const parts    = mockParts
  const baixo    = parts.filter(p => p.status === 'BAIXO').length
  const semEst   = parts.filter(p => p.status === 'SEM_ESTOQUE').length
  const stockVal = parts.reduce((s, p) => s + p.currentStock * (p.averageCost ?? 0), 0)
  const alertas  = parts.filter(p => ['BAIXO', 'SEM_ESTOQUE'].includes(p.status)).sort((a, b) => a.currentStock - b.currentStock)

  const suppMap = new Map<string, number>()
  for (const p of mockPurchases.filter(p => p.status === 'RECEBIDA'))
    suppMap.set(p.supplierName, (suppMap.get(p.supplierName) ?? 0) + p.totalValue)
  const bySupp  = [...suppMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  const maxSupp = bySupp[0]?.value ?? 1

  const partUsage = new Map<string, { name: string; count: number }>()
  for (const os of mockServiceOrders) {
    for (const part of os.parts ?? []) {
      const p = parts.find(x => x.id === part.partId)
      if (!p) continue
      const cur = partUsage.get(part.partId) ?? { name: p.description, count: 0 }
      partUsage.set(part.partId, { name: cur.name, count: cur.count + (part.quantity ?? 1) })
    }
  }
  const topUsed = [...partUsage.values()].sort((a, b) => b.count - a.count).slice(0, 6)
  const maxUsed = topUsed[0]?.count ?? 1

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Valor total estoque"  value={formatCurrency(stockVal)}  color="#6366F1" icon={<DollarSign size={11} />} />
        <Kpi label="Peças cadastradas"    value={String(parts.length)}      color="#60A5FA" icon={<Package size={11} />} />
        <Kpi label="Abaixo do mínimo"     value={String(baixo)}
          color={baixo > 0 ? '#F59E0B' : '#22C55E'} trend={baixo > 0 ? 'down' : 'neutral'}
          sub={baixo > 0 ? 'Atenção' : 'OK'} icon={<AlertTriangle size={11} />} />
        <Kpi label="Sem estoque"          value={String(semEst)}
          color={semEst > 0 ? '#EF4444' : '#22C55E'} trend={semEst > 0 ? 'down' : 'neutral'}
          sub={semEst > 0 ? 'Crítico' : 'Nenhum item'} icon={<AlertTriangle size={11} />} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Alertas de Estoque" sub={`${alertas.length} itens com atenção`}>
          {alertas.length === 0
            ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                <p className="text-[11px] text-[var(--text-muted)]">Estoque normalizado</p>
              </div>
            )
            : (
              <div className="space-y-1.5">
                {alertas.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{p.description}</p>
                      <p className="text-[9px] font-mono text-[var(--text-muted)]">{p.internalCode}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-[13px] font-extrabold tabular-nums"
                        style={{ color: p.status === 'SEM_ESTOQUE' ? 'var(--danger)' : 'var(--warning)' }}>
                        {p.currentStock}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)]">mín. {p.minimumStock}</p>
                    </div>
                    <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={p.status === 'SEM_ESTOQUE'
                        ? { color: 'var(--danger)',  backgroundColor: 'var(--danger-subtle)'  }
                        : { color: 'var(--warning)', backgroundColor: 'var(--warning-subtle)' }}>
                      {p.status === 'SEM_ESTOQUE' ? 'Sem estoque' : 'Baixo'}
                    </span>
                  </div>
                ))}
                {alertas.length > 8 && <p className="text-[10px] text-[var(--text-muted)] text-center pt-2">+{alertas.length - 8} itens</p>}
              </div>
            )}
        </Panel>

        <Panel title="Compras por Fornecedor" sub="Pedidos recebidos">
          {bySupp.length === 0
            ? <Empty text="Nenhuma compra recebida" />
            : <div className="space-y-3">{bySupp.map(r => <HBar key={r.label} label={r.label} value={r.value} max={maxSupp} color="#6366F1" fmt={formatCurrency} />)}</div>}
        </Panel>
      </div>

      <Panel title="Peças mais usadas em OS" sub="Por quantidade utilizada nas ordens de serviço">
        {topUsed.length === 0
          ? <Empty text="Nenhuma peça registrada em OS" />
          : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {topUsed.map(r => <HBar key={r.name} label={r.name} value={r.count} max={maxUsed} color="#60A5FA" />)}
            </div>
          )}
      </Panel>
    </div>
  )
}

// ── Section: Agenda ───────────────────────────────────────────────────────────

function AgendaSection({ from, to }: { from: Date; to: Date }) {
  const all       = mockSchedule
  const period    = all.filter(a => inRange(a.date, from, to))
  const confirmed = period.filter(a => (a.status as string) === 'CONFIRMADO')
  const canceled  = period.filter(a => (a.status as string) === 'CANCELADO')
  const done      = period.filter(a => (a.status as string) === 'REALIZADO')
  const upcoming  = [...all].filter(a => a.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 10)

  const typeMap: Record<string, number> = {}
  for (const a of all) typeMap[a.type as string] = (typeMap[a.type as string] ?? 0) + 1
  const typeSlices = Object.entries(typeMap)
    .map(([k, v]) => ({ label: APT_LABEL[k] ?? k, value: v, color: APT_COLOR[k] ?? '#9CA3AF' }))
    .sort((a, b) => b.value - a.value)

  const mechAptMap: Record<string, number> = {}
  for (const a of all) {
    const m = (a.mechanicName as string | undefined) ?? 'Não atribuído'
    mechAptMap[m] = (mechAptMap[m] ?? 0) + 1
  }
  const byMechApt  = Object.entries(mechAptMap).map(([label, value]) => ({ label: label.split(' ')[0], value })).sort((a, b) => b.value - a.value)
  const maxMechApt = byMechApt[0]?.value ?? 1

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Agendamentos" value={String(period.length)} color="#60A5FA"
          sub="no período" icon={<Calendar size={11} />} />
        <Kpi label="Confirmados" value={String(confirmed.length)} color="#22C55E" trend="up"
          sub={`${pct(confirmed.length, period.length)}% de confirmação`} icon={<CheckCircle2 size={11} />} />
        <Kpi label="Realizados" value={String(done.length)} color="#A78BFA"
          sub="atendimentos concluídos" icon={<CheckCircle2 size={11} />} />
        <Kpi label="Cancelamentos" value={String(canceled.length)}
          color={canceled.length > 2 ? '#EF4444' : '#9CA3AF'}
          trend={canceled.length > 2 ? 'down' : 'neutral'}
          sub={`${pct(canceled.length, period.length)}% do período`} icon={<AlertTriangle size={11} />} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Panel title="Por Tipo" className="col-span-2">
          <DonutChart slices={typeSlices} label="TOTAL" />
        </Panel>
        <Panel title="Por Mecânico" sub="Agendamentos atribuídos" className="col-span-3">
          <div className="space-y-3">
            {byMechApt.map(r => <HBar key={r.label} label={r.label} value={r.value} max={maxMechApt} color="#60A5FA" />)}
          </div>
        </Panel>
      </div>

      <Panel title="Próximos Agendamentos" sub={`A partir de hoje · ${upcoming.length} encontrados`}>
        {upcoming.length === 0
          ? <Empty text="Nenhum agendamento futuro" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Data', 'Hora', 'Cliente', 'Veículo', 'Tipo', 'Mecânico', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(a => {
                    const sc = APT_STATUS_CFG[a.status as string] ?? { label: String(a.status), color: '#9CA3AF' }
                    const tc = APT_COLOR[a.type as string] ?? '#9CA3AF'
                    return (
                      <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-2 pr-4 text-[var(--text-muted)]">{a.date}</td>
                        <td className="py-2 pr-4 font-mono font-semibold text-[var(--text-primary)]">{a.time}</td>
                        <td className="py-2 pr-4 font-semibold text-[var(--text-primary)] max-w-[130px] truncate">{a.customerName}</td>
                        <td className="py-2 pr-4 text-[var(--text-secondary)] max-w-[120px] truncate">{a.vehicle}</td>
                        <td className="py-2 pr-4">
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: tc, backgroundColor: tc + '20' }}>
                            {APT_LABEL[a.type as string] ?? String(a.type)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-[var(--text-secondary)]">
                          {(a.mechanicName as string | undefined)?.split(' ')[0] ?? '—'}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: sc.color, backgroundColor: sc.color + '20' }}>
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      </Panel>
    </div>
  )
}

// ── Section: Equipe ───────────────────────────────────────────────────────────

function EquipeSection() {
  const mechs = mockMechanics

  const stats = mechs.map(m => {
    const osAll    = mockServiceOrders.filter(o => o.mechanic.name === m.name)
    const osActive = osAll.filter(o => ['EM_ANALISE', 'EM_ANDAMENTO'].includes(o.status))
    const osDone   = osAll.filter(o => ['CONCLUIDO', 'ENTREGUE'].includes(o.status))
    const revenue  = osAll.reduce((s, o) => s + (o.finalValue ?? o.estimatedValue), 0)
    const ticket   = osAll.length > 0 ? revenue / osAll.length : 0
    const apts     = mockSchedule.filter(a => (a.mechanicName ?? '').includes(m.name.split(' ')[0])).length
    return { ...m, osTotal: osAll.length, osActive: osActive.length, osDone: osDone.length, revenue, ticket, apts }
  }).sort((a, b) => b.revenue - a.revenue)

  const totalOS  = stats.reduce((s, m) => s + m.osTotal, 0)
  const totalRev = stats.reduce((s, m) => s + m.revenue, 0)
  const avgTick  = totalOS > 0 ? totalRev / totalOS : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Mecânicos ativos"  value={String(mechs.length)}     color="#A78BFA" icon={<Wrench       size={11} />} />
        <Kpi label="OS totais"         value={String(totalOS)}          color="#60A5FA" icon={<ClipboardList size={11} />} />
        <Kpi label="Receita da equipe" value={formatCurrency(totalRev)} color="#22C55E" icon={<DollarSign   size={11} />} />
      </div>

      <Panel title="Desempenho por Mecânico" sub="Todas as OS atribuídas">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Mecânico', 'Especialidade', 'OS Total', 'Em andamento', 'Concluídas', 'Receita', 'Ticket médio', 'Agendamentos'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(m => (
                <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-extrabold text-[var(--text-secondary)]">{m.initials}</span>
                      </div>
                      <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[var(--text-muted)]">{m.specialty ?? '—'}</td>
                  <td className="py-3 pr-4 font-bold tabular-nums text-center">{m.osTotal}</td>
                  <td className="py-3 pr-4 tabular-nums text-center">
                    {m.osActive > 0
                      ? <span className="font-semibold" style={{ color: '#A78BFA' }}>{m.osActive}</span>
                      : <span className="text-[var(--text-disabled)]">0</span>}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-center">
                    <span className="font-semibold" style={{ color: '#22C55E' }}>{m.osDone}</span>
                  </td>
                  <td className="py-3 pr-4 font-bold tabular-nums" style={{ color: 'var(--success)' }}>{formatCurrency(m.revenue)}</td>
                  <td className="py-3 pr-4 tabular-nums text-[var(--text-secondary)]">{formatCurrency(m.ticket)}</td>
                  <td className="py-3 pr-4 tabular-nums text-center text-[var(--text-secondary)]">{m.apts}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[var(--border-strong)]">
              <tr>
                <td colSpan={2} className="pt-3 pr-4 font-bold text-[var(--text-primary)]">Total / Média</td>
                <td className="pt-3 pr-4 font-extrabold tabular-nums text-center">{totalOS}</td>
                <td className="pt-3 pr-4 text-center text-[var(--text-disabled)]">—</td>
                <td className="pt-3 pr-4 text-center text-[var(--text-disabled)]">—</td>
                <td className="pt-3 pr-4 font-extrabold tabular-nums" style={{ color: 'var(--success)' }}>{formatCurrency(totalRev)}</td>
                <td className="pt-3 pr-4 tabular-nums text-[var(--text-secondary)]">{formatCurrency(avgTick)}</td>
                <td className="pt-3 pr-4 text-center text-[var(--text-disabled)]">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Receita por mecânico" sub="Estimativa total de OS">
          <div className="space-y-3">
            {stats.map(m => <HBar key={m.id} label={m.name.split(' ')[0]} value={m.revenue} max={stats[0]?.revenue ?? 1} color="#A78BFA" fmt={formatCurrency} />)}
          </div>
        </Panel>
        <Panel title="OS por mecânico" sub="Quantidade total de ordens">
          <div className="space-y-3">
            {stats.map(m => <HBar key={m.id} label={m.name.split(' ')[0]} value={m.osTotal} max={stats[0]?.osTotal ?? 1} color="#60A5FA" />)}
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [period,  setPeriod]  = useState<Period>('30d')
  const [section, setSection] = useState<Section>('geral')
  const [cStart,  setCStart]  = useState('')
  const [cEnd,    setCEnd]    = useState('')

  const [from, to] = useMemo(() => periodBounds(period, cStart, cEnd), [period, cStart, cEnd])

  const periodLabel = period === 'custom'
    ? cStart && cEnd ? `${cStart} → ${cEnd}` : 'Selecione o período'
    : PERIOD_OPTS.find(p => p.key === period)?.label ?? ''

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start justify-between gap-4 pb-3">
          <div>
            <h1 className="text-[16px] font-extrabold text-[var(--text-primary)] tracking-tight">Relatórios</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Gestão e análise completa da oficina · <span className="text-[var(--brand)] font-medium">{periodLabel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg p-[3px] gap-[2px]">
              {PERIOD_OPTS.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  className={cn(
                    'h-6 px-2.5 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap',
                    period === p.key
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}>
                  {p.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] text-[10px] font-semibold hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors">
              <Download size={11} />
              Exportar
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 pb-3">
            <span className="text-[10px] text-[var(--text-muted)]">De</span>
            <input type="date" value={cStart} onChange={e => setCStart(e.target.value)}
              className="h-7 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all" />
            <span className="text-[10px] text-[var(--text-muted)]">até</span>
            <input type="date" value={cEnd} onChange={e => setCEnd(e.target.value)}
              className="h-7 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all" />
            {cStart && cEnd && (
              <span className="text-[10px] text-[var(--text-muted)]">
                ({Math.max(0, Math.ceil((new Date(cEnd).getTime() - new Date(cStart).getTime()) / 86_400_000))} dias)
              </span>
            )}
          </div>
        )}

        <div className="flex items-center" role="tablist">
          {SECTIONS.map(s => (
            <button key={s.key} role="tab" aria-selected={section === s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                'relative flex items-center gap-1.5 h-9 px-3.5 text-[11px] font-semibold transition-colors duration-[140ms] whitespace-nowrap border-b-2',
                section === s.key
                  ? 'text-[var(--brand)] border-[var(--brand)]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]',
              )}>
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {section === 'geral' && (
          <>
            <GeralSection from={from} to={to} />
            <ModuleCTA to="/inicio" label="Voltar ao início" sub="Veja o resumo operacional do dia" />
          </>
        )}
        {section === 'financeiro' && (
          <>
            <FinanceiroSection from={from} to={to} />
            <ModuleCTA to="/financeiro" label="Ir para Financeiro" sub="Registre pagamentos, cobranças e novas entradas" />
          </>
        )}
        {section === 'servicos' && (
          <>
            <ServicosSection from={from} to={to} />
            <ModuleCTA to="/servicos" label="Ir para Serviços" sub="Gerencie ordens de serviço em andamento" />
          </>
        )}
        {section === 'clientes' && (
          <>
            <ClientesSection from={from} to={to} />
            <ModuleCTA to="/cadastros" label="Ir para Cadastros" sub="Visualize clientes, veículos e histórico" />
          </>
        )}
        {section === 'estoque' && (
          <>
            <EstoqueSection />
            <ModuleCTA to="/estoque" label="Ir para Estoque" sub="Gerencie peças, compras e fornecedores" />
          </>
        )}
        {section === 'agenda' && (
          <>
            <AgendaSection from={from} to={to} />
            <ModuleCTA to="/agenda" label="Ir para Agenda" sub="Confirme agendamentos e crie novas OS" />
          </>
        )}
        {section === 'equipe' && (
          <>
            <EquipeSection />
            <ModuleCTA to="/equipe" label="Ir para Equipe" sub="Gerencie usuários, cargos e permissões" />
          </>
        )}
      </div>
    </div>
  )
}
