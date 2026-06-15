import { useState, useMemo } from 'react'
import {
  Search, Plus, MessageCircle, User, Car, Hash,
  X, Phone, FileText, Camera, History,
  ArrowRight, AlertTriangle, CheckCircle2,
  Wrench, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  mockPatioVehicles,
  STATUS_CONFIG,
  TIMELINE_STAGES,
  type PatioVehicle,
  type PatioStatus,
  type TimelineStage,
} from '../../mocks/patio'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterChip = 'todos' | 'atencao' | 'em_servico' | 'ag_aprovacao' | 'atrasados' | 'prontos'

interface NewVehicleForm {
  plate: string
  customerName: string
  whatsapp: string
  model: string
  service: string
  entryTime: string
  notes: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = '2026-06-12'

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAYS_SHORT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function parseDateStr(d: string) { return new Date(d + 'T12:00:00') }
function formatDateLabel(d: string) {
  const dt = parseDateStr(d)
  if (d === TODAY) return `Hoje, ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`
  return `${DAYS_SHORT[dt.getDay()]}, ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`
}
function shiftDate(d: string, delta: number) {
  const dt = parseDateStr(d); dt.setDate(dt.getDate() + delta)
  return dt.toISOString().slice(0, 10)
}

const FILTER_CHIPS: Array<{ key: FilterChip; label: string }> = [
  { key: 'todos',      label: 'Todos' },
  { key: 'atencao',    label: 'Atenção' },
  { key: 'em_servico', label: 'Em serviço' },
  { key: 'prontos',    label: 'Prontos' },
]

const ATTENTION_STATUSES: PatioStatus[]   = ['ATRASADO', 'AGUARDANDO_APROVACAO']
const IN_PROGRESS_STATUSES: PatioStatus[] = ['ENTROU_HOJE', 'EM_DIAGNOSTICO', 'AGUARDANDO_ORCAMENTO', 'AGUARDANDO_PECA', 'EM_SERVICO']
const READY_STATUSES: PatioStatus[]       = ['PRONTO', 'ENTREGUE']

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function buildWaUrl(phone: string, text: string) {
  return `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

function getWaMessages(v: PatioVehicle) {
  const val = v.estimatedValue !== undefined
    ? `R$ ${v.estimatedValue.toFixed(2).replace('.', ',')}`
    : 'a combinar'
  return [
    {
      label: 'Carro recebido',
      text: `Olá ${v.customer.name}! Recebemos seu veículo ${v.brand} ${v.model} placa ${v.plate} na oficina. Vamos iniciar a análise e avisamos em breve. 🔧`,
    },
    {
      label: 'Orçamento pronto',
      text: `Olá ${v.customer.name}! Finalizamos o diagnóstico do seu ${v.brand} ${v.model}. O orçamento ficou em ${val}. Podemos seguir com o serviço?`,
    },
    {
      label: 'Serviço iniciado',
      text: `Olá ${v.customer.name}! Seu veículo ${v.brand} ${v.model} já está em serviço. Avisamos quando estiver pronto! 👨‍🔧`,
    },
    {
      label: 'Serviço finalizado',
      text: `Olá ${v.customer.name}! Seu veículo ${v.brand} ${v.model} placa ${v.plate} está pronto para retirada. Aguardamos você! ✅`,
    },
  ]
}

// ─── PatioPage ────────────────────────────────────────────────────────────────

export function PatioPage() {
  const [vehicles, setVehicles]         = useState<PatioVehicle[]>(mockPatioVehicles)
  const [selectedId, setSelectedId]     = useState<string>(mockPatioVehicles[0].id)
  const [search, setSearch]             = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('todos')
  const [showModal, setShowModal]       = useState(false)
  const [selectedDate, setSelectedDate] = useState(TODAY)

  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0]

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (search) {
        const q        = search.toLowerCase()
        const plateFmt = v.plate.toLowerCase().replace(/[-\s]/g, '')
        const queryFmt = q.replace(/[-\s]/g, '')
        if (
          !plateFmt.includes(queryFmt) &&
          !v.customer.name.toLowerCase().includes(q) &&
          !v.customer.phone.includes(q)
        ) return false
      }
      if (activeFilter === 'atencao')      return ATTENTION_STATUSES.includes(v.status)
      if (activeFilter === 'em_servico')   return v.status === 'EM_SERVICO'
      if (activeFilter === 'ag_aprovacao') return v.status === 'AGUARDANDO_APROVACAO'
      if (activeFilter === 'atrasados')    return v.status === 'ATRASADO'
      if (activeFilter === 'prontos')      return v.status === 'PRONTO'
      return true
    })
  }, [vehicles, search, activeFilter])

  const attentionGroup  = filtered.filter((v) => ATTENTION_STATUSES.includes(v.status))
  const inProgressGroup = filtered.filter((v) => IN_PROGRESS_STATUSES.includes(v.status))
  const readyGroup      = filtered.filter((v) => READY_STATUSES.includes(v.status))

  const handleAddVehicle = (form: NewVehicleForm) => {
    const nv: PatioVehicle = {
      id: `pv${Date.now()}`,
      plate: form.plate.toUpperCase(),
      brand: form.model.split(' ')[0] ?? 'Veículo',
      model: form.model,
      year: new Date().getFullYear(),
      customer: { name: form.customerName, phone: form.whatsapp },
      service: form.service || 'A definir',
      status: 'ENTROU_HOJE',
      nextAction: 'Iniciar diagnóstico',
      entryTime: form.entryTime || new Date().toTimeString().slice(0, 5),
      entryDate: TODAY,
      currentStage: 'recebido',
    }
    setVehicles((prev) => [nv, ...prev])
    setSelectedId(nv.id)
    setShowModal(false)
  }

  const counts = {
    total:     vehicles.filter((v) => v.status !== 'ENTREGUE').length,
    attention: vehicles.filter((v) => ATTENTION_STATUSES.includes(v.status)).length,
    approval:  vehicles.filter((v) => v.status === 'AGUARDANDO_APROVACAO').length,
    overdue:   vehicles.filter((v) => v.status === 'ATRASADO').length,
    ready:     vehicles.filter((v) => v.status === 'PRONTO').length,
  }

  const nextVehicle = [...vehicles]
    .filter((v) => !['PRONTO', 'ENTREGUE'].includes(v.status))
    .sort((a, b) => a.entryTime.localeCompare(b.entryTime))[0] ?? null

  return (
    <div className="flex h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* ── Left column: header + pills + queue ────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

      {/* ── Command bar ────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-3 pb-2.5 bg-t-topbar border-b border-t-border">

        {/* Linha 1: Título + Data + Novo veículo */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="text-[15px] font-bold text-t-text tracking-tight leading-none flex-shrink-0">
            Pátio da Oficina
          </h1>

          {/* Navegador de data compacto */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="w-6 h-6 rounded-md flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-card-hover transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => setSelectedDate(TODAY)}
              className="h-6 px-2.5 rounded-md text-[11px] font-semibold text-t-text hover:bg-t-card-hover transition-colors tabular-nums whitespace-nowrap"
            >
              {formatDateLabel(selectedDate)}
            </button>
            <button
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              className="w-6 h-6 rounded-md flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-card-hover transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[11px] font-semibold transition-colors shadow-card"
          >
            <Plus size={12} strokeWidth={2.5} />
            Novo veículo
          </button>
        </div>

        {/* Linha 2: Busca + chips + resumo */}
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative flex items-center flex-shrink-0">
            <Search size={12} className="absolute left-2.5 text-t-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar placa, cliente ou OS"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-7 w-52 rounded-lg border border-t-border bg-t-surface',
                'text-[11px] text-t-text placeholder:text-t-muted',
                'pl-7 pr-7 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all',
              )}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 text-t-muted hover:text-t-secondary transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Chips de filtro */}
          <div className="flex items-center gap-1">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setActiveFilter(chip.key)}
                className={cn(
                  'h-6 px-2.5 rounded-full text-[10px] font-medium transition-all border',
                  activeFilter === chip.key
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                    : 'bg-t-card text-t-secondary border-t-border hover:text-t-text',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Resumo do dia — frase compacta */}
          <p className="ml-auto text-[10px] text-t-muted whitespace-nowrap flex-shrink-0">
            <span className="font-semibold text-t-text">{counts.total}</span> veículos
            {counts.attention > 0 && (
              <> · <span className="font-semibold text-orange-600">{counts.attention}</span> atenção</>
            )}
            {counts.ready > 0 && (
              <> · <span className="font-semibold text-green-700">{counts.ready}</span> {counts.ready === 1 ? 'pronto' : 'prontos'}</>
            )}
            {nextVehicle && (
              <> · Próximo: <span className="font-semibold text-t-secondary tabular-nums">{nextVehicle.entryTime}</span> · <span className="font-mono font-semibold text-t-text">{nextVehicle.plate}</span></>
            )}
          </p>
        </div>
      </div>

        {/* ── Queue — scrolls independently ─────────── */}
        <div className="flex-1 overflow-y-auto min-w-0 bg-t-bg">
          <div className="px-4 py-3.5 space-y-5">
            {attentionGroup.length > 0 && (
              <QueueGroup
                title="Atenção agora"
                icon={<AlertTriangle size={12} className="text-red-500" />}
                headerColor="text-red-600 dark:text-red-400"
                vehicles={attentionGroup}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
            {inProgressGroup.length > 0 && (
              <QueueGroup
                title="Em atendimento"
                icon={<Wrench size={12} className="text-blue-500" />}
                headerColor="text-blue-700 dark:text-blue-400"
                vehicles={inProgressGroup}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
            {readyGroup.length > 0 && (
              <QueueGroup
                title="Prontos para entrega"
                icon={<CheckCircle2 size={12} className="text-green-500" />}
                headerColor="text-green-700 dark:text-green-400"
                vehicles={readyGroup}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-t-muted">
                <div className="w-12 h-12 rounded-full bg-t-surface border border-t-border flex items-center justify-center mb-3">
                  <Search size={18} className="opacity-30" />
                </div>
                <p className="text-[12px] font-medium text-t-secondary">Nenhum veículo encontrado</p>
                <p className="text-[11px] mt-1">Ajuste a busca ou os filtros</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Details panel — full height, alinhado ao global header ── */}
      {selected && (
        <VehicleDetailsPanel key={selected.id} vehicle={selected} />
      )}

      {showModal && (
        <NewVehicleModal onClose={() => setShowModal(false)} onSave={handleAddVehicle} />
      )}
    </div>
  )
}

// ─── Queue Group ──────────────────────────────────────────────────────────────

function QueueGroup({ title, icon, headerColor, vehicles, selectedId, onSelect }: {
  title: string
  icon: React.ReactNode
  headerColor: string
  vehicles: PatioVehicle[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
        {icon}
        <h3 className={cn('text-[10px] font-extrabold uppercase tracking-[0.09em]', headerColor)}>
          {title}
        </h3>
        <span className="text-[9px] font-bold text-t-muted bg-t-card border border-t-border rounded-full px-1.5 py-0.5 leading-none ml-0.5">
          {vehicles.length}
        </span>
      </div>
      <div className="space-y-2">
        {vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            isSelected={v.id === selectedId}
            onClick={() => onSelect(v.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Next-step block style por status ────────────────────────────────────────

function getNextStepStyle(status: PatioStatus) {
  switch (status) {
    case 'ATRASADO':
      return { bg: '#FFF5F5', border: '#FECACA', labelColor: '#DC2626', arrowColor: '#DC2626', textColor: '#991B1B' }
    case 'AGUARDANDO_APROVACAO':
      return { bg: '#FFFBEB', border: '#FDE68A', labelColor: '#D97706', arrowColor: '#D97706', textColor: '#92400E' }
    case 'EM_SERVICO':
    case 'AGUARDANDO_PECA':
      return { bg: '#EFF6FF', border: '#BFDBFE', labelColor: '#2563EB', arrowColor: '#2563EB', textColor: '#1E40AF' }
    case 'EM_DIAGNOSTICO':
    case 'AGUARDANDO_ORCAMENTO':
      return { bg: '#F0F9FF', border: '#BAE6FD', labelColor: '#0284C7', arrowColor: '#0284C7', textColor: '#075985' }
    case 'PRONTO':
      return { bg: '#F0FDF4', border: '#BBF7D0', labelColor: '#16A34A', arrowColor: '#16A34A', textColor: '#14532D' }
    default:
      return { bg: '#F9FAFB', border: '#E5E7EB', labelColor: '#6B7280', arrowColor: '#9CA3AF', textColor: '#374151' }
  }
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({ vehicle: v, isSelected, onClick }: {
  vehicle: PatioVehicle; isSelected: boolean; onClick: () => void
}) {
  const sc  = STATUS_CONFIG[v.status]
  const nss = getNextStepStyle(v.status)
  const msgs = getWaMessages(v)
  const quickMsgIdx = v.status === 'AGUARDANDO_ORCAMENTO' ? 1
                    : v.status === 'EM_SERVICO'           ? 2
                    : v.status === 'PRONTO'               ? 3
                    : 0
  const waUrl = buildWaUrl(v.customer.phone, msgs[quickMsgIdx].text)

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white dark:bg-t-card rounded-2xl border overflow-hidden cursor-pointer transition-all duration-150',
        isSelected
          ? 'border-[#0f172a] dark:border-white/50'
          : 'border-t-border hover:border-gray-300 dark:hover:border-white/20',
      )}
      style={isSelected ? { boxShadow: '0 8px 24px rgba(15,23,42,0.08)' } : undefined}
    >
      {/* Barra lateral de status */}
      <div
        className="absolute left-0 top-0 bottom-0 transition-all duration-150"
        style={{ width: isSelected ? 5 : 4, backgroundColor: sc.accent }}
      />

      <div className="pl-5 pr-4 py-2.5 flex flex-col gap-1.5">

        {/* ── Linha 1: Placa + Modelo | Status + Horário ─── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Placa */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Hash size={9} className="text-[#94A3B8]" />
              <span className="font-mono text-[13px] font-extrabold text-[#0f172a] dark:text-white tracking-[0.1em]">
                {v.plate}
              </span>
            </div>
            {/* Modelo */}
            <div className="flex items-center gap-1 min-w-0">
              <Car size={9} className="text-[#94A3B8] flex-shrink-0" />
              <span className="text-[11px] font-medium text-[#334155] dark:text-t-secondary truncate">
                {v.brand} {v.model}
              </span>
            </div>
          </div>
          {/* Status + Horário */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-[3px] rounded-md whitespace-nowrap"
              style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.accent}55` }}
            >
              <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: sc.accent }} />
              {sc.label}
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] tabular-nums">{v.entryTime}</span>
          </div>
        </div>

        {/* ── Linha 2: Cliente | Serviço | Próximo passo (grid 3 col) ── */}
        <div className="grid grid-cols-3 gap-x-3 min-w-0">
          {/* Cliente */}
          <div className="flex flex-col gap-px min-w-0">
            <div className="flex items-center gap-1">
              <User size={8} className="text-[#94A3B8]" />
              <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-wider">Cliente</span>
            </div>
            <span className="text-[11px] font-semibold text-[#111827] dark:text-t-text truncate">
              {v.customer.name}
            </span>
          </div>
          {/* Serviço */}
          <div className="flex flex-col gap-px min-w-0">
            <div className="flex items-center gap-1">
              <Wrench size={8} className="text-[#94A3B8]" />
              <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-wider">Serviço</span>
            </div>
            <span className="text-[11px] font-semibold text-[#111827] dark:text-t-text truncate">
              {v.service}
            </span>
          </div>
          {/* Próximo passo */}
          <div className="flex flex-col gap-px min-w-0">
            <div className="flex items-center gap-1">
              <ArrowRight size={8} style={{ color: nss.arrowColor }} className="flex-shrink-0" />
              <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: nss.labelColor }}>
                Próximo passo
              </span>
            </div>
            <span className="text-[11px] font-bold truncate" style={{ color: nss.textColor }}>
              {v.nextAction}
            </span>
          </div>
        </div>

        {/* ── Linha 3: Mecânico + Valor + WhatsApp ─────────── */}
        <div className="flex items-center gap-2">
          {v.mechanic ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <div className="w-[15px] h-[15px] rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[6px] font-extrabold text-blue-700 dark:text-blue-300 leading-none">
                  {v.mechanic[0]}
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#475569] dark:text-t-secondary truncate">
                {v.mechanic}
              </span>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <span className={cn(
            'flex-shrink-0 tabular-nums',
            v.estimatedValue !== undefined
              ? 'text-[12px] font-extrabold text-[#0f172a] dark:text-t-text'
              : 'text-[10px] italic text-[#94A3B8]',
          )}>
            {v.estimatedValue !== undefined ? fmt.format(v.estimatedValue) : 'A definir'}
          </span>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 h-[26px] px-2.5 rounded-[8px] bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold hover:bg-green-100 transition-colors flex-shrink-0 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
          >
            <MessageCircle size={9} />
            WhatsApp
          </a>
        </div>

      </div>
    </div>
  )
}

