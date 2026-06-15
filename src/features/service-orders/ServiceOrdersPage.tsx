import { useState, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import {
  Plus, Search, X, MessageCircle,
  LayoutGrid, List, AlignJustify,
  Car, User, Wrench, ArrowRight,
  FileText, Paperclip, MessageSquare, CheckCircle2,
} from 'lucide-react'
import { mockServiceOrders } from '../../mocks/service-orders'
import { mockMechanics } from '../../mocks/mechanics'
import { cn } from '../../lib/utils'
import type { ServiceOrder, ServiceOrderStatus, ServiceOrderPriority, Mechanic } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type OsEtapa =
  | 'recebido' | 'diagnostico' | 'orcamento' | 'ag_aprovacao'
  | 'aprovado'  | 'em_servico'  | 'pronto'    | 'entregue'

type ViewMode = 'esteira' | 'kanban' | 'lista'

interface NewOsForm {
  plate: string; customerName: string; phone: string
  vehicle: string; service: string; km: string; notes: string; mechanic: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ETAPAS: Array<{ key: OsEtapa; label: string; statuses: ServiceOrderStatus[] }> = [
  { key: 'recebido',    label: 'Recebido',      statuses: ['AGENDADO'] },
  { key: 'diagnostico', label: 'Diagnóstico',   statuses: ['EM_ANALISE'] },
  { key: 'orcamento',   label: 'Orçamento',     statuses: [] },
  { key: 'ag_aprovacao',label: 'Ag. Aprovação', statuses: ['AGUARDANDO_APROVACAO'] },
  { key: 'aprovado',    label: 'Aprovado',      statuses: [] },
  { key: 'em_servico',  label: 'Em serviço',    statuses: ['EM_ANDAMENTO'] },
  { key: 'pronto',      label: 'Pronto',        statuses: ['CONCLUIDO'] },
  { key: 'entregue',    label: 'Entregue',      statuses: ['ENTREGUE'] },
]

const NEXT_ACTION: Record<OsEtapa, string> = {
  recebido:    'Iniciar diagnóstico',
  diagnostico: 'Gerar orçamento',
  orcamento:   'Enviar ao cliente',
  ag_aprovacao:'Aguardar aprovação',
  aprovado:    'Iniciar serviço',
  em_servico:  'Concluir serviço',
  pronto:      'Avisar cliente',
  entregue:    'OS finalizada',
}

const ADVANCE_STATUS: Partial<Record<OsEtapa, ServiceOrderStatus>> = {
  recebido:    'EM_ANALISE',
  diagnostico: 'AGUARDANDO_APROVACAO',
  ag_aprovacao:'EM_ANDAMENTO',
  em_servico:  'CONCLUIDO',
  pronto:      'ENTREGUE',
}

const ADVANCE_LABEL: Partial<Record<OsEtapa, string>> = {
  recebido:    'Iniciar diagnóstico',
  diagnostico: 'Enviar orçamento',
  ag_aprovacao:'Aprovar e iniciar',
  em_servico:  'Marcar como pronto',
  pronto:      'Marcar como entregue',
}

const PHONE_MAP: Record<string, string> = {
  c1: '11 99999-0001', c2: '11 99999-0002', c3: '11 99999-0003',
  c4: '11 99999-0004', c5: '11 99999-0005', c6: '11 99999-0006',
}

const PRIORITY_BADGE: Record<ServiceOrderPriority, { label: string; color: string; bg: string }> = {
  BAIXA:   { label: 'Normal',  color: '#6B7280', bg: '#F3F4F6' },
  MEDIA:   { label: 'Normal',  color: '#6B7280', bg: '#F3F4F6' },
  ALTA:    { label: 'Atenção', color: '#B45309', bg: '#FEF9C3' },
  URGENTE: { label: 'Urgente', color: '#DC2626', bg: '#FEF2F2' },
}

const ETAPA_COLOR: Record<OsEtapa, string> = {
  recebido:    '#9CA3AF', diagnostico: '#60A5FA', orcamento:   '#FBBF24',
  ag_aprovacao:'#F97316', aprovado:    '#8B5CF6', em_servico:  '#3B82F6',
  pronto:      '#22C55E', entregue:    '#D1D5DB',
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEtapa(status: ServiceOrderStatus): OsEtapa {
  return ETAPAS.find((e) => e.statuses.includes(status))?.key ?? 'recebido'
}

function buildWaMessage(os: ServiceOrder, etapa: OsEtapa): string {
  const valor = os.estimatedValue > 0 ? fmt.format(os.estimatedValue) : 'a definir'
  if (etapa === 'ag_aprovacao')
    return `Olá ${os.customerName}! Concluímos o diagnóstico do seu ${os.vehicle}. O orçamento é de ${valor}. Podemos prosseguir com o reparo?`
  if (etapa === 'pronto')
    return `Olá ${os.customerName}! Seu veículo ${os.vehicle} (${os.plate}) está pronto para retirada. Aguardamos você! ✅`
  return `Olá ${os.customerName}! Temos uma atualização sobre seu ${os.vehicle} (${os.plate}) na GaragePro. 🔧`
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ServiceOrdersPage() {
  const [orders, setOrders]           = useState<ServiceOrder[]>(mockServiceOrders)
  const [view, setView]               = useState<ViewMode>('esteira')
  const [selectedEtapa, setSelectedEtapa] = useState<OsEtapa | 'todos'>('todos')
  const [selectedOsId, setSelectedOsId]   = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [showModal, setShowModal]     = useState(false)

  const filtered = useMemo(() => orders.filter((o) => {
    if (o.status === 'CANCELADO') return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.plate.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.number.includes(q) ||
      o.vehicle.toLowerCase().includes(q)
    )
  }), [orders, search])

  const counts = useMemo<Partial<Record<OsEtapa, number>>>(() => {
    const r: Partial<Record<OsEtapa, number>> = {}
    for (const e of ETAPAS) r[e.key] = filtered.filter((o) => getEtapa(o.status) === e.key).length
    return r
  }, [filtered])

  const selectedOs = orders.find((o) => o.id === selectedOsId) ?? null

  const handleAdvanceStage = (osId: string) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== osId) return o
      const newStatus = ADVANCE_STATUS[getEtapa(o.status)]
      if (!newStatus) return o
      const entry = { status: newStatus, changedAt: new Date().toISOString(), changedBy: 'Usuário' }
      return { ...o, status: newStatus, statusHistory: [...o.statusHistory, entry] }
    }))
  }

  const handleAddOs = (form: NewOsForm) => {
    const found = mockMechanics.find((m) =>
      m.name.toLowerCase().startsWith(form.mechanic.toLowerCase()),
    )
    const mechanic: Mechanic = found ?? {
      id: 'm_new', name: form.mechanic || 'A definir',
      initials: form.mechanic ? form.mechanic.slice(0, 2).toUpperCase() : 'AD',
    }
    const newOs: ServiceOrder = {
      id: `os_${Date.now()}`,
      number: `2026-${String(orders.length + 1).padStart(5, '0')}`,
      status: 'AGENDADO', priority: 'MEDIA', type: 'REVISAO',
      customerId: `c_new`, customerName: form.customerName,
      vehicleId:  `v_new`, vehicle: form.vehicle,
      plate: form.plate.toUpperCase(),
      mechanicId: mechanic.id, mechanic,
      estimatedValue: 0,
      entryDate: new Date().toISOString().slice(0, 10),
      description: form.service || 'Serviço a definir',
      symptoms: form.notes || undefined,
      partsCount: 0, commentsCount: 0, attachmentsCount: 0,
      parts: [], services: [],
      statusHistory: [{ status: 'AGENDADO', changedAt: new Date().toISOString(), changedBy: 'Recepção' }],
    }
    setOrders((prev) => [newOs, ...prev])
    setShowModal(false)
  }

  const openCount   = filtered.filter((o) => o.status !== 'ENTREGUE').length
  const urgentCount = filtered.filter((o) => o.priority === 'URGENTE' || o.priority === 'ALTA').length
  const agAprovCount= filtered.filter((o) => o.status === 'AGUARDANDO_APROVACAO').length
  const prontoCount = filtered.filter((o) => o.status === 'CONCLUIDO').length

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-t-border bg-t-topbar">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[15px] font-bold text-t-text leading-tight tracking-tight">
              Ordens de Serviço
            </h1>
            <p className="text-[10px] text-t-muted mt-0.5">
              Diagnóstico, orçamento, execução e entrega.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center bg-t-surface border border-t-border rounded-lg p-[3px] gap-[2px]">
              {([
                { key: 'esteira' as const, label: 'Esteira', Icon: AlignJustify },
                { key: 'kanban'  as const, label: 'Kanban',  Icon: LayoutGrid },
                { key: 'lista'   as const, label: 'Lista',   Icon: List },
              ]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 h-6 rounded-md text-[10px] font-semibold transition-all',
                    view === key
                      ? 'bg-white dark:bg-white/10 text-t-text shadow-sm'
                      : 'text-t-muted hover:text-t-secondary',
                  )}
                >
                  <Icon size={10} />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[11px] font-semibold transition-colors shadow-sm"
            >
              <Plus size={12} strokeWidth={2.5} />
              Nova OS
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search size={11} className="absolute left-2.5 text-t-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Placa, cliente ou nº da OS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-52 bg-t-surface border border-t-border rounded-lg text-[11px] text-t-text placeholder:text-t-muted pl-7 pr-6 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 text-t-muted hover:text-t-secondary">
                <X size={10} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-t-muted">
            <span className="font-semibold text-t-text">{openCount}</span> abertas
            {urgentCount > 0 && (
              <> · <span className="font-semibold text-orange-600">{urgentCount}</span> precisam de atenção</>
            )}
            {agAprovCount > 0 && (
              <> · <span className="font-semibold text-blue-700 dark:text-blue-400">{agAprovCount}</span> ag. aprovação</>
            )}
            {prontoCount > 0 && (
              <> · <span className="font-semibold text-green-700 dark:text-green-500">{prontoCount}</span>{' '}
              {prontoCount === 1 ? 'pronta' : 'prontas'} para entrega</>
            )}
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {view === 'esteira' && (
          <EsteiraView
            orders={filtered}
            counts={counts}
            selectedEtapa={selectedEtapa}
            onSelectEtapa={setSelectedEtapa}
            onSelectOs={setSelectedOsId}
            onAdvanceStage={handleAdvanceStage}
          />
        )}
        {view === 'kanban' && (
          <KanbanView
            orders={filtered}
            onSelectOs={setSelectedOsId}
            onAdvanceStage={handleAdvanceStage}
          />
        )}
        {view === 'lista' && (
          <ListaView orders={filtered} onSelectOs={setSelectedOsId} />
        )}
      </div>

      {selectedOsId && selectedOs && (
        <OsDrawer
          os={selectedOs}
          etapa={getEtapa(selectedOs.status)}
          onClose={() => setSelectedOsId(null)}
          onAdvanceStage={() => { handleAdvanceStage(selectedOs.id); setSelectedOsId(null) }}
        />
      )}

      {showModal && (
        <NovaOsModal onClose={() => setShowModal(false)} onSave={handleAddOs} />
      )}
    </div>
  )
}

