import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X, Plus, Gauge, Clock, AlertTriangle, FileText,
  CheckCircle2, Wrench, Package, ChevronRight,
} from 'lucide-react'
import type { Vehicle, ServiceOrderStatus } from '../../types'
import { mockServiceOrders } from '../../mocks/service-orders'
import { cn, formatDate, formatCurrency } from '../../lib/utils'

// ── Config ────────────────────────────────────────────────────────────────────

type VTab = 'resumo' | 'historico' | 'pecas' | 'revisoes' | 'dados'

const VTABS: { key: VTab; label: string }[] = [
  { key: 'resumo',    label: 'Resumo' },
  { key: 'historico', label: 'Histórico' },
  { key: 'pecas',     label: 'Peças' },
  { key: 'revisoes',  label: 'Revisões' },
  { key: 'dados',     label: 'Dados' },
]

const OS_STATUS_CFG: Record<ServiceOrderStatus, { label: string; cssKey: string }> = {
  AGENDADO:             { label: 'Agendado',          cssKey: 'agendado' },
  EM_ANALISE:           { label: 'Em diagnóstico',    cssKey: 'analise' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação', cssKey: 'aprovacao' },
  EM_ANDAMENTO:         { label: 'Em serviço',        cssKey: 'andamento' },
  CONCLUIDO:            { label: 'Concluído',         cssKey: 'concluido' },
  ENTREGUE:             { label: 'Entregue',          cssKey: 'entregue' },
  CANCELADO:            { label: 'Cancelado',         cssKey: 'cancelado' },
}

const FUEL_LABELS: Record<string, string> = {
  GASOLINA: 'Gasolina', ETANOL: 'Etanol', FLEX: 'Flex',
  DIESEL: 'Diesel', ELETRICO: 'Elétrico', HIBRIDO: 'Híbrido',
}

const REVISION_ITEMS = [
  'Troca de óleo e filtro de óleo',
  'Verificação do filtro de ar',
  'Calibragem e inspeção dos pneus',
  'Verificação do fluido de freio',
  'Verificação do líquido de arrefecimento',
  'Inspeção das pastilhas e discos de freio',
  'Verificação da bateria e sistema elétrico',
]

// ── Shared small components ───────────────────────────────────────────────────

function OsChip({ status }: { status: ServiceOrderStatus }) {
  const cfg = OS_STATUS_CFG[status]
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border inline-flex flex-shrink-0"
      style={{
        color:           `var(--os-${cfg.cssKey}-text)`,
        backgroundColor: `var(--os-${cfg.cssKey}-bg)`,
        borderColor:     `var(--os-${cfg.cssKey}-border)`,
      }}
    >
      {cfg.label}
    </span>
  )
}

function VField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.08em] mb-0.5">{label}</p>
      <p className={cn(
        'text-[13px] font-medium text-[var(--text-primary)]',
        mono && 'font-mono',
        !value && 'text-[var(--text-muted)] italic text-[12px]',
      )}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.12em] mb-3">
      {children}
    </h4>
  )
}

function StatCard({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
      <span className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + '18', color: accent }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-extrabold text-[var(--text-primary)] leading-none tabular-nums truncate">{value}</p>
        <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5 truncate">{label}</p>
      </div>
    </div>
  )
}

function EmptyPlaceholder({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
      <span className="text-[var(--text-disabled)]">{icon}</span>
      <p className="text-[13px] font-medium text-[var(--text-secondary)] mt-1">{title}</p>
      {sub && <p className="text-[12px] text-[var(--text-muted)] max-w-[260px]">{sub}</p>}
    </div>
  )
}

// ── Tab: Resumo ───────────────────────────────────────────────────────────────