// ─── Vehicle Details Panel ────────────────────────────────────────────────────

function VehicleDetailsPanel({ vehicle: v }: { vehicle: PatioVehicle }) {
  const [activeTab, setActiveTab] = useState<'resumo' | 'cliente' | 'veiculo' | 'historico'>('resumo')
  const [showWaMenu, setShowWaMenu] = useState(false)
  const sc = STATUS_CONFIG[v.status]
  const messages = getWaMessages(v)

  const TABS = [
    { key: 'resumo'    as const, label: 'Resumo' },
    { key: 'cliente'   as const, label: 'Cliente' },
    { key: 'veiculo'   as const, label: 'Veículo' },
    { key: 'historico' as const, label: 'Histórico' },
  ]

  return (
    <div className="w-[370px] flex-shrink-0 border-l border-t-border bg-t-card flex flex-col overflow-hidden">

      {/* ── Card resumo da OS ──────────────────── */}
      <div className="flex-shrink-0 p-3 border-b border-t-border">
        <div className="rounded-2xl bg-white dark:bg-white/[0.04] border border-[#E2E8F0] dark:border-white/10 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-[#F1F5F9] dark:divide-white/[0.07]">

          {/* Placa + Entrada + Veículo + Status */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[20px] font-black text-[#0F172A] dark:text-white tracking-[0.12em] leading-none">
                {v.plate}
              </span>
              <div className="text-right flex-shrink-0">
                <p className="text-[8px] text-t-muted uppercase tracking-widest leading-none mb-0.5">Entrada</p>
                <p className="text-[12px] font-bold text-t-text tabular-nums leading-none">{v.entryTime}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-t-secondary leading-none">
                {v.brand} {v.model}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-[3px] rounded-full flex-shrink-0"
                style={{ backgroundColor: sc.bg, color: sc.color }}
              >
                <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: sc.accent }} />
                {sc.label}
              </span>
            </div>
          </div>

          {/* Cliente */}
          <div className="px-4 py-2.5">
            <p className="text-[8px] font-extrabold text-t-muted uppercase tracking-[0.08em] mb-1">Cliente</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] font-bold text-t-text">{v.customer.name}</span>
              <span className="text-t-border select-none">·</span>
              <a
                href={`tel:${v.customer.phone}`}
                className="text-[10px] text-t-muted hover:text-accent transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {v.customer.phone}
              </a>
              <a
                href={`https://wa.me/55${v.customer.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle size={11} />
              </a>
            </div>
          </div>

          {/* Serviço */}
          <div className="px-4 py-2.5">
            <p className="text-[8px] font-extrabold text-t-muted uppercase tracking-[0.08em] mb-1">Serviço</p>
            <p className="text-[12px] font-semibold text-t-text leading-snug">{v.service}</p>
          </div>

          {/* Valor + Próxima ação */}
          <div className="px-4 py-2.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-extrabold text-t-muted uppercase tracking-[0.08em] mb-0.5">Valor</p>
              {v.estimatedValue !== undefined ? (
                <p className="text-[14px] font-black text-t-text tabular-nums leading-none">
                  {fmt.format(v.estimatedValue)}
                </p>
              ) : (
                <p className="text-[11px] italic text-t-muted leading-none">A definir</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[8px] font-extrabold text-t-muted uppercase tracking-[0.08em] mb-0.5">Próxima ação</p>
              <p className="text-[11px] font-bold text-t-text leading-tight">{v.nextAction}</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Timeline ───────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-t-border">
        <ServiceTimeline currentStage={v.currentStage} status={v.status} />
      </div>

      {/* ── Tabs ──────────────────────────────── */}
      <div className="flex-shrink-0 flex border-b border-t-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 py-2 text-[10px] font-semibold transition-colors border-b-2',
              activeTab === key
                ? 'border-gray-900 text-t-text dark:border-white'
                : 'border-transparent text-t-muted hover:text-t-secondary',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content — scrolls independently ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {activeTab === 'resumo'    && <ResumoTab    vehicle={v} />}
        {activeTab === 'cliente'   && <ClienteTab   vehicle={v} />}
        {activeTab === 'veiculo'   && <VeiculoTab   vehicle={v} />}
        {activeTab === 'historico' && <HistoricoTab vehicle={v} />}
      </div>

      {/* ── Actions — fixed at panel bottom ────── */}
      <div className="flex-shrink-0 border-t border-t-border px-4 py-3 bg-t-card">
        <div className="relative">
          {/* WhatsApp — primary, full width */}
          <button
            onClick={() => setShowWaMenu((s) => !s)}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold transition-colors mb-2"
          >
            <MessageCircle size={14} />
            Enviar mensagem WhatsApp
          </button>

          {/* Secondary actions — 4-col grid */}
          <div className="grid grid-cols-4 gap-1.5">
            <PanelActionBtn icon={<FileText size={13} />} label="Orçamento" />
            <PanelActionBtn icon={<Camera size={13} />}   label="Fotos" />
            <PanelActionBtn icon={<History size={13} />}  label="Histórico" />
            <PanelActionBtn icon={<Wrench size={13} />}   label="Abrir OS" />
          </div>

          {/* WhatsApp message menu */}
          {showWaMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-t-card border border-t-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden z-20 animate-slide-up">
              <div className="px-4 py-2.5 border-b border-t-border bg-t-surface">
                <p className="text-[11px] font-bold text-t-text">Mensagem rápida</p>
                <p className="text-[10px] text-t-muted">Abre o WhatsApp com o texto pronto</p>
              </div>
              {messages.map((msg, i) => (
                <a
                  key={i}
                  href={buildWaUrl(v.customer.phone, msg.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowWaMenu(false)}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-t-card-hover transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle size={9} className="text-green-700 dark:text-green-400" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-t-text">{msg.label}</p>
                    <p className="text-[10px] text-t-muted line-clamp-1">{msg.text.slice(0, 58)}…</p>
                  </div>
                </a>
              ))}
              <button
                onClick={() => setShowWaMenu(false)}
                className="w-full px-4 py-2 text-[10px] text-t-muted hover:text-t-secondary transition-colors border-t border-t-border text-center"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PanelActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 h-[46px] rounded-xl bg-t-surface border border-t-border text-t-muted hover:text-t-secondary hover:bg-t-card-hover text-[9px] font-semibold transition-colors">
      {icon}
      {label}
    </button>
  )
}

// ─── Service Timeline — compacta ─────────────────────────────────────────────

function ServiceTimeline({ currentStage, status }: { currentStage: TimelineStage; status: PatioStatus }) {
  const currentIndex = TIMELINE_STAGES.findIndex((s) => s.key === currentStage)
  const total      = TIMELINE_STAGES.length
  const stageLabel = TIMELINE_STAGES[currentIndex]?.label ?? '—'
  const nextStage  = TIMELINE_STAGES[currentIndex + 1] ?? null
  const doneCount  = currentIndex + 1
  const isOverdue  = status === 'ATRASADO'

  return (
    <div className="rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/10 px-3 py-2 space-y-1.5">

      {/* Header: etapa · count + badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[12px] font-bold text-t-text leading-none">{stageLabel}</span>
          <span className="text-[9px] text-t-muted whitespace-nowrap">{doneCount}/{total} etapas</span>
        </div>
        {isOverdue && (
          <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800/40 dark:text-red-400 flex-shrink-0 whitespace-nowrap">
            <AlertTriangle size={7} />
            Atrasado
          </span>
        )}
      </div>

      {/* Barra com bolinhas */}
      <div className="relative flex items-center justify-between py-0.5">
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="h-[1.5px] w-full bg-[#E2E8F0] dark:bg-white/10" />
        </div>
        {currentIndex > 0 && (
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div
              className="h-[1.5px] bg-slate-600 dark:bg-slate-300 transition-all duration-500"
              style={{ width: `${(currentIndex / (total - 1)) * 100}%` }}
            />
          </div>
        )}
        {TIMELINE_STAGES.map((stage, i) => {
          const isPast    = i < currentIndex
          const isCurrent = i === currentIndex
          return (
            <div key={stage.key} className="relative z-10" title={stage.label}>
              <div className={cn(
                'rounded-full border-[1.5px] transition-all duration-200',
                isCurrent
                  ? 'w-3 h-3 bg-slate-800 border-slate-800 shadow-[0_0_0_2px_rgba(15,23,42,0.14)] dark:bg-white dark:border-white'
                  : isPast
                  ? 'w-2.5 h-2.5 bg-slate-500 border-slate-500 dark:bg-slate-300 dark:border-slate-300'
                  : 'w-2.5 h-2.5 bg-white border-[#CBD5E1] dark:bg-t-card dark:border-white/20',
              )} />
            </div>
          )
        })}
      </div>

      {/* Próxima etapa ou concluído */}
      {nextStage ? (
        <p className="text-[9px] text-t-muted leading-none">
          Próxima: <span className="font-semibold text-t-secondary">{nextStage.label}</span>
        </p>
      ) : (
        <div className="flex items-center gap-1">
          <CheckCircle2 size={9} className="text-green-600" />
          <p className="text-[9px] font-semibold text-green-700 dark:text-green-400 leading-none">
            Processo concluído
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Resumo ──────────────────────────────────────────────────────────────

function ResumoTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  const hasDetails = !!(v.diagnosis || v.mechanic)
  return (
    <>
      {hasDetails && (
        <InfoBlock title="Detalhes do atendimento">
          {v.diagnosis && <InfoRow label="Diagnóstico" value={v.diagnosis} />}
          {v.mechanic  && <InfoRow label="Mecânico"    value={v.mechanic} />}
        </InfoBlock>
      )}
      {v.history && (
        <div className="rounded-xl border border-t-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-t-surface border-b border-t-border">
            <p className="text-[8px] font-extrabold text-t-muted uppercase tracking-[0.1em]">Última visita</p>
            <span className="text-[10px] font-bold text-t-secondary tabular-nums ml-auto">{v.history.lastVisit}</span>
          </div>
          <div className="px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-semibold text-t-text leading-snug">{v.history.lastService}</p>
            {v.history.lastMileage && (
              <p className="text-[10px] text-t-muted">{v.history.lastMileage.toLocaleString('pt-BR')} km na visita</p>
            )}
            {v.history.nextRecommendation && (
              <div className="mt-2 pt-2 border-t border-t-border">
                <p className="text-[8px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-[0.08em] mb-1">
                  Próxima recomendação
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-snug">
                  {v.history.nextRecommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Tab: Cliente ─────────────────────────────────────────────────────────────

function ClienteTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  const phone = v.customer.phone.replace(/\D/g, '')
  return (
    <>
      <InfoBlock title="Contato">
        <InfoRow label="Nome"     value={v.customer.name} />
        <InfoRow label="WhatsApp" value={v.customer.phone} />
      </InfoBlock>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/55${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold transition-colors"
        >
          <MessageCircle size={13} />
          WhatsApp
        </a>
        <a
          href={`tel:${v.customer.phone}`}
          className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-t-surface border border-t-border text-t-secondary hover:text-t-text text-[11px] font-semibold transition-colors hover:bg-t-card-hover"
        >
          <Phone size={13} />
          Ligar
        </a>
      </div>
    </>
  )
}

// ─── Tab: Veículo ─────────────────────────────────────────────────────────────

function VeiculoTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  return (
    <InfoBlock title="Dados do veículo">
      <InfoRow label="Marca"  value={v.brand} />
      <InfoRow label="Modelo" value={v.model} />
      <InfoRow label="Ano"    value={String(v.year)} />
      <InfoRow label="Placa"  value={v.plate} mono />
      {v.mileage && (
        <InfoRow label="KM atual" value={`${v.mileage.toLocaleString('pt-BR')} km`} />
      )}
    </InfoBlock>
  )
}

// ─── Tab: Histórico ───────────────────────────────────────────────────────────

function HistoricoTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  if (!v.history) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-t-muted">
        <div className="w-10 h-10 rounded-full bg-t-surface border border-t-border flex items-center justify-center mb-2">
          <History size={16} className="opacity-30" />
        </div>
        <p className="text-[11px] font-semibold text-t-secondary">Sem histórico anterior</p>
        <p className="text-[10px] mt-0.5">Primeiro atendimento registrado.</p>
      </div>
    )
  }
  return (
    <>
      <InfoBlock title="Último atendimento">
        <InfoRow label="Data"    value={v.history.lastVisit} />
        <InfoRow label="Serviço" value={v.history.lastService} />
        <InfoRow label="KM"      value={`${v.history.lastMileage.toLocaleString('pt-BR')} km`} />
      </InfoBlock>
      {v.history.nextRecommendation && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40">
          <p className="text-[8px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-[0.1em] mb-1">
            Recomendação
          </p>
          <p className="text-[11px] text-amber-900 dark:text-amber-300 font-semibold leading-snug">
            {v.history.nextRecommendation}
          </p>
        </div>
      )}
    </>
  )
}

// ─── Info Block / Row ─────────────────────────────────────────────────────────

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[8px] font-extrabold text-t-muted uppercase tracking-[0.1em] mb-1.5">{title}</p>
      <div className="bg-t-surface rounded-xl border border-t-border overflow-hidden divide-y divide-t-border">
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono = false, highlight = false }: {
  label: string; value: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between px-3 py-1.5 gap-3">
      <span className="text-[10px] text-t-muted flex-shrink-0 pt-[1px]">{label}</span>
      <span className={cn(
        'text-right text-[11px] font-semibold text-t-text min-w-0 leading-snug',
        mono      ? 'font-mono tracking-wide'                              : '',
        highlight ? 'font-black text-green-700 dark:text-green-400 text-[12px]' : '',
      )}>
        {value}
      </span>
    </div>
  )
}

// ─── New Vehicle Modal ────────────────────────────────────────────────────────

function NewVehicleModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (form: NewVehicleForm) => void
}) {
  const [form, setForm] = useState<NewVehicleForm>({
    plate: '', customerName: '', whatsapp: '', model: '', service: '', entryTime: '', notes: '',
  })

  const set = (field: keyof NewVehicleForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.plate || !form.customerName || !form.model) return
    onSave(form)
  }

  const isValid = form.plate.trim() && form.customerName.trim() && form.model.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-t-card rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-t-border overflow-hidden animate-slide-up">

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-t-border">
          <div>
            <h2 className="text-[14px] font-bold text-t-text">Novo veículo</h2>
            <p className="text-[10px] text-t-muted mt-0.5">Cadastro rápido — complemente depois.</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-surface transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <ModalInput label="Placa *" placeholder="ABC-1D23" value={form.plate} onChange={set('plate')} />
            <ModalInput label="Horário" placeholder="09:30" value={form.entryTime} onChange={set('entryTime')} type="time" />
          </div>
          <ModalInput label="Nome do cliente *" placeholder="João Silva" value={form.customerName} onChange={set('customerName')} />
          <ModalInput label="WhatsApp" placeholder="11 99999-0000" value={form.whatsapp} onChange={set('whatsapp')} type="tel" />
          <ModalInput label="Modelo do veículo *" placeholder="Honda Civic 2018" value={form.model} onChange={set('model')} />
          <ModalInput label="Serviço solicitado" placeholder="Troca de óleo, revisão..." value={form.service} onChange={set('service')} />

          <div>
            <label className="block text-[10px] font-semibold text-t-secondary mb-1">Observação rápida</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="Alguma observação importante..."
              rows={2}
              className={cn(
                'w-full rounded-xl border border-t-border bg-t-surface',
                'text-[11px] text-t-text placeholder:text-t-muted',
                'px-3 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all',
              )}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-xl border border-t-border text-t-secondary hover:text-t-text text-[11px] font-semibold transition-colors hover:bg-t-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 h-9 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-card"
            >
              Adicionar ao pátio
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalInput({ label, placeholder, value, onChange, type = 'text' }: {
  label: string; placeholder: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-t-secondary mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          'w-full h-8 rounded-xl border border-t-border bg-t-surface',
          'text-[11px] text-t-text placeholder:text-t-muted',
          'px-3 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all',
        )}
      />
    </div>
  )
}