// ─── Esteira View ─────────────────────────────────────────────────────────────

function EsteiraView({
  orders, counts, selectedEtapa, onSelectEtapa, onSelectOs, onAdvanceStage,
}: {
  orders: ServiceOrder[]
  counts: Partial<Record<OsEtapa, number>>
  selectedEtapa: OsEtapa | 'todos'
  onSelectEtapa: (e: OsEtapa | 'todos') => void
  onSelectOs: (id: string) => void
  onAdvanceStage: (id: string) => void
}) {
  const visible = selectedEtapa === 'todos'
    ? orders
    : orders.filter((o) => getEtapa(o.status) === selectedEtapa)

  return (
    <div className="flex flex-col h-full">
      {/* Stage pill bar */}
      <div className="flex-shrink-0 px-5 py-2.5 border-b border-t-border bg-t-topbar overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => onSelectEtapa('todos')}
            className={cn(
              'flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-semibold transition-all border whitespace-nowrap',
              selectedEtapa === 'todos'
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                : 'bg-t-card text-t-secondary border-t-border hover:text-t-text',
            )}
          >
            Todas
            <span className={cn(
              'text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none',
              selectedEtapa === 'todos'
                ? 'bg-white/20 dark:bg-black/20'
                : 'bg-t-surface border border-t-border text-t-muted',
            )}>
              {orders.length}
            </span>
          </button>

          <span className="w-px h-4 bg-t-border mx-0.5 flex-shrink-0" />

          {ETAPAS.map((etapa) => {
            const count = counts[etapa.key] ?? 0
            const isActive = selectedEtapa === etapa.key
            return (
              <button
                key={etapa.key}
                onClick={() => onSelectEtapa(etapa.key)}
                disabled={count === 0 && !isActive}
                className={cn(
                  'flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-semibold transition-all border whitespace-nowrap',
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900'
                    : count > 0
                    ? 'bg-t-card text-t-secondary border-t-border hover:text-t-text'
                    : 'bg-t-card text-t-muted border-t-border opacity-40 cursor-default',
                )}
              >
                {etapa.label}
                <span className={cn(
                  'text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none',
                  isActive
                    ? 'bg-white/20 dark:bg-black/20'
                    : 'bg-t-surface border border-t-border text-t-muted',
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 max-w-3xl">
            {visible.map((os) => (
              <OsCard
                key={os.id}
                os={os}
                etapa={getEtapa(os.status)}
                onOpen={() => onSelectOs(os.id)}
                onAdvance={() => onAdvanceStage(os.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 rounded-full bg-t-surface border border-t-border flex items-center justify-center mb-3">
              <FileText size={16} className="text-t-muted opacity-40" />
            </div>
            <p className="text-[12px] font-semibold text-t-secondary">Nenhuma OS nesta etapa</p>
            <p className="text-[10px] text-t-muted mt-0.5">Selecione outra etapa ou ajuste a busca</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── OS Card (Esteira) ────────────────────────────────────────────────────────

function OsCard({
  os, etapa, onOpen, onAdvance,
}: {
  os: ServiceOrder; etapa: OsEtapa; onOpen: () => void; onAdvance: () => void
}) {
  const badge      = PRIORITY_BADGE[os.priority]
  const phone      = PHONE_MAP[os.customerId] ?? ''
  const waMsg      = buildWaMessage(os, etapa)
  const waUrl      = phone
    ? `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
    : '#'
  const nextAction  = NEXT_ACTION[etapa]
  const advLabel    = ADVANCE_LABEL[etapa]
  const canAdvance  = !!ADVANCE_STATUS[etapa]
  const dateShort   = os.entryDate.slice(5).replace('-', '/')

  return (
    <div className="relative bg-white dark:bg-t-card rounded-2xl border border-t-border overflow-hidden hover:border-gray-200 dark:hover:border-white/20 transition-all shadow-sm hover:shadow-card">
      {/* Left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: ETAPA_COLOR[etapa] }}
      />

      <div className="pl-4 pr-4 py-3 space-y-2">
        {/* Row 1: OS# + Plate + Vehicle + Badge + Date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[9px] text-t-muted flex-shrink-0">#{os.number}</span>
            <span className="w-px h-3 bg-t-border flex-shrink-0" />
            <span className="font-mono text-[13px] font-extrabold text-t-text tracking-[0.06em] flex-shrink-0">
              {os.plate}
            </span>
            <span className="text-[11px] text-t-secondary truncate">{os.vehicle}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <span className="text-[10px] text-t-muted tabular-nums">{dateShort}</span>
          </div>
        </div>

        {/* Row 2: Client + Phone */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <User size={10} className="text-t-muted flex-shrink-0" />
          <span className="text-[11px] font-semibold text-t-text">{os.customerName}</span>
          {phone && (
            <>
              <span className="text-t-border select-none">·</span>
              <span className="text-[10px] text-t-muted">{phone}</span>
            </>
          )}
        </div>

        {/* Row 3: Service + Mechanic */}
        <div className="flex items-start gap-2">
          <Wrench size={10} className="text-t-muted flex-shrink-0 mt-[1px]" />
          <p className="flex-1 text-[11px] font-medium text-t-secondary leading-snug line-clamp-1 min-w-0">
            {os.description}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <span className="text-[8px] font-extrabold text-blue-700 dark:text-blue-300 leading-none">
                {os.mechanic.initials}
              </span>
            </div>
            <span className="text-[10px] text-t-muted">{os.mechanic.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* Row 4: Next action + Value + Counts */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <ArrowRight size={9} className="text-t-muted flex-shrink-0" />
            <span className="text-[10px] text-t-muted truncate">
              <span className="font-semibold text-t-secondary">{nextAction}</span>
            </span>
          </div>
          {os.estimatedValue > 0 && (
            <span className="text-[12px] font-black text-t-text tabular-nums flex-shrink-0">
              {fmt.format(os.estimatedValue)}
            </span>
          )}
          {(os.attachmentsCount > 0 || os.commentsCount > 0) && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {os.attachmentsCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-t-muted">
                  <Paperclip size={8} />{os.attachmentsCount}
                </span>
              )}
              {os.commentsCount > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-t-muted">
                  <MessageSquare size={8} />{os.commentsCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Row 5: Actions */}
        <div className="flex items-center gap-1.5 pt-0.5 border-t border-t-border">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold hover:bg-green-100 transition-colors dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
          >
            <MessageCircle size={10} />
            WhatsApp
          </a>
          <button
            onClick={onOpen}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-t-surface border border-t-border text-t-secondary text-[10px] font-semibold hover:text-t-text transition-colors"
          >
            <FileText size={10} />
            Ver OS
          </button>
          {canAdvance && advLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdvance() }}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-t-surface border border-t-border text-t-secondary text-[10px] font-semibold hover:text-accent hover:border-accent/30 hover:bg-orange-50 dark:hover:bg-accent/[0.08] transition-colors ml-auto"
            >
              {advLabel}
              <ArrowRight size={9} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({
  orders, onSelectOs, onAdvanceStage,
}: {
  orders: ServiceOrder[]
  onSelectOs: (id: string) => void
  onAdvanceStage: (id: string) => void
}) {
  return (
    <div className="h-full overflow-x-auto">
      <div className="flex h-full gap-3 px-5 py-4 min-w-max">
        {ETAPAS.map((etapa) => {
          const col = orders.filter((o) => getEtapa(o.status) === etapa.key)
          return (
            <div key={etapa.key} className="w-[240px] flex flex-col flex-shrink-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ETAPA_COLOR[etapa.key] }}
                />
                <h3 className="text-[11px] font-bold text-t-secondary leading-none flex-1">{etapa.label}</h3>
                <span className="text-[9px] font-bold text-t-muted bg-t-surface border border-t-border rounded-full px-1.5 py-0.5 leading-none">
                  {col.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {col.map((os) => (
                  <OsKanbanCard
                    key={os.id}
                    os={os}
                    etapa={etapa.key}
                    onClick={() => onSelectOs(os.id)}
                  />
                ))}
                {col.length === 0 && (
                  <div className="h-16 rounded-xl border border-dashed border-t-border flex items-center justify-center">
                    <p className="text-[9px] text-t-muted">Sem OS</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── OS Kanban Card (compact) ─────────────────────────────────────────────────

function OsKanbanCard({ os, etapa, onClick }: { os: ServiceOrder; etapa: OsEtapa; onClick: () => void }) {
  const badge = PRIORITY_BADGE[os.priority]
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-t-card rounded-xl border border-t-border p-3 cursor-pointer hover:border-gray-200 dark:hover:border-white/20 transition-colors space-y-1.5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-[12px] font-extrabold text-t-text tracking-[0.06em]">{os.plate}</span>
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>
      <p className="text-[10px] font-medium text-t-secondary leading-tight">{os.vehicle}</p>
      <p className="text-[10px] text-t-muted leading-tight line-clamp-1">{os.customerName}</p>
      <p className="text-[9px] text-t-muted leading-tight line-clamp-1">{os.description}</p>
      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-t-border">
        {os.estimatedValue > 0 ? (
          <span className="text-[10px] font-bold text-t-text tabular-nums">{fmt.format(os.estimatedValue)}</span>
        ) : (
          <span className="text-[9px] italic text-t-muted">A definir</span>
        )}
        <div className="flex items-center gap-1">
          {os.attachmentsCount > 0 && (
            <span className="flex items-center gap-0.5 text-[8px] text-t-muted">
              <Paperclip size={7} />{os.attachmentsCount}
            </span>
          )}
          {os.commentsCount > 0 && (
            <span className="flex items-center gap-0.5 text-[8px] text-t-muted">
              <MessageSquare size={7} />{os.commentsCount}
            </span>
          )}
          <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center ml-0.5">
            <span className="text-[6px] font-extrabold text-blue-700 dark:text-blue-300 leading-none">
              {os.mechanic.initials}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Lista View ───────────────────────────────────────────────────────────────

function ListaView({ orders, onSelectOs }: { orders: ServiceOrder[]; onSelectOs: (id: string) => void }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="rounded-xl border border-t-border bg-t-card overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-t-border bg-t-surface">
              {['OS', 'Placa / Veículo', 'Cliente', 'Serviço', 'Etapa', 'Valor', 'Responsável', 'Entrada', ''].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-2 text-[9px] font-bold text-t-muted uppercase tracking-widest whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-t-border">
            {orders.map((os) => {
              const etapa   = getEtapa(os.status)
              const badge   = PRIORITY_BADGE[os.priority]
              const etapaCfg = ETAPAS.find((e) => e.key === etapa)!
              const dateShort = os.entryDate.slice(5).replace('-', '/')
              return (
                <tr
                  key={os.id}
                  onClick={() => onSelectOs(os.id)}
                  className="hover:bg-t-card-hover transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[9px] text-t-muted">#{os.number}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-[12px] font-extrabold text-t-text tracking-wide">{os.plate}</p>
                    <p className="text-[10px] text-t-muted">{os.vehicle}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-t-text whitespace-nowrap">{os.customerName}</p>
                    {badge.label !== 'Normal' && (
                      <span
                        className="text-[8px] font-bold px-1 py-0.5 rounded-full"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px]">
                    <p className="text-[10px] text-t-secondary line-clamp-1">{os.description}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ETAPA_COLOR[etapa] }}
                      />
                      <span className="text-[10px] font-semibold text-t-secondary whitespace-nowrap">
                        {etapaCfg.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {os.estimatedValue > 0 ? (
                      <span className="text-[11px] font-semibold text-t-text tabular-nums">
                        {fmt.format(os.estimatedValue)}
                      </span>
                    ) : (
                      <span className="text-[9px] italic text-t-muted">A definir</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-[7px] font-extrabold text-blue-700 dark:text-blue-300 leading-none">
                          {os.mechanic.initials}
                        </span>
                      </div>
                      <span className="text-[10px] text-t-secondary whitespace-nowrap">
                        {os.mechanic.name.split(' ')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] text-t-muted tabular-nums">{dateShort}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[10px] text-t-muted hover:text-accent transition-colors">
                      Abrir →
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[12px] text-t-muted">Nenhuma OS encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── OS Drawer ────────────────────────────────────────────────────────────────

function OsDrawer({
  os, etapa, onClose, onAdvanceStage,
}: {
  os: ServiceOrder; etapa: OsEtapa; onClose: () => void; onAdvanceStage: () => void
}) {
  const badge     = PRIORITY_BADGE[os.priority]
  const phone     = PHONE_MAP[os.customerId] ?? ''
  const etapaCfg  = ETAPAS.find((e) => e.key === etapa)!
  const nextAction = NEXT_ACTION[etapa]
  const advLabel   = ADVANCE_LABEL[etapa]
  const canAdvance = !!ADVANCE_STATUS[etapa]
  const waMsg      = buildWaMessage(os, etapa)
  const waUrl      = phone
    ? `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
    : '#'

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      <div
        className="absolute right-0 top-[44px] bottom-0 w-[380px] bg-t-card border-l border-t-border flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between px-4 py-3 border-b border-t-border">
          <div>
            <p className="font-mono text-[9px] text-t-muted mb-0.5">#{os.number}</p>
            <p className="font-mono text-[20px] font-black text-t-text tracking-[0.1em] leading-none">
              {os.plate}
            </p>
            <p className="text-[11px] text-t-secondary mt-0.5">{os.vehicle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-bold px-2 py-1 rounded-full"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-surface transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">

          {/* Customer */}
          <div className="rounded-xl border border-t-border bg-t-surface overflow-hidden divide-y divide-t-border">
            <div className="px-3 py-2.5 flex items-center gap-2">
              <User size={11} className="text-t-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-t-muted">Cliente</p>
                <p className="text-[12px] font-semibold text-t-text">{os.customerName}</p>
              </div>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="text-[10px] text-t-muted hover:text-accent transition-colors flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {phone}
                </a>
              )}
            </div>
            <div className="px-3 py-2.5 flex items-center gap-2">
              <Car size={11} className="text-t-muted flex-shrink-0" />
              <div>
                <p className="text-[9px] text-t-muted">Veículo</p>
                <p className="text-[12px] font-semibold text-t-text">{os.vehicle}</p>
              </div>
            </div>
          </div>

          {/* Service */}
          <div className="rounded-xl border border-t-border bg-t-surface p-3 space-y-2">
            <div>
              <p className="text-[8px] font-bold text-t-muted uppercase tracking-wider mb-0.5">Serviço</p>
              <p className="text-[12px] font-semibold text-t-text leading-snug">{os.description}</p>
            </div>
            {os.symptoms && (
              <div>
                <p className="text-[8px] font-bold text-t-muted uppercase tracking-wider mb-0.5">Sintomas</p>
                <p className="text-[11px] text-t-secondary leading-snug">{os.symptoms}</p>
              </div>
            )}
            {os.diagnosis && (
              <div>
                <p className="text-[8px] font-bold text-t-muted uppercase tracking-wider mb-0.5">Diagnóstico</p>
                <p className="text-[11px] text-t-secondary leading-snug">{os.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Etapa + Value + Next action */}
          <div className="rounded-xl border border-t-border bg-t-surface p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold text-t-muted uppercase tracking-wider mb-1">Etapa atual</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ETAPA_COLOR[etapa] }}
                  />
                  <span className="text-[11px] font-bold text-t-secondary">{etapaCfg.label}</span>
                </div>
              </div>
              {os.estimatedValue > 0 && (
                <div className="text-right">
                  <p className="text-[8px] font-bold text-t-muted uppercase tracking-wider mb-0.5">Valor</p>
                  <p className="text-[16px] font-black text-t-text tabular-nums leading-none">
                    {fmt.format(os.estimatedValue)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-t-border">
              <ArrowRight size={10} className="text-t-muted flex-shrink-0" />
              <p className="text-[10px] text-t-muted">
                Próxima ação:{' '}
                <span className="font-semibold text-t-secondary">{nextAction}</span>
              </p>
            </div>
          </div>

          {/* Mechanic + Date */}
          <div className="rounded-xl border border-t-border bg-t-surface divide-y divide-t-border overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-extrabold text-blue-700 dark:text-blue-300 leading-none">
                  {os.mechanic.initials}
                </span>
              </div>
              <div>
                <p className="text-[9px] text-t-muted">Responsável</p>
                <p className="text-[11px] font-semibold text-t-text">{os.mechanic.name}</p>
              </div>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] text-t-muted">Entrada</p>
                <p className="text-[11px] font-semibold text-t-text">{os.entryDate}</p>
              </div>
              {os.estimatedDelivery && (
                <div className="text-right">
                  <p className="text-[9px] text-t-muted">Prazo</p>
                  <p className="text-[11px] font-semibold text-t-text">{os.estimatedDelivery}</p>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {os.statusHistory.length > 0 && (
            <div>
              <p className="text-[8px] font-bold text-t-muted uppercase tracking-wider mb-1.5">Histórico</p>
              <div className="space-y-1.5">
                {[...os.statusHistory].reverse().map((h, i) => {
                  const label = ETAPAS.find((e) => e.statuses.includes(h.status))?.label ?? h.status
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[9px] text-t-muted tabular-nums whitespace-nowrap flex-shrink-0">
                        {h.changedAt.slice(0, 10)}
                      </span>
                      <span className="text-[9px] font-semibold text-t-secondary">{label}</span>
                      <span className="text-[9px] text-t-muted">{h.changedBy}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-t-border px-4 py-3 space-y-2">
          {canAdvance && advLabel && (
            <button
              onClick={onAdvanceStage}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[12px] font-bold transition-colors"
            >
              {advLabel}
              <ArrowRight size={13} />
            </button>
          )}
          {etapa === 'entregue' && (
            <div className="flex items-center justify-center gap-1.5 h-9">
              <CheckCircle2 size={14} className="text-green-600" />
              <span className="text-[12px] font-semibold text-green-700 dark:text-green-400">
                OS finalizada e entregue
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 h-8 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold transition-colors"
            >
              <MessageCircle size={11} />
              WhatsApp
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 h-8 rounded-xl bg-t-surface border border-t-border text-t-secondary text-[11px] font-semibold hover:bg-t-card-hover transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Nova OS Modal ────────────────────────────────────────────────────────────

function NovaOsModal({ onClose, onSave }: { onClose: () => void; onSave: (form: NewOsForm) => void }) {
  const [form, setForm] = useState<NewOsForm>({
    plate: '', customerName: '', phone: '', vehicle: '',
    service: '', km: '', notes: '', mechanic: '',
  })

  const set = (field: keyof NewOsForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const isValid = form.plate.trim() && form.customerName.trim() && form.vehicle.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-t-card rounded-2xl border border-t-border shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-t-border">
          <div>
            <h2 className="text-[13px] font-bold text-t-text">Nova Ordem de Serviço</h2>
            <p className="text-[10px] text-t-muted mt-0.5">Cadastro rápido — complemente depois.</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-surface transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (isValid) onSave(form) }}
          className="px-5 py-4 space-y-2.5"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <ModalInput label="Placa *" placeholder="ABC-1D23" value={form.plate} onChange={set('plate')} />
            <ModalInput label="Km atual" placeholder="90.000" value={form.km} onChange={set('km')} />
          </div>
          <ModalInput
            label="Veículo *"
            placeholder="Honda Civic 2018"
            value={form.vehicle}
            onChange={set('vehicle')}
          />
          <ModalInput
            label="Nome do cliente *"
            placeholder="João Pereira"
            value={form.customerName}
            onChange={set('customerName')}
          />
          <ModalInput
            label="WhatsApp"
            placeholder="11 99999-0000"
            value={form.phone}
            onChange={set('phone')}
            type="tel"
          />
          <ModalInput
            label="Serviço solicitado"
            placeholder="Troca de óleo, revisão..."
            value={form.service}
            onChange={set('service')}
          />
          <ModalInput
            label="Responsável"
            placeholder="Nome do mecânico"
            value={form.mechanic}
            onChange={set('mechanic')}
          />
          <div>
            <label className="block text-[10px] font-semibold text-t-secondary mb-1">Observação</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="Sintomas, observações importantes..."
              rows={2}
              className="w-full rounded-xl border border-t-border bg-t-surface text-[11px] text-t-text placeholder:text-t-muted px-3 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all"
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
              className="flex-1 h-9 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[11px] font-bold transition-colors disabled:opacity-40 shadow-card"
            >
              Criar OS
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalInput({
  label, placeholder, value, onChange, type = 'text',
}: {
  label: string; placeholder: string; value: string; type?: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-t-secondary mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full h-8 rounded-xl border border-t-border bg-t-surface text-[11px] text-t-text placeholder:text-t-muted px-3 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all"
      />
    </div>
  )
}
