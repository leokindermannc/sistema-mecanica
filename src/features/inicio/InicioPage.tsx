import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Clock, Wallet, ArrowRight, AlertTriangle, Car,
  CheckCircle2, TrendingUp, TrendingDown, Minus, Package,
  CalendarDays, Plus, Wrench, Users, BarChart3, ChevronRight,
} from 'lucide-react'
import { mockServiceOrders } from '../../mocks/service-orders'
import { mockFinance }        from '../../mocks/finance'
import { mockParts }          from '../../mocks/parts'
import { mockVehicles }       from '../../mocks/vehicles'
import { mockSchedule }       from '../../mocks/schedule'
import { mockMechanics }      from '../../mocks/mechanics'
import { cn, formatCurrency } from '../../lib/utils'

const TODAY = '2026-06-10'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function hoursAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000)
}

// ── Workflow banner ────────────────────────────────────────────────────────────

function WorkflowBanner({ inPatio, agendaHoje, osAbertas, aReceber, alerts }: {
  inPatio: number; agendaHoje: number; osAbertas: number; aReceber: number
  alerts: { os: boolean; fin: boolean }
}) {
  const steps = [
    {
      num: 1, icon: <Car size={16} />, label: 'Pátio',
      sub: 'Entrada de veículos', metric: `${inPatio} em serviço`,
      to: '/patio', color: '#1A4E8C', alert: false,
    },
    {
      num: 2, icon: <CalendarDays size={16} />, label: 'Agenda',
      sub: 'Agendamentos', metric: `${agendaHoje} hoje`,
      to: '/agenda', color: '#7C3AED', alert: false,
    },
    {
      num: 3, icon: <Wrench size={16} />, label: 'Serviços',
      sub: 'Ordens de serviço', metric: `${osAbertas} abertas`,
      to: '/servicos', color: 'var(--brand)', alert: alerts.os,
    },
    {
      num: 4, icon: <Wallet size={16} />, label: 'Financeiro',
      sub: 'Recebimentos', metric: formatCurrency(aReceber),
      to: '/financeiro', color: 'var(--success)', alert: alerts.fin,
    },
  ]

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-muted)] border-b border-[var(--border)]">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black" style={{ backgroundColor: 'var(--brand)', color: 'white' }}>{n}</div>
              {n < 4 && <ChevronRight size={10} className="text-[var(--text-disabled)]" />}
            </div>
          ))}
        </div>
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Fluxo da operação</span>
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">como o sistema funciona</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--border)]">
        {steps.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            className="group flex flex-col gap-2 p-4 hover:bg-[var(--surface-hover)] transition-colors relative"
          >
            {s.alert && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" />
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: s.color + '18', color: s.color }}>
                {s.icon}
              </div>
              <div>
                <p className="text-[13px] font-bold text-[var(--text-primary)] leading-none">{s.label}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.sub}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[13px] font-extrabold tabular-nums" style={{ color: s.color }}>{s.metric}</span>
              <ArrowRight size={12} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Próximas ações ─────────────────────────────────────────────────────────────

type ActionItem = {
  icon: React.ReactNode
  label: string
  sub: string
  to: string
  cta: string
  level: 'danger' | 'warning' | 'info'
}

