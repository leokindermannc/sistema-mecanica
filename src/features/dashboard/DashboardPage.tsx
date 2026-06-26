import { Link } from 'react-router-dom'
import {
  DollarSign, ClipboardList, Clock, AlertCircle,
  AlertTriangle, Package, Calendar, ArrowRight,
  CheckCircle2, TrendingUp, ChevronRight,
} from 'lucide-react'
import { MetricCard } from '../../components/garage/metric-card'
import { OsCard } from '../../components/garage/os-card'
import { StockAlertRow } from '../../components/garage/stock-alert'
import { VehiclePlate } from '../../components/garage/vehicle-plate'
import { mockServiceOrders } from '../../mocks/service-orders'
import { mockParts } from '../../mocks/inventory'
import { mockSchedule } from '../../mocks/schedule'
import {
  TYPE_LABELS, TYPE_COLORS,
  formatCurrency, getStockStatus,
} from '../../lib/utils'

// ── Derived data ─────────────────────────────────────────────────────────────

function useDashboardData() {
  const openOS        = mockServiceOrders.filter((o) => !['ENTREGUE', 'CANCELADO'].includes(o.status))
  const inProgress    = mockServiceOrders.filter((o) => o.status === 'EM_ANDAMENTO')
  const awaitApproval = mockServiceOrders.filter((o) => o.status === 'AGUARDANDO_APROVACAO')
  const lowStock      = mockParts.filter((p) => getStockStatus(p.currentStock, p.minimumStock) !== 'NORMAL')
  const totalRevenue  = mockServiceOrders
    .filter((o) => o.financialStatus === 'PAGA')
    .reduce((a, o) => a + (o.finalValue ?? o.estimatedValue), 0)

  // Veículos "parados" há mais de 48h (em análise ou aguardando aprovação)
  const stalled = mockServiceOrders.filter((o) => {
    const h = (Date.now() - new Date(o.entryDate).getTime()) / 3_600_000
    return h > 48 && ['EM_ANALISE', 'AGUARDANDO_APROVACAO'].includes(o.status)
  })

  return { openOS, inProgress, awaitApproval, lowStock, totalRevenue, stalled }
}

// ── Today's date ─────────────────────────────────────────────────────────────