function ResumoTab({ vehicle, orders, onClose }: {
  vehicle: Vehicle
  orders: ReturnType<typeof mockServiceOrders.filter>
  onClose: () => void
}) {
  const openOrders  = orders.filter(os => !['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status))
  const recentOrders = orders.slice(0, 4)
  const kmToRevision = vehicle.nextRevisionKm != null && vehicle.currentKm != null
    ? vehicle.nextRevisionKm - vehicle.currentKm
    : null

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="KM atual"
          value={vehicle.currentKm != null ? `${vehicle.currentKm.toLocaleString('pt-BR')} km` : '—'}
          icon={<Gauge size={15} />}
          accent="#2563EB"
        />
        <StatCard
          label="Próxima revisão"
          value={vehicle.nextRevisionKm != null ? `${vehicle.nextRevisionKm.toLocaleString('pt-BR')} km` : '—'}
          icon={<Wrench size={15} />}
          accent={kmToRevision != null && kmToRevision <= 5000 ? 'var(--warning)' : 'var(--success)'}
        />
        <StatCard
          label="Última OS"
          value={vehicle.lastServiceDate ? formatDate(vehicle.lastServiceDate) : '—'}
          icon={<Clock size={15} />}
          accent="var(--brand)"
        />
        <StatCard
          label="OS abertas"
          value={String(vehicle.openServiceOrders)}
          icon={<FileText size={15} />}
          accent={vehicle.openServiceOrders > 0 ? 'var(--os-aprovacao-text)' : 'var(--text-muted)'}
        />
      </div>

      {/* Alerts */}
      {((kmToRevision != null && kmToRevision <= 5000) || openOrders.length > 0) && (
        <div>
          <SectionTitle>Alertas</SectionTitle>
          <div className="space-y-2">
            {kmToRevision != null && kmToRevision <= 5000 && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border"
                style={{ backgroundColor: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
                <AlertTriangle size={13} className="flex-shrink-0 mt-px" style={{ color: 'var(--warning)' }} />
                <p className="text-[12px] font-medium" style={{ color: 'var(--warning)' }}>
                  Próxima revisão em{' '}
                  <strong>{kmToRevision.toLocaleString('pt-BR')} km</strong>
                  {' '}({vehicle.nextRevisionKm?.toLocaleString('pt-BR')} km)
                </p>
              </div>
            )}
            {openOrders.length > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border"
                style={{ backgroundColor: 'var(--os-aprovacao-bg)', borderColor: 'var(--os-aprovacao-border)' }}>
                <AlertTriangle size={13} className="flex-shrink-0 mt-px" style={{ color: 'var(--os-aprovacao-text)' }} />
                <p className="text-[12px] font-medium" style={{ color: 'var(--os-aprovacao-text)' }}>
                  {openOrders.length === 1
                    ? '1 ordem de serviço em aberto para este veículo'
                    : `${openOrders.length} ordens de serviço em aberto para este veículo`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent service orders */}
      {recentOrders.length > 0 ? (
        <div>
          <SectionTitle>Últimos serviços</SectionTitle>
          <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
            {recentOrders.map(os => (
              <Link
                key={os.id}
                to={`/ordens-servico/${os.id}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                    {os.description.slice(0, 65)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    #{os.number} · {formatDate(os.entryDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <OsChip status={os.status} />
                  <span className="hidden sm:block text-[12px] font-medium tabular-nums text-[var(--text-secondary)] w-20 text-right">
                    {formatCurrency(os.estimatedValue)}
                  </span>
                  <ChevronRight size={12} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyPlaceholder
          icon={<FileText size={28} />}
          title="Nenhum serviço registrado"
          sub="Crie uma OS para começar o histórico deste veículo."
        />
      )}
    </div>
  )
}

// ── Tab: Histórico ────────────────────────────────────────────────────────────

function HistoricoTab({ orders, onClose }: {
  orders: ReturnType<typeof mockServiceOrders.filter>
  onClose: () => void
}) {
  const open   = orders.filter(os => !['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status))
  const closed = orders.filter(os =>  ['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status))

  if (orders.length === 0) {
    return (
      <EmptyPlaceholder
        icon={<FileText size={28} />}
        title="Nenhuma OS registrada"
        sub="Este veículo ainda não possui ordens de serviço."
      />
    )
  }

  function OsRow({ os }: { os: (typeof orders)[number] }) {
    return (
      <Link
        to={`/ordens-servico/${os.id}`}
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors group"
      >
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">#{os.number}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{os.description.slice(0, 70)}</p>
          </div>
          <span className="hidden sm:block text-[11px] text-[var(--text-muted)] w-20 flex-shrink-0">
            {formatDate(os.entryDate)}
          </span>
          <OsChip status={os.status} />
          <span className="hidden sm:block text-[12px] font-bold tabular-nums text-[var(--text-primary)] w-24 text-right flex-shrink-0">
            {formatCurrency(os.estimatedValue)}
          </span>
        </div>
        <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
      </Link>
    )
  }

  return (
    <div className="space-y-5">
      {open.length > 0 && (
        <div>
          <SectionTitle>Em aberto ({open.length})</SectionTitle>
          <div className="rounded-lg overflow-hidden divide-y divide-[var(--border)]"
            style={{ border: '1px solid var(--os-aprovacao-border)', backgroundColor: 'var(--os-aprovacao-bg)' }}>
            {open.map(os => <OsRow key={os.id} os={os} />)}
          </div>
        </div>
      )}
      {closed.length > 0 && (
        <div>
          <SectionTitle>Finalizados ({closed.length})</SectionTitle>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
            {closed.map(os => <OsRow key={os.id} os={os} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Peças ────────────────────────────────────────────────────────────────

function PecasTab({ orders }: { orders: ReturnType<typeof mockServiceOrders.filter> }) {
  const parts = useMemo(() => {
    return orders
      .flatMap(os =>
        os.parts.map(p => ({
          key:       `${os.id}-${p.partId}`,
          name:      p.description,
          quantity:  p.quantity,
          unitPrice: p.unitPrice,
          total:     p.total,
          osNumber:  os.number,
          osId:      os.id,
          date:      os.entryDate,
        })),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [orders])

  if (parts.length === 0) {
    return (
      <EmptyPlaceholder
        icon={<Package size={28} />}
        title="Nenhuma peça substituída registrada"
        sub="As peças utilizadas nas ordens de serviço deste veículo aparecerão aqui."
      />
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
        {['Peça', 'Qtd', 'Valor unit.', 'OS / Data'].map(h => (
          <span key={h} className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {h}
          </span>
        ))}
      </div>
      <div className="divide-y divide-[var(--border)]">
        {parts.map(p => (
          <div key={p.key} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-4 py-3">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
            <span className="hidden sm:block text-[12px] text-[var(--text-secondary)] w-12 tabular-nums text-center font-medium">
              {p.quantity}×
            </span>
            <span className="hidden sm:block text-[12px] tabular-nums text-[var(--text-secondary)] w-24 text-right">
              {formatCurrency(p.unitPrice)}
            </span>
            <span className="hidden sm:block text-[10px] text-[var(--text-muted)] w-36 text-right font-mono">
              #{os_number_short(p.osNumber)} · {formatDate(p.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function os_number_short(n: string) {
  return n.split('-')[1] ?? n
}

// ── Tab: Revisões ─────────────────────────────────────────────────────────────

function RevisoesTab({ vehicle, orders }: {
  vehicle: Vehicle
  orders: ReturnType<typeof mockServiceOrders.filter>
}) {
  const lastDone = orders
    .filter(os => os.status === 'CONCLUIDO' || os.status === 'ENTREGUE')
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate))[0]

  const kmToRevision = vehicle.nextRevisionKm != null && vehicle.currentKm != null
    ? vehicle.nextRevisionKm - vehicle.currentKm
    : null

  if (!lastDone && vehicle.nextRevisionKm == null) {
    return (
      <EmptyPlaceholder
        icon={<Wrench size={28} />}
        title="Ainda não há revisão registrada"
        sub="Após a primeira revisão, as informações de manutenção preventiva aparecerão aqui."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-4">
          <SectionTitle>Última revisão</SectionTitle>
          <VField label="Data"      value={lastDone ? formatDate(lastDone.entryDate) : null} />
          <VField label="KM na OS"  value={vehicle.currentKm != null ? `${vehicle.currentKm.toLocaleString('pt-BR')} km` : null} />
          <VField label="OS"        value={lastDone ? `#${lastDone.number}` : null} mono />
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-4">
          <SectionTitle>Próxima revisão</SectionTitle>
          <VField
            label="KM sugerido"
            value={vehicle.nextRevisionKm != null ? `${vehicle.nextRevisionKm.toLocaleString('pt-BR')} km` : null}
          />
          {kmToRevision != null && (
            <div>
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.08em] mb-0.5">Faltam</p>
              <p className={cn(
                'text-[18px] font-extrabold tabular-nums leading-none',
                kmToRevision <= 2000
                  ? 'text-[var(--danger)]'
                  : kmToRevision <= 5000
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--success)]',
              )}>
                {kmToRevision.toLocaleString('pt-BR')} km
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Itens recomendados na revisão</SectionTitle>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
          {REVISION_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <CheckCircle2 size={13} className="flex-shrink-0 text-[var(--text-disabled)]" />
              <p className="text-[12px] text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Dados ────────────────────────────────────────────────────────────────

function DadosTab({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-4">
          <SectionTitle>Identificação</SectionTitle>
          <VField label="Marca"  value={vehicle.brand} />
          <VField label="Modelo" value={vehicle.model} />
          <VField label="Ano"    value={String(vehicle.year)} />
          <VField label="Placa"  value={vehicle.plate} mono />
          <VField label="Chassi" value={vehicle.chassi ?? null} mono />
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] space-y-4">
          <SectionTitle>Características</SectionTitle>
          <VField label="Cor"           value={vehicle.color ?? null} />
          <VField label="Combustível"   value={FUEL_LABELS[vehicle.fuel]} />
          <VField label="Motor"         value={vehicle.engine ?? null} />
          <VField label="KM atual"      value={vehicle.currentKm != null ? `${vehicle.currentKm.toLocaleString('pt-BR')} km` : null} />
          <VField label="Próx. revisão" value={vehicle.nextRevisionKm != null ? `${vehicle.nextRevisionKm.toLocaleString('pt-BR')} km` : null} />
        </div>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export interface VehicleDetailsModalProps {
  vehicle: Vehicle
  onClose: () => void
  onNewOS: () => void
}

export function VehicleDetailsModal({ vehicle, onClose, onNewOS }: VehicleDetailsModalProps) {
  const [tab, setTab] = useState<VTab>('resumo')

  const orders = useMemo(
    () => mockServiceOrders.filter(os => os.vehicleId === vehicle.id),
    [vehicle.id],
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes: ${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-[960px] max-h-[92vh] sm:max-h-[88vh] bg-[var(--surface)] rounded-t-2xl sm:rounded-xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex-shrink-0 sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-[var(--border)]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[17px] sm:text-[18px] font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </h2>
              {vehicle.openServiceOrders > 0 && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0"
                  style={{
                    color:           'var(--os-aprovacao-text)',
                    backgroundColor: 'var(--os-aprovacao-bg)',
                    borderColor:     'var(--os-aprovacao-border)',
                  }}
                >
                  {vehicle.openServiceOrders} OS ativa{vehicle.openServiceOrders !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
              {vehicle.plate}
              {vehicle.color ? ` · ${vehicle.color}` : ''}
              {` · ${FUEL_LABELS[vehicle.fuel]}`}
              {` · ${vehicle.customerName}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onNewOS}
              className="hidden sm:flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--brand)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
            >
              <Plus size={12} strokeWidth={2.5} />
              Nova OS
            </button>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex-shrink-0 flex border-b border-[var(--border)] px-2 sm:px-6 overflow-x-auto"
          role="tablist"
          style={{ scrollbarWidth: 'none' }}
        >
          {VTABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative h-10 px-3 sm:px-4 text-[12px] font-medium whitespace-nowrap transition-colors flex-shrink-0',
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === 'resumo'    && <ResumoTab    vehicle={vehicle} orders={orders} onClose={onClose} />}
          {tab === 'historico' && <HistoricoTab orders={orders} onClose={onClose} />}
          {tab === 'pecas'     && <PecasTab     orders={orders} />}
          {tab === 'revisoes'  && <RevisoesTab  vehicle={vehicle} orders={orders} />}
          {tab === 'dados'     && <DadosTab     vehicle={vehicle} />}
        </div>

        {/* Mobile footer */}
        <div className="sm:hidden flex-shrink-0 border-t border-[var(--border)] px-4 py-3">
          <button
            onClick={onNewOS}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-semibold text-white"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Nova OS para este veículo
          </button>
        </div>
      </div>
    </div>
  )
}