function ProximasAcoes({ actions }: { actions: ActionItem[] }) {
  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--success-subtle)]">
          <CheckCircle2 size={15} className="text-[var(--success)]" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Tudo em ordem por aqui</p>
          <p className="text-[11px] text-[var(--text-muted)]">Nenhuma ação urgente pendente no momento</p>
        </div>
      </div>
    )
  }

  const levelColor = { danger: 'var(--danger)', warning: 'var(--warning)', info: '#2563EB' } as const
  const levelBg    = { danger: 'var(--danger-subtle)', warning: 'var(--warning-subtle)', info: 'rgba(37,99,235,0.08)' } as const

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-muted)] border-b border-[var(--border)]">
        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Próximas ações</p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--warning-subtle)', color: 'var(--warning)' }}>
          {actions.length} {actions.length === 1 ? 'pendência' : 'pendências'}
        </span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {actions.map((a, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: levelBg[a.level], color: levelColor[a.level] }}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{a.label}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{a.sub}</p>
            </div>
            <Link to={a.to}
              className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded transition-colors"
              style={{ backgroundColor: levelBg[a.level], color: levelColor[a.level] }}>
              {a.cta} <ArrowRight size={10} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, accent, trend, trendVal, to }: {
  label: string; value: string | number; icon: React.ReactNode
  accent: string; trend?: 'up' | 'down' | 'flat'; trendVal?: string; to: string
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-3 p-4 rounded-lg border bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] transition-all duration-[160ms] hover:shadow-sm"
    >
      <span className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-lg" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between mt-1">
        <span className="text-[11px] font-medium text-[var(--text-muted)] leading-none">{label}</span>
        <span className="p-1.5 rounded" style={{ backgroundColor: accent + '18', color: accent }}>{icon}</span>
      </div>
      <div>
        <span className="text-[24px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{value}</span>
        {trend && trendVal && (
          <p className="flex items-center gap-0.5 mt-1 text-[11px] text-[var(--text-muted)]">
            <TrendIcon size={11} className={trend === 'up' ? 'text-[var(--success)]' : trend === 'down' ? 'text-[var(--danger)]' : ''} />
            {trendVal}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Sidebar section wrapper ───────────────────────────────────────────────────

function SideCard({ title, link, linkLabel, children }: {
  title: string; link?: string; linkLabel?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{title}</p>
        {link && linkLabel && (
          <Link to={link} className="text-[11px] font-medium hover:underline flex items-center gap-0.5" style={{ color: 'var(--brand)' }}>
            {linkLabel} <ArrowRight size={10} />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function InicioPage() {
  const today = capitalize(
    new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  )

  const kpi = useMemo(() => {
    const open           = mockServiceOrders.filter(os => !['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status))
    const inPatio        = mockVehicles.filter(v => v.status === 'EM_MANUTENCAO').length
    const awaitApproval  = mockServiceOrders.filter(os => os.status === 'AGUARDANDO_APROVACAO').length
    const todayReceivable = mockFinance
      .filter(f => f.type === 'RECEBER' && f.dueDate === TODAY)
      .reduce((sum, f) => sum + f.value, 0)
    const lowStock = mockParts.filter(p => p.currentStock <= p.minimumStock).length
    return { open: open.length, inPatio, awaitApproval, todayReceivable, lowStock }
  }, [])

  const finSummary = useMemo(() => {
    const aReceber = mockFinance.filter(f => f.type === 'RECEBER' && f.status === 'ABERTA').reduce((s, f) => s + f.value, 0)
    const aPagar   = mockFinance.filter(f => f.type === 'PAGAR'   && f.status === 'ABERTA').reduce((s, f) => s + f.value, 0)
    const vencidas = mockFinance.filter(f => f.status === 'VENCIDA').length
    return { aReceber, aPagar, saldo: aReceber - aPagar, vencidas }
  }, [])

  const todayScheduleAll = useMemo(() =>
    mockSchedule.filter(a => a.date === TODAY),
  [])

  const todaySchedule = todayScheduleAll.slice(0, 4)

  const actions = useMemo<ActionItem[]>(() => {
    const result: ActionItem[] = []

    const awaitApproval = mockServiceOrders.filter(os => os.status === 'AGUARDANDO_APROVACAO').length
    if (awaitApproval > 0)
      result.push({
        icon: <AlertTriangle size={13} />, level: 'warning',
        label: `${awaitApproval} orçamento${awaitApproval > 1 ? 's' : ''} aguardando aprovação`,
        sub: 'O cliente precisa confirmar antes de iniciar o serviço',
        to: '/servicos', cta: 'Revisar',
      })

    const stalledOS = mockServiceOrders.filter(
      os => os.status === 'EM_ANDAMENTO' && hoursAgo(os.entryDate + 'T08:00:00') > 48,
    ).length
    if (stalledOS > 0)
      result.push({
        icon: <Clock size={13} />, level: 'danger',
        label: `${stalledOS} OS parada${stalledOS > 1 ? 's' : ''} há mais de 48h`,
        sub: 'Serviços em andamento sem atualização recente',
        to: '/servicos', cta: 'Verificar',
      })

    const todayUnconfirmed = mockSchedule.filter(
      a => a.date === TODAY && a.status === 'AGENDADO',
    ).length
    if (todayUnconfirmed > 0)
      result.push({
        icon: <CalendarDays size={13} />, level: 'info',
        label: `${todayUnconfirmed} agendamento${todayUnconfirmed > 1 ? 's' : ''} não confirmado${todayUnconfirmed > 1 ? 's' : ''} hoje`,
        sub: 'Confirme com o cliente antes do horário',
        to: '/agenda', cta: 'Confirmar',
      })

    if (finSummary.vencidas > 0)
      result.push({
        icon: <Wallet size={13} />, level: 'danger',
        label: `${finSummary.vencidas} lançamento${finSummary.vencidas > 1 ? 's' : ''} financeiro${finSummary.vencidas > 1 ? 's' : ''} vencido${finSummary.vencidas > 1 ? 's' : ''}`,
        sub: 'Cobranças em atraso impactam o fluxo de caixa',
        to: '/financeiro', cta: 'Cobrar',
      })

    if (kpi.lowStock > 0)
      result.push({
        icon: <Package size={13} />, level: 'warning',
        label: `${kpi.lowStock} peça${kpi.lowStock > 1 ? 's' : ''} com estoque abaixo do mínimo`,
        sub: 'Reposição necessária para não travar serviços',
        to: '/estoque', cta: 'Ver estoque',
      })

    return result
  }, [kpi, finSummary])

  const recent = mockServiceOrders.slice(0, 8)

  const criticalParts = useMemo(() =>
    mockParts.filter(p => p.currentStock <= p.minimumStock).slice(0, 5),
  [])

  const mechanicLoad = useMemo(() => {
    const todayOS = mockServiceOrders.filter(os => !['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status))
    return mockMechanics.map(m => ({
      ...m,
      count: todayOS.filter(os => os.mechanicId === m.id).length,
    })).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [])

  const statusRows = [
    { label: 'Agendados',         status: 'AGENDADO',             cssKey: 'agendado'   },
    { label: 'Em diagnóstico',    status: 'EM_ANALISE',           cssKey: 'analise'    },
    { label: 'Em serviço',        status: 'EM_ANDAMENTO',         cssKey: 'andamento'  },
    { label: 'Aguard. aprovação', status: 'AGUARDANDO_APROVACAO', cssKey: 'aprovacao'  },
    { label: 'Concluídos',        status: 'CONCLUIDO',            cssKey: 'concluido'  },
  ]

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-6 py-6 space-y-5 max-w-[1600px]">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
              {getGreeting()}, Admin
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/relatorios" className="h-8 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5">
              <BarChart3 size={13} /> Relatórios
            </Link>
            <Link to="/servicos" className="h-8 px-3 rounded text-[12px] font-semibold text-white flex items-center gap-1.5 transition-colors" style={{ backgroundColor: 'var(--brand)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}>
              <Plus size={13} strokeWidth={2.5} /> Nova OS
            </Link>
          </div>
        </div>

        {/* ── Workflow banner ──────────────────────────────────────────── */}
        <WorkflowBanner
          inPatio={kpi.inPatio}
          agendaHoje={todayScheduleAll.length}
          osAbertas={kpi.open}
          aReceber={finSummary.aReceber}
          alerts={{ os: kpi.awaitApproval > 0, fin: finSummary.vencidas > 0 }}
        />

        {/* ── KPI row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard label="Veículos no pátio"  value={kpi.inPatio}       icon={<Car size={14} />}           accent="#2563EB"            to="/patio"      trend="flat" trendVal="igual a ontem" />
          <KpiCard label="Serviços abertos"   value={kpi.open}          icon={<ClipboardList size={14} />}  accent="var(--brand)"       to="/servicos"   trend="up"   trendVal={`${kpi.open} em andamento`} />
          <KpiCard label="Aguard. aprovação"  value={kpi.awaitApproval} icon={<Clock size={14} />}          accent={kpi.awaitApproval > 0 ? 'var(--warning)' : 'var(--text-muted)'} to="/servicos" trend={kpi.awaitApproval > 0 ? 'up' : 'flat'} trendVal="requer ação" />
          <KpiCard label="A receber hoje"     value={kpi.todayReceivable > 0 ? formatCurrency(kpi.todayReceivable) : 'R$ 0'} icon={<Wallet size={14} />} accent="var(--success)" to="/financeiro" trend="up" trendVal="no dia" />
        </div>

        {/* ── Two-column main layout ───────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ═══ LEFT (main) ══════════════════════════════════════════ */}
          <div className="space-y-5 min-w-0">

            {/* Próximas ações */}
            <ProximasAcoes actions={actions} />

            {/* Movimento do dia */}
            <SideCard title="Movimento do dia" link="/servicos" linkLabel="Ver todos">
              <div className="divide-y divide-[var(--border)]">
                {recent.map(os => (
                  <Link key={os.id} to={`/ordens-servico/${os.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: os.status === 'AGUARDANDO_APROVACAO' ? 'var(--os-aprovacao-text)' : os.status === 'EM_ANDAMENTO' ? 'var(--os-andamento-text)' : os.status === 'CONCLUIDO' ? 'var(--os-concluido-text)' : 'var(--text-muted)' }} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{os.vehicle}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{os.customerName} · OS #{os.number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:block">{os.plate}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded hidden md:inline-flex"
                        style={{ color: os.status === 'CONCLUIDO' ? 'var(--success)' : os.status === 'EM_ANDAMENTO' ? 'var(--brand)' : os.status === 'AGUARDANDO_APROVACAO' ? 'var(--warning)' : 'var(--text-muted)', backgroundColor: os.status === 'CONCLUIDO' ? 'var(--success-subtle)' : os.status === 'EM_ANDAMENTO' ? 'rgba(212,96,26,0.10)' : os.status === 'AGUARDANDO_APROVACAO' ? 'var(--warning-subtle)' : 'var(--surface-muted)' }}>
                        {os.status === 'CONCLUIDO' ? 'Concluído' : os.status === 'EM_ANDAMENTO' ? 'Em serviço' : os.status === 'AGUARDANDO_APROVACAO' ? 'Aguard. aprov.' : os.status === 'AGENDADO' ? 'Agendado' : os.status}
                      </span>
                      <ArrowRight size={12} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)]" />
                    </div>
                  </Link>
                ))}
              </div>
            </SideCard>

            {/* Agenda de hoje */}
            <SideCard title="Agenda de hoje" link="/agenda" linkLabel="Ver agenda">
              {todaySchedule.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-[var(--text-muted)]">Nenhum agendamento para hoje</div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {todaySchedule.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="text-right flex-shrink-0 w-10">
                        <p className="text-[13px] font-bold text-[var(--text-primary)] leading-none">{a.time}</p>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{a.duration}min</p>
                      </div>
                      <div className="w-px h-8 bg-[var(--border)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{a.customerName}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{(a as any).vehicle ?? (a as any).vehicleName ?? '—'} · {(a as any).mechanicName ?? 'Sem mecânico'}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0"
                        style={{ color: a.status === 'CONFIRMADO' ? '#2563EB' : a.status === 'REALIZADO' ? 'var(--success)' : 'var(--text-muted)', backgroundColor: a.status === 'CONFIRMADO' ? 'rgba(37,99,235,0.10)' : a.status === 'REALIZADO' ? 'var(--success-subtle)' : 'var(--surface-muted)' }}>
                        {a.status === 'CONFIRMADO' ? 'Confirmado' : a.status === 'REALIZADO' ? 'Realizado' : 'Agendado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SideCard>

            {/* Carga dos mecânicos */}
            <SideCard title="Carga da equipe" link="/equipe" linkLabel="Ver equipe">
              <div className="divide-y divide-[var(--border)]">
                {mechanicLoad.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                      style={{ backgroundColor: 'rgba(212,96,26,0.10)', color: 'var(--brand)' }}>
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{m.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{m.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-20 h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((m.count / 4) * 100, 100)}%`, backgroundColor: m.count >= 4 ? 'var(--danger)' : m.count >= 2 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] w-6 text-right">{m.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SideCard>

          </div>

          {/* ═══ RIGHT (sidebar) ══════════════════════════════════════ */}
          <div className="space-y-4 xl:sticky xl:top-[60px]">

            {/* Status da operação */}
            <SideCard title="Status das OS">
              <div className="px-4 py-3 space-y-3">
                {statusRows.map(({ label, status, cssKey }) => {
                  const count = mockServiceOrders.filter(os => os.status === status).length
                  const total = mockServiceOrders.length
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
                        <span className="text-[12px] font-bold text-[var(--text-primary)]">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: `var(--os-${cssKey}-text)` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-[var(--border)] flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <CheckCircle2 size={11} className="text-[var(--success)]" />
                  {mockServiceOrders.filter(os => os.status === 'CONCLUIDO').length} finalizados este mês
                </div>
              </div>
            </SideCard>

            {/* Resumo financeiro */}
            <SideCard title="Financeiro" link="/financeiro" linkLabel="Ver tudo">
              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-secondary)]">A receber</span>
                  <span className="text-[13px] font-bold text-[var(--success)]">{formatCurrency(finSummary.aReceber)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-secondary)]">A pagar</span>
                  <span className="text-[13px] font-bold text-[var(--danger)]">{formatCurrency(finSummary.aPagar)}</span>
                </div>
                <div className="h-px bg-[var(--border)]" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Saldo previsto</span>
                  <span className={cn('text-[13px] font-extrabold', finSummary.saldo >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
                    {formatCurrency(finSummary.saldo)}
                  </span>
                </div>
                {finSummary.vencidas > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--danger-subtle)] text-[11px] text-[var(--danger)] font-semibold">
                    <AlertTriangle size={11} /> {finSummary.vencidas} {finSummary.vencidas === 1 ? 'lançamento vencido' : 'lançamentos vencidos'}
                  </div>
                )}
              </div>
            </SideCard>

            {/* Estoque crítico */}
            {criticalParts.length > 0 && (
              <SideCard title="Estoque crítico" link="/estoque" linkLabel="Ver estoque">
                <div className="divide-y divide-[var(--border)]">
                  {criticalParts.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{p.description}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{p.internalCode}</p>
                      </div>
                      <div className="flex-shrink-0 text-right ml-3">
                        <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded', p.currentStock === 0 ? 'bg-[var(--danger-subtle)] text-[var(--danger)]' : 'bg-[var(--warning-subtle)] text-[var(--warning)]')}>
                          {p.currentStock === 0 ? 'Sem estoque' : `${p.currentStock} ${p.unit}`}
                        </span>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">mín. {p.minimumStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SideCard>
            )}

            {/* Acesso rápido */}
            <SideCard title="Acesso rápido">
              <div className="p-3 grid grid-cols-2 gap-2">
                {[
                  { to: '/servicos',   icon: <ClipboardList size={14} />, label: 'Nova OS',    color: 'var(--brand)'   },
                  { to: '/agenda',     icon: <CalendarDays  size={14} />, label: 'Agendar',    color: '#7C3AED'        },
                  { to: '/cadastros',  icon: <Users         size={14} />, label: 'Clientes',   color: '#0E7490'        },
                  { to: '/estoque',    icon: <Package       size={14} />, label: 'Estoque',    color: '#9D4E15'        },
                  { to: '/financeiro', icon: <Wallet        size={14} />, label: 'Financeiro', color: 'var(--success)' },
                  { to: '/patio',      icon: <Wrench        size={14} />, label: 'Pátio',      color: '#1A4E8C'        },
                ].map(item => (
                  <Link key={item.to} to={item.to}
                    className="flex items-center gap-2 px-3 py-2.5 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all group">
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span className="text-[12px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{item.label}</span>
                  </Link>
                ))}
              </div>
            </SideCard>

          </div>
        </div>
      </div>
    </div>
  )
}