function getTodayLabel() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { openOS, inProgress, awaitApproval, lowStock, totalRevenue, stalled } = useDashboardData()
  const today = getTodayLabel()

  // Today's schedule (first 4 items)
  const todayAppointments = (mockSchedule ?? []).slice(0, 4)

  return (
    <div className="p-5 max-w-[1440px] animate-fade-in">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-bold text-[var(--text-primary)] leading-tight">
            Bom dia, Admin
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/relatorios">
            <button className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] bg-[var(--surface)] text-[12px] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors shadow-xs">
              <TrendingUp size={12} />
              Relatórios
            </button>
          </Link>
          <Link to="/ordens-servico">
            <button
              className="flex items-center gap-1.5 h-7 px-3 rounded font-semibold text-[12px] text-white shadow-xs transition-all duration-[140ms]"
              style={{ backgroundColor: 'var(--brand)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
            >
              Nova OS
            </button>
          </Link>
        </div>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        <MetricCard
          label="Faturamento Mês"
          value={formatCurrency(totalRevenue)}
          microcopy="pagamentos confirmados"
          icon={<DollarSign size={15} />}
          variant="financial"
          trend="up"
          trendLabel="+12% vs mês anterior"
        />
        <MetricCard
          label="OS Abertas"
          value={openOS.length}
          microcopy={`${inProgress.length} em execução`}
          icon={<ClipboardList size={15} />}
          variant="operational"
          actionLabel="Ver todas"
          onAction={() => window.location.href = '/ordens-servico'}
        />
        <MetricCard
          label="Em Andamento"
          value={inProgress.length}
          microcopy="mecânicos trabalhando"
          icon={<Clock size={15} />}
          variant="operational"
        />
        <MetricCard
          label="Ag. Aprovação"
          value={awaitApproval.length}
          microcopy={awaitApproval.length > 0 ? 'clientes aguardam resposta' : 'nenhuma pendente'}
          icon={<AlertCircle size={15} />}
          variant={awaitApproval.length > 0 ? 'alert-warning' : 'operational'}
          trend={awaitApproval.length > 0 ? 'down' : undefined}
          trendLabel={awaitApproval.length > 0 ? 'Requer atenção' : undefined}
          actionLabel={awaitApproval.length > 0 ? 'Ver OS' : undefined}
          onAction={() => window.location.href = '/ordens-servico'}
        />
        <MetricCard
          label="Contas Vencidas"
          value={0}
          microcopy="tudo em dia"
          icon={<AlertTriangle size={15} />}
          variant="operational"
        />
        <MetricCard
          label="Estoque Baixo"
          value={lowStock.length}
          microcopy={lowStock.length > 0 ? 'itens precisam de reposição' : 'estoque normalizado'}
          icon={<Package size={15} />}
          variant={lowStock.length > 0 ? 'alert-warning' : 'operational'}
          trend={lowStock.length > 0 ? 'down' : undefined}
          trendLabel={lowStock.length > 0 ? 'Reposição necessária' : undefined}
          actionLabel={lowStock.length > 0 ? 'Ver estoque' : undefined}
          onAction={() => window.location.href = '/estoque'}
        />
      </div>

      {/* ── Operational Priorities ───────────────────────────────── */}
      {(awaitApproval.length > 0 || stalled.length > 0 || lowStock.length > 0) && (
        <div
          className="rounded-md border p-4 mb-4"
          style={{
            borderColor:     'var(--os-aprovacao-border)',
            backgroundColor: 'var(--os-aprovacao-bg)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} style={{ color: 'var(--os-aprovacao-text)' }} />
            <span
              className="text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: 'var(--os-aprovacao-text)' }}
            >
              Ações prioritárias
            </span>
          </div>

          <ul className="space-y-1.5">
            {awaitApproval.length > 0 && (
              <PriorityItem
                href="/ordens-servico"
                text={`${awaitApproval.length} OS aguardam aprovação do cliente`}
              />
            )}
            {stalled.length > 0 && (
              <PriorityItem
                href="/patio"
                text={`${stalled.length} veículo${stalled.length > 1 ? 's' : ''} parado${stalled.length > 1 ? 's' : ''} há mais de 48h`}
              />
            )}
            {lowStock.filter((p) => getStockStatus(p.currentStock, p.minimumStock) === 'SEM_ESTOQUE').length > 0 && (
              <PriorityItem
                href="/estoque"
                text={`${lowStock.filter((p) => getStockStatus(p.currentStock, p.minimumStock) === 'SEM_ESTOQUE').length} item${lowStock.length > 1 ? 'ns' : ''} com estoque zerado — pode bloquear serviços`}
              />
            )}
          </ul>
        </div>
      )}

      {/* ── Content grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left column (2/3) ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Recent OS */}
          <Panel
            title="Últimas Ordens de Serviço"
            action={
              <Link
                to="/ordens-servico"
                className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                style={{ color: 'var(--brand)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-dark)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--brand)')}
              >
                Ver todas <ArrowRight size={10} />
              </Link>
            }
          >
            <div className="divide-y divide-[var(--border)]">
              {mockServiceOrders.slice(0, 6).map((order) => (
                <OsCard key={order.id} order={order} variant="default" />
              ))}
            </div>
          </Panel>

          {/* OS status distribution */}
          <Panel title="Distribuição por Etapa">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
              {[
                { label: 'Agendado',      status: 'AGENDADO',             cssColor: 'var(--os-agendado-text)' },
                { label: 'Em Análise',    status: 'EM_ANALISE',           cssColor: 'var(--os-analise-text)'  },
                { label: 'Ag. Aprovação', status: 'AGUARDANDO_APROVACAO', cssColor: 'var(--os-aprovacao-text)'},
                { label: 'Em Andamento',  status: 'EM_ANDAMENTO',         cssColor: 'var(--os-andamento-text)'},
                { label: 'Concluído',     status: 'CONCLUIDO',            cssColor: 'var(--os-concluido-text)'},
                { label: 'Entregue',      status: 'ENTREGUE',             cssColor: 'var(--os-entregue-text)' },
              ].map(({ label, status, cssColor }) => {
                const count = mockServiceOrders.filter((o) => o.status === status).length
                return (
                  <Link
                    key={status}
                    to={`/ordens-servico?status=${status}`}
                    className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] px-3 py-2 transition-all duration-[140ms]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cssColor }}
                      />
                      <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
                    </div>
                    <span
                      className="text-[13px] font-bold"
                      style={{ color: count > 0 ? 'var(--text-primary)' : 'var(--text-disabled)' }}
                    >
                      {count}
                    </span>
                  </Link>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* ── Right column (1/3) ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Today's schedule */}
          <Panel
            title="Agenda de Hoje"
            icon={<Calendar size={12} style={{ color: 'var(--brand)' }} />}
            action={
              <Link
                to="/agenda"
                className="text-[11px] font-medium transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                Ver agenda
              </Link>
            }
          >
            {todayAppointments.length === 0 ? (
              <EmptyState
                icon={<Calendar size={20} className="text-[var(--text-disabled)]" />}
                title="Nenhuma agenda para hoje"
                subtitle="Nenhum compromisso cadastrado para hoje."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {todayAppointments.map((appt) => {
                  // Fallback for mock data that uses ServiceOrderType instead of AppointmentType
                  const typeLabel = (TYPE_LABELS as Record<string, string>)[appt.type] ?? appt.type
                  const typeColor = (TYPE_COLORS as Record<string, { bg: string; text: string }>)[appt.type]
                  return (
                    <div key={appt.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
                      <span className="font-mono text-[11px] font-semibold text-[var(--text-muted)] w-10 flex-shrink-0">
                        {appt.time}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                          {appt.customerName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] truncate">{appt.vehicle}</span>
                          <VehiclePlate plate={appt.plate} size="xs" />
                        </div>
                      </div>
                      {typeColor && (
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-sm border flex-shrink-0"
                          style={{ color: typeColor.text, backgroundColor: typeColor.bg, borderColor: 'transparent' }}
                        >
                          {typeLabel}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          {/* Stock alerts */}
          <Panel
            title="Alertas de Estoque"
            icon={<Package size={12} style={{ color: 'var(--warning)' }} />}
            action={
              <Link
                to="/estoque"
                className="text-[11px] font-medium transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                Ver estoque
              </Link>
            }
          >
            {lowStock.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={20} style={{ color: 'var(--success)' }} />}
                title="Estoque normalizado"
                subtitle="Todos os itens acima do mínimo."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {lowStock.slice(0, 5).map((part) => (
                  <StockAlertRow key={part.id} part={part} />
                ))}
                {lowStock.length > 5 && (
                  <div className="px-4 py-2 text-center">
                    <Link
                      to="/estoque"
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: 'var(--brand)' }}
                    >
                      +{lowStock.length - 5} itens com alerta
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ── Internal sub-components ───────────────────────────────────────────────────

function Panel({
  title, icon, action, children,
}: {
  title: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <h2 className="text-[12px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
          {icon}{title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function PriorityItem({ href, text }: { href: string; text: string }) {
  return (
    <li>
      <Link
        to={href}
        className="flex items-center gap-2 text-[12px] font-medium transition-colors group"
        style={{ color: 'var(--os-aprovacao-text)' }}
      >
        <ChevronRight size={12} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
        {text}
      </Link>
    </li>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center py-8 gap-2 px-4">
      <div className="opacity-60">{icon}</div>
      <p className="text-[12px] font-medium text-[var(--text-secondary)] text-center">{title}</p>
      <p className="text-[11px] text-[var(--text-muted)] text-center">{subtitle}</p>
    </div>
  )
}
