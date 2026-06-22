import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, MessageCircle, Phone, FileText, Camera,
  History, AlertTriangle, CheckCircle2, Wrench,
  ChevronLeft, ChevronRight, X, Clock, Car, User,
  ArrowRight,
} from 'lucide-react'
import {
  mockPatioVehicles, STATUS_CONFIG, TIMELINE_STAGES,
  type PatioVehicle, type PatioStatus, type TimelineStage,
} from '../../mocks/patio'
import { mockMechanics } from '../../mocks/mechanics'
import { cn } from '../../lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

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

type FilterKey = 'todos' | 'atencao' | 'em_servico' | 'prontos'
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos',      label: 'Todos' },
  { key: 'atencao',    label: 'Atenção' },
  { key: 'em_servico', label: 'Em serviço' },
  { key: 'prontos',    label: 'Prontos' },
]

const ATTENTION_STATUSES:   PatioStatus[] = ['ATRASADO', 'AGUARDANDO_APROVACAO']
const IN_PROGRESS_STATUSES: PatioStatus[] = ['ENTROU_HOJE', 'EM_DIAGNOSTICO', 'AGUARDANDO_ORCAMENTO', 'AGUARDANDO_PECA', 'EM_SERVICO']
const READY_STATUSES:       PatioStatus[] = ['PRONTO', 'ENTREGUE']

const NEXT_ACTION_CFG: Record<PatioStatus, { action: string; sub: string; color: string }> = {
  ENTROU_HOJE:          { action: 'Iniciar atendimento',       sub: 'Veículo aguardando triagem',          color: 'var(--text-secondary)' },
  EM_DIAGNOSTICO:       { action: 'Finalizar diagnóstico',     sub: 'Registrar resultado do diagnóstico',  color: 'var(--info)' },
  AGUARDANDO_ORCAMENTO: { action: 'Enviar orçamento',          sub: 'Gerar e enviar para o cliente',       color: 'var(--warning)' },
  AGUARDANDO_APROVACAO: { action: 'Cobrar retorno do cliente', sub: 'Cliente ainda não aprovou',           color: 'var(--warning)' },
  AGUARDANDO_PECA:      { action: 'Verificar pedido de peça',  sub: 'Aguardando entrega do fornecedor',    color: '#7C3AED' },
  EM_SERVICO:           { action: 'Atualizar execução',        sub: 'Serviço em andamento',                color: 'var(--info)' },
  PRONTO:               { action: 'Avisar cliente para retirada', sub: 'Veículo pronto, aguardando cliente', color: 'var(--success)' },
  ENTREGUE:             { action: 'Atendimento concluído',     sub: 'Veículo entregue ao cliente',         color: 'var(--text-muted)' },
  ATRASADO:             { action: 'Ação urgente necessária',   sub: 'Veículo em atraso — contate cliente', color: 'var(--danger)' },
}

const ALERT_LABEL: Partial<Record<PatioStatus, string>> = {
  ATRASADO:             'Atrasado',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
}

const SHOW_WA_STATUSES: PatioStatus[] = ['ATRASADO', 'AGUARDANDO_APROVACAO', 'PRONTO']

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function buildWaUrl(phone: string, text: string) {
  return `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

function getWaMessages(v: PatioVehicle) {
  const val = v.estimatedValue !== undefined ? fmt.format(v.estimatedValue) : 'a combinar'
  return [
    { label: 'Veículo recebido',   text: `Olá ${v.customer.name}! Recebemos seu ${v.brand} ${v.model} (${v.plate}). Em breve avisamos. 🔧` },
    { label: 'Orçamento pronto',   text: `Olá ${v.customer.name}! Orçamento do seu ${v.brand} ${v.model}: ${val}. Podemos prosseguir?` },
    { label: 'Serviço iniciado',   text: `Olá ${v.customer.name}! Seu ${v.brand} ${v.model} está em serviço. Avisamos quando pronto! 👨‍🔧` },
    { label: 'Pronto para retirada', text: `Olá ${v.customer.name}! Seu ${v.brand} ${v.model} (${v.plate}) está pronto! Pode vir buscar. ✅` },
  ]
}

// ── Shared input style ────────────────────────────────────────────────────────

const SI = [
  'w-full h-8 px-3 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[12px]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all',
  'focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)]',
].join(' ')

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3200); return () => clearTimeout(t) }, [onDismiss])
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[12px] font-medium shadow-lg pointer-events-none"
      style={{ backgroundColor: 'var(--success-subtle)', color: 'var(--success)', borderColor: 'var(--success-border)' }}>
      <CheckCircle2 size={13} />{message}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function PatioPage() {
  const [vehicles,      setVehicles]      = useState<PatioVehicle[]>(mockPatioVehicles)
  const [selectedId,    setSelectedId]    = useState<string>(mockPatioVehicles[0].id)
  const [search,        setSearch]        = useState('')
  const [filter,        setFilter]        = useState<FilterKey>('todos')
  const [date,          setDate]          = useState(TODAY)
  const [showModal,     setShowModal]     = useState(false)
  const [toast,         setToast]         = useState<string | null>(null)

  const selected = vehicles.find(v => v.id === selectedId) ?? vehicles[0]

  const filtered = useMemo(() => vehicles.filter(v => {
    if (search) {
      const q = search.toLowerCase().replace(/[-\s]/g, '')
      const plate = v.plate.toLowerCase().replace(/[-\s]/g, '')
      if (!plate.includes(q) && !v.customer.name.toLowerCase().includes(q)) return false
    }
    if (filter === 'atencao')    return ATTENTION_STATUSES.includes(v.status)
    if (filter === 'em_servico') return IN_PROGRESS_STATUSES.includes(v.status)
    if (filter === 'prontos')    return READY_STATUSES.includes(v.status)
    return true
  }), [vehicles, search, filter])

  const attentionGroup  = filtered.filter(v => ATTENTION_STATUSES.includes(v.status))
  const inProgressGroup = filtered.filter(v => IN_PROGRESS_STATUSES.includes(v.status))
  const readyGroup      = filtered.filter(v => READY_STATUSES.includes(v.status))

  const counts = {
    total:     vehicles.filter(v => v.status !== 'ENTREGUE').length,
    attention: vehicles.filter(v => ATTENTION_STATUSES.includes(v.status)).length,
    inService: vehicles.filter(v => IN_PROGRESS_STATUSES.includes(v.status)).length,
    ready:     vehicles.filter(v => v.status === 'PRONTO').length,
  }

  function handleAddVehicle(form: NewEntryForm) {
    const nv: PatioVehicle = {
      id: `pv${Date.now()}`,
      plate: form.plate.toUpperCase().trim(),
      brand: form.model.split(' ')[0] ?? 'Veículo',
      model: form.model.trim(),
      year: new Date().getFullYear(),
      customer: { name: form.customerName.trim(), phone: form.phone.trim() },
      service: [form.serviceType, form.symptom].filter(Boolean).join(' — ') || 'A definir',
      status: 'ENTROU_HOJE',
      nextAction: 'Iniciar diagnóstico',
      mechanic: form.mechanic || undefined,
      entryTime: form.entryTime || new Date().toTimeString().slice(0, 5),
      entryDate: TODAY,
      currentStage: 'recebido',
    }
    setVehicles(p => [nv, ...p])
    setSelectedId(nv.id)
    setShowModal(false)
    setToast(`${nv.plate} adicionado ao pátio${form.createOS ? ' — OS criada!' : '.'}`)
  }

  return (
    <div className="flex h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* ── Left: list ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-[18px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">Pátio</h1>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Acompanhe os veículos em atendimento e as próximas ações.</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded text-[12px] font-semibold text-white"
              style={{ backgroundColor: 'var(--brand)' }}>
              <Plus size={13} strokeWidth={2.5} />Nova entrada
            </button>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date nav */}
            <div className="flex items-center h-7 border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden divide-x divide-[var(--border)]">
              <button onClick={() => setDate(shiftDate(date, -1))} className="w-7 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors h-full">
                <ChevronLeft size={12} />
              </button>
              <button onClick={() => setDate(TODAY)} className="h-full px-3 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors tabular-nums whitespace-nowrap">
                {formatDateLabel(date)}
              </button>
              <button onClick={() => setDate(shiftDate(date, 1))} className="w-7 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors h-full">
                <ChevronRight size={12} />
              </button>
            </div>

            {date !== TODAY && (
              <button onClick={() => setDate(TODAY)} className="h-7 px-2.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Hoje</button>
            )}

            {/* Search */}
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none" />
              <input type="text" placeholder="Buscar placa, cliente ou OS" value={search} onChange={e => setSearch(e.target.value)}
                className="h-7 w-52 pl-7 pr-7 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"><X size={10} /></button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={cn('h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors',
                    filter === f.key ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {[
              { label: 'No pátio',  value: counts.total,     color: 'var(--text-secondary)' },
              { label: 'Atenção',   value: counts.attention,  color: counts.attention > 0 ? 'var(--danger)' : 'var(--text-muted)' },
              { label: 'Em serviço',value: counts.inService,  color: 'var(--info)' },
              { label: 'Prontos',   value: counts.ready,      color: counts.ready > 0 ? 'var(--success)' : 'var(--text-muted)' },
            ].map(c => (
              <div key={c.label} className="flex items-center gap-1.5 h-6 px-2.5 rounded-md border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[13px] font-extrabold tabular-nums leading-none" style={{ color: c.color }}>{c.value}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {attentionGroup.length > 0 && (
            <VehicleSection title="Precisam de atenção" count={attentionGroup.length} accent="var(--danger)" icon={<AlertTriangle size={12} />}>
              {attentionGroup.map(v => (
                <VehicleCard key={v.id} vehicle={v} isSelected={v.id === selectedId} onClick={() => setSelectedId(v.id)} />
              ))}
            </VehicleSection>
          )}
          {inProgressGroup.length > 0 && (
            <VehicleSection title="Em atendimento" count={inProgressGroup.length} accent="var(--info)" icon={<Wrench size={12} />}>
              {inProgressGroup.map(v => (
                <VehicleCard key={v.id} vehicle={v} isSelected={v.id === selectedId} onClick={() => setSelectedId(v.id)} />
              ))}
            </VehicleSection>
          )}
          {readyGroup.length > 0 && (
            <VehicleSection title="Prontos para retirada" count={readyGroup.length} accent="var(--success)" icon={<CheckCircle2 size={12} />}>
              {readyGroup.map(v => (
                <VehicleCard key={v.id} vehicle={v} isSelected={v.id === selectedId} onClick={() => setSelectedId(v.id)} />
              ))}
            </VehicleSection>
          )}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Search size={24} className="text-[var(--text-disabled)]" />
              <p className="text-[13px] font-semibold text-[var(--text-secondary)]">Nenhum veículo encontrado</p>
              <p className="text-[11px] text-[var(--text-muted)]">Ajuste a busca ou os filtros</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Details panel ──────────────────────────────────────────── */}
      {selected && (
        <VehicleDetailsPanel key={selected.id} vehicle={selected} />
      )}

      {/* ── Modal ───────────────────────────────────────────────────── */}
      {showModal && <NewEntryModal onClose={() => setShowModal(false)} onSave={handleAddVehicle} />}

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

// ── VehicleSection ────────────────────────────────────────────────────────────

function VehicleSection({ title, count, accent, icon, children }: {
  title: string; count: number; accent: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        <span style={{ color: accent }}>{icon}</span>
        <h3 className="text-[10px] font-black uppercase tracking-[0.09em]" style={{ color: accent }}>{title}</h3>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border ml-0.5" style={{ color: accent, backgroundColor: `${accent === 'var(--danger)' ? 'var(--danger-subtle)' : accent === 'var(--success)' ? 'var(--success-subtle)' : 'var(--info-subtle)'}`, borderColor: accent === 'var(--danger)' ? 'var(--danger-border)' : accent === 'var(--success)' ? 'var(--success-border)' : 'var(--info-border)' }}>
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

// ── VehicleCard ───────────────────────────────────────────────────────────────

function VehicleCard({ vehicle: v, isSelected, onClick }: {
  vehicle: PatioVehicle; isSelected: boolean; onClick: () => void
}) {
  const sc      = STATUS_CONFIG[v.status]
  const nac     = NEXT_ACTION_CFG[v.status]
  const showWa  = SHOW_WA_STATUSES.includes(v.status)
  const alert   = ALERT_LABEL[v.status]
  const msgs    = getWaMessages(v)
  const msgIdx  = v.status === 'PRONTO' ? 3 : v.status === 'AGUARDANDO_APROVACAO' ? 1 : 0
  const waUrl   = buildWaUrl(v.customer.phone, msgs[msgIdx].text)

  return (
    <div onClick={onClick} className={cn(
      'relative rounded-lg border border-[var(--border)] bg-[var(--surface)] cursor-pointer transition-all',
      isSelected ? 'border-[var(--border-strong)] shadow-md' : 'hover:border-[var(--border-strong)] hover:shadow-sm',
    )}>
      {/* Left status bar */}
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ backgroundColor: sc.accent }} />

      <div className="pl-4 pr-3.5 py-3 space-y-1.5">
        {/* Row 1: plate + model + status + time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-[13px] font-extrabold text-[var(--text-primary)] tracking-[0.08em] flex-shrink-0">{v.plate}</span>
            <span className="text-[11px] text-[var(--text-secondary)] truncate">{v.brand} {v.model}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {alert && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: sc.color, backgroundColor: sc.bg }}>
                {alert}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded leading-none"
              style={{ color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.accent}44` }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: sc.accent }} />
              {sc.label}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{v.entryTime}</span>
          </div>
        </div>

        {/* Row 2: customer + service */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <User size={9} className="text-[var(--text-muted)] flex-shrink-0" />
            <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">{v.customer.name}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <Wrench size={9} className="text-[var(--text-muted)] flex-shrink-0" />
            <span className="text-[11px] text-[var(--text-secondary)] truncate">{v.service}</span>
          </div>
        </div>

        {/* Row 3: mechanic + next action + (conditional) WA */}
        <div className="flex items-center gap-3 min-w-0">
          {v.mechanic ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-extrabold text-white flex-shrink-0"
                style={{ backgroundColor: 'var(--brand)' }}>
                {v.mechanic[0]}
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">{v.mechanic}</span>
            </div>
          ) : (
            <span className="text-[10px] text-[var(--text-disabled)] italic">Sem mecânico</span>
          )}
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <ArrowRight size={9} style={{ color: nac.color }} className="flex-shrink-0" />
            <span className="text-[10px] font-semibold truncate" style={{ color: nac.color }}>{v.nextAction}</span>
          </div>
          {showWa && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 h-6 px-2 rounded border text-[10px] font-semibold flex-shrink-0 transition-colors"
              style={{ color: '#16A34A', backgroundColor: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.25)' }}>
              <MessageCircle size={10} />WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── VehicleDetailsPanel ───────────────────────────────────────────────────────

function VehicleDetailsPanel({ vehicle: v }: { vehicle: PatioVehicle }) {
  const [activeTab, setActiveTab] = useState<'resumo' | 'cliente' | 'veiculo' | 'historico'>('resumo')
  const [showWaMenu, setShowWaMenu] = useState(false)
  const sc   = STATUS_CONFIG[v.status]
  const nac  = NEXT_ACTION_CFG[v.status]
  const msgs = getWaMessages(v)
  const showWa = SHOW_WA_STATUSES.includes(v.status)

  useEffect(() => { setActiveTab('resumo'); setShowWaMenu(false) }, [v.id])

  const TABS = [
    { key: 'resumo' as const,    label: 'Resumo' },
    { key: 'cliente' as const,   label: 'Cliente' },
    { key: 'veiculo' as const,   label: 'Veículo' },
    { key: 'historico' as const, label: 'Histórico' },
  ]

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">

      {/* ── A: Identificação ──────────────────── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="font-mono text-[22px] font-black text-[var(--text-primary)] tracking-[0.1em] leading-none block">{v.plate}</span>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{v.brand} {v.model} · {v.year}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.accent}44` }}>
              <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: sc.accent }} />
              {sc.label}
            </span>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center justify-end gap-1">
              <Clock size={9} />Entrada {v.entryTime}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <User size={11} className="text-[var(--text-muted)] flex-shrink-0" />
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">{v.customer.name}</span>
          <span className="text-[var(--border)] select-none">·</span>
          <a href={`tel:${v.customer.phone}`} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            {v.customer.phone}
          </a>
        </div>
      </div>

      {/* ── B: Próxima ação ───────────────────── */}
      <div className="flex-shrink-0 mx-4 my-3">
        <div className="rounded-lg p-3.5" style={{ backgroundColor: `${sc.bg}`, border: `1px solid ${sc.accent}44` }}>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] mb-1.5" style={{ color: sc.color }}>Próxima ação</p>
          <p className="text-[14px] font-extrabold leading-tight" style={{ color: sc.color }}>{nac.action}</p>
          <p className="text-[10px] mt-0.5" style={{ color: sc.color, opacity: 0.75 }}>{nac.sub}</p>
        </div>
      </div>

      {/* ── C: Resumo da OS ──────────────────── */}
      <div className="flex-shrink-0 mx-4 mb-3 rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)]">Serviço</span>
          <span className="text-[11px] font-semibold text-[var(--text-primary)] text-right max-w-[160px] leading-tight">{v.service}</span>
        </div>
        {v.mechanic && (
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)]">Mecânico</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white" style={{ backgroundColor: 'var(--brand)' }}>{v.mechanic[0]}</div>
              <span className="text-[11px] font-medium text-[var(--text-primary)]">{v.mechanic}</span>
            </div>
          </div>
        )}
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)]">Valor</span>
          {v.estimatedValue !== undefined
            ? <span className="text-[12px] font-extrabold text-[var(--text-primary)] tabular-nums">{fmt.format(v.estimatedValue)}</span>
            : <span className="text-[10px] italic text-[var(--text-muted)]">A definir</span>}
        </div>
      </div>

      {/* ── Timeline ──────────────────────────── */}
      <div className="flex-shrink-0 mx-4 mb-3">
        <ServiceTimeline currentStage={v.currentStage} status={v.status} />
      </div>

      {/* ── D: Tabs ───────────────────────────── */}
      <div className="flex-shrink-0 flex border-y border-[var(--border)]">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn('flex-1 py-2 text-[10px] font-semibold transition-colors relative',
              activeTab === t.key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]')}>
            {t.label}
            {activeTab === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ backgroundColor: 'var(--brand)' }} />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {activeTab === 'resumo'    && <ResumoTab    vehicle={v} />}
        {activeTab === 'cliente'   && <ClienteTab   vehicle={v} />}
        {activeTab === 'veiculo'   && <VeiculoTab   vehicle={v} />}
        {activeTab === 'historico' && <HistoricoTab vehicle={v} />}
      </div>

      {/* ── E: Ações rápidas ──────────────────── */}
      <div className="flex-shrink-0 border-t border-[var(--border)] px-4 py-3 bg-[var(--surface-muted)] space-y-2 relative">
        {/* Primary action */}
        {showWa ? (
          <button onClick={() => setShowWaMenu(s => !s)}
            className="w-full flex items-center justify-center gap-2 h-8 rounded font-bold text-[12px] text-white transition-colors"
            style={{ backgroundColor: '#16A34A' }}>
            <MessageCircle size={13} />Enviar mensagem WhatsApp
          </button>
        ) : (
          <Link to={`/ordens-servico`}
            className="w-full flex items-center justify-center gap-2 h-8 rounded font-bold text-[12px] text-white transition-colors"
            style={{ backgroundColor: 'var(--brand)' }}>
            <FileText size={13} />Abrir OS
          </Link>
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { icon: <FileText size={12} />,   label: 'Orçamento' },
            { icon: <Camera size={12} />,     label: 'Fotos' },
            { icon: <History size={12} />,    label: 'Histórico' },
            { icon: <Wrench size={12} />,     label: 'Abrir OS' },
          ].map(btn => (
            <button key={btn.label} className="flex flex-col items-center justify-center gap-1 h-[44px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-[9px] font-semibold transition-colors">
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>

        {/* WhatsApp message picker */}
        {showWaMenu && (
          <div className="absolute bottom-full left-0 right-0 mx-0 mb-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden z-20">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]">
              <p className="text-[11px] font-bold text-[var(--text-primary)]">Mensagem rápida</p>
              <p className="text-[10px] text-[var(--text-muted)]">Abre o WhatsApp com texto pronto</p>
            </div>
            {msgs.map((msg, i) => (
              <a key={i} href={buildWaUrl(v.customer.phone, msg.text)} target="_blank" rel="noopener noreferrer"
                onClick={() => setShowWaMenu(false)}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
                <span className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle size={9} className="text-green-700" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--text-primary)]">{msg.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{msg.text.slice(0, 60)}…</p>
                </div>
              </a>
            ))}
            <button onClick={() => setShowWaMenu(false)} className="w-full py-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-t border-[var(--border)] transition-colors">Fechar</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Service Timeline ──────────────────────────────────────────────────────────

function ServiceTimeline({ currentStage, status }: { currentStage: TimelineStage; status: PatioStatus }) {
  const currentIdx = TIMELINE_STAGES.findIndex(s => s.key === currentStage)
  const total      = TIMELINE_STAGES.length
  const nextStage  = TIMELINE_STAGES[currentIdx + 1] ?? null
  const isOverdue  = status === 'ATRASADO'

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-bold text-[var(--text-primary)] leading-none">
            {TIMELINE_STAGES[currentIdx]?.label ?? '—'}
          </span>
          <span className="text-[9px] text-[var(--text-muted)]">{currentIdx + 1}/{total} etapas</span>
        </div>
        {isOverdue && (
          <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-subtle)', borderColor: 'var(--danger-border)', border: '1px solid' }}>
            <AlertTriangle size={7} />Atrasado
          </span>
        )}
      </div>

      {/* Progress bar with dots */}
      <div className="relative flex items-center justify-between py-0.5">
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="h-[1.5px] w-full" style={{ backgroundColor: 'var(--border)' }} />
        </div>
        {currentIdx > 0 && (
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div className="h-[1.5px] transition-all" style={{ width: `${(currentIdx / (total - 1)) * 100}%`, backgroundColor: 'var(--brand)' }} />
          </div>
        )}
        {TIMELINE_STAGES.map((stage, i) => {
          const isPast = i < currentIdx; const isCurr = i === currentIdx
          return (
            <div key={stage.key} className="relative z-10" title={stage.label}>
              <div className={cn('rounded-full border-[1.5px] transition-all',
                isCurr ? 'w-3 h-3 border-white shadow-sm'
                : isPast ? 'w-2.5 h-2.5'
                : 'w-2.5 h-2.5 bg-[var(--surface)] border-[var(--border)]')}
                style={isCurr ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } : isPast ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } : {}} />
            </div>
          )
        })}
      </div>

      {nextStage ? (
        <p className="text-[9px] text-[var(--text-muted)]">Próxima: <span className="font-semibold text-[var(--text-secondary)]">{nextStage.label}</span></p>
      ) : (
        <div className="flex items-center gap-1">
          <CheckCircle2 size={9} style={{ color: 'var(--success)' }} />
          <p className="text-[9px] font-semibold" style={{ color: 'var(--success)' }}>Processo concluído</p>
        </div>
      )}
    </div>
  )
}

// ── Tab: Resumo ───────────────────────────────────────────────────────────────

function ResumoTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  return (
    <>
      {(v.diagnosis || v.mechanic) && (
        <PanelBlock title="Atendimento">
          {v.diagnosis && <PanelRow label="Diagnóstico" value={v.diagnosis} />}
          {v.mechanic  && <PanelRow label="Mecânico" value={v.mechanic} />}
        </PanelBlock>
      )}
      {v.history && (
        <PanelBlock title="Última visita">
          <PanelRow label="Data" value={v.history.lastVisit} />
          <PanelRow label="Serviço" value={v.history.lastService} />
          <PanelRow label="KM" value={`${v.history.lastMileage.toLocaleString('pt-BR')} km`} />
          {v.history.nextRecommendation && (
            <div className="px-3 py-2 rounded-b-lg border-t border-[var(--border)] bg-[var(--warning-subtle)]">
              <p className="text-[9px] font-black uppercase tracking-[0.08em] mb-0.5" style={{ color: 'var(--warning)' }}>Recomendação</p>
              <p className="text-[11px] font-medium leading-snug" style={{ color: 'var(--warning)' }}>{v.history.nextRecommendation}</p>
            </div>
          )}
        </PanelBlock>
      )}
      {!v.diagnosis && !v.mechanic && !v.history && (
        <p className="text-[12px] text-[var(--text-muted)] text-center py-8">Sem informações adicionais.</p>
      )}
    </>
  )
}

// ── Tab: Cliente ──────────────────────────────────────────────────────────────

function ClienteTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  const phone = v.customer.phone.replace(/\D/g, '')
  return (
    <>
      <PanelBlock title="Contato">
        <PanelRow label="Nome" value={v.customer.name} />
        <PanelRow label="Telefone" value={v.customer.phone} />
      </PanelBlock>
      <div className="grid grid-cols-2 gap-2">
        <a href={`https://wa.me/55${phone}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 h-8 rounded text-[11px] font-bold text-white transition-colors" style={{ backgroundColor: '#16A34A' }}>
          <MessageCircle size={12} />WhatsApp
        </a>
        <a href={`tel:${v.customer.phone}`}
          className="flex items-center justify-center gap-1.5 h-8 rounded border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
          <Phone size={12} />Ligar
        </a>
      </div>
    </>
  )
}

// ── Tab: Veículo ──────────────────────────────────────────────────────────────

function VeiculoTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  return (
    <PanelBlock title="Dados do veículo">
      <PanelRow label="Marca"  value={v.brand} />
      <PanelRow label="Modelo" value={v.model} />
      <PanelRow label="Ano"    value={String(v.year)} />
      <PanelRow label="Placa"  value={v.plate} mono />
      {v.mileage && <PanelRow label="KM atual" value={`${v.mileage.toLocaleString('pt-BR')} km`} />}
    </PanelBlock>
  )
}

// ── Tab: Histórico ────────────────────────────────────────────────────────────

function HistoricoTab({ vehicle: v }: { vehicle: PatioVehicle }) {
  if (!v.history) return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <History size={20} className="text-[var(--text-disabled)]" />
      <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Sem histórico anterior</p>
      <p className="text-[10px] text-[var(--text-muted)]">Primeiro atendimento registrado.</p>
    </div>
  )
  return (
    <>
      <PanelBlock title="Último atendimento">
        <PanelRow label="Data"    value={v.history.lastVisit} />
        <PanelRow label="Serviço" value={v.history.lastService} />
        <PanelRow label="KM"      value={`${v.history.lastMileage.toLocaleString('pt-BR')} km`} />
      </PanelBlock>
      {v.history.nextRecommendation && (
        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--warning)' }}>Recomendação</p>
          <p className="text-[11px] font-medium leading-snug" style={{ color: 'var(--warning)' }}>{v.history.nextRecommendation}</p>
        </div>
      )}
    </>
  )
}

// ── Panel sub-components ──────────────────────────────────────────────────────

function PanelBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.1em] mb-1.5">{title}</p>
      <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
        {children}
      </div>
    </div>
  )
}

function PanelRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between px-3 py-1.5 gap-3 bg-[var(--surface)]">
      <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 pt-[1px]">{label}</span>
      <span className={cn('text-right text-[11px] font-semibold text-[var(--text-primary)] min-w-0 leading-snug', mono && 'font-mono tracking-wide')}>{value}</span>
    </div>
  )
}

// ── New Entry Modal ───────────────────────────────────────────────────────────

interface NewEntryForm {
  plate: string; customerName: string; phone: string; model: string
  serviceType: string; symptom: string; entryTime: string
  mechanic: string; priority: string; createOS: boolean
}

const SERVICE_TYPES = ['Revisão', 'Diagnóstico', 'Conserto', 'Troca de peça', 'Orçamento', 'Garantia']
const PRIORITIES    = ['Normal', 'Alta', 'Urgente']

function NewEntryModal({ onClose, onSave }: { onClose: () => void; onSave: (f: NewEntryForm) => void }) {
  const [form, setForm] = useState<NewEntryForm>({
    plate: '', customerName: '', phone: '', model: '',
    serviceType: 'Diagnóstico', symptom: '', entryTime: '',
    mechanic: '', priority: 'Normal', createOS: true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof NewEntryForm, string>>>({})
  const mechanics = mockMechanics

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  function set<K extends keyof NewEntryForm>(k: K, v: NewEntryForm[K]) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
  }

  function handleSave() {
    const e: Partial<Record<keyof NewEntryForm, string>> = {}
    if (!form.plate.trim())        e.plate = 'Placa obrigatória'
    if (!form.customerName.trim()) e.customerName = 'Nome obrigatório'
    if (!form.model.trim())        e.model = 'Modelo obrigatório'
    setErrors(e)
    if (Object.keys(e).length) return
    onSave(form)
  }

  const isValid = form.plate.trim() && form.customerName.trim() && form.model.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-[560px] max-h-[92vh] bg-[var(--surface)] rounded-t-2xl sm:rounded-xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border-strong)' }} />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[16px] font-extrabold text-[var(--text-primary)]">Nova entrada</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Registrar veículo recebido na oficina.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Veículo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Placa *{errors.plate && <span className="text-[var(--danger)] ml-1">{errors.plate}</span>}
              </label>
              <input value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())}
                placeholder="ABC-1D23" className={cn(SI, 'font-mono tracking-wider', errors.plate && 'border-[var(--danger)]')} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Modelo *{errors.model && <span className="text-[var(--danger)] ml-1">{errors.model}</span>}
              </label>
              <input value={form.model} onChange={e => set('model', e.target.value)}
                placeholder="Honda Civic 2018" className={cn(SI, errors.model && 'border-[var(--danger)]')} />
            </div>
          </div>

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                Cliente *{errors.customerName && <span className="text-[var(--danger)] ml-1">{errors.customerName}</span>}
              </label>
              <input value={form.customerName} onChange={e => set('customerName', e.target.value)}
                placeholder="Nome do cliente" className={cn(SI, errors.customerName && 'border-[var(--danger)]')} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Telefone / WhatsApp</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="11 99999-0000" className={SI} />
            </div>
          </div>

          {/* Tipo de atendimento */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-2">Tipo de atendimento</p>
            <div className="grid grid-cols-3 gap-1.5">
              {SERVICE_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set('serviceType', t)}
                  className={cn('h-8 px-2 rounded border text-[11px] font-medium transition-all',
                    form.serviceType === t ? 'font-semibold' : 'text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]')}
                  style={form.serviceType === t ? { color: 'var(--brand)', backgroundColor: 'var(--brand-light)', borderColor: 'rgba(212,96,26,0.30)' } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sintoma */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Sintoma relatado</label>
            <textarea value={form.symptom} onChange={e => set('symptom', e.target.value)} rows={2}
              placeholder="Descreva o que o cliente relatou..." className={cn(SI, 'h-auto py-2 resize-none')} />
          </div>

          {/* Horário + Mecânico + Prioridade */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Hora de entrada</label>
              <input type="time" value={form.entryTime} onChange={e => set('entryTime', e.target.value)} className={SI} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Mecânico</label>
              <select value={form.mechanic} onChange={e => set('mechanic', e.target.value)} className={SI}>
                <option value="">Nenhum</option>
                {mechanics.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Prioridade</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={SI}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Criar OS */}
          <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] transition-colors">
            <input type="checkbox" checked={form.createOS} onChange={e => set('createOS', e.target.checked)} className="w-3.5 h-3.5 accent-[var(--brand)]" />
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Criar OS automaticamente</p>
              <p className="text-[10px] text-[var(--text-muted)]">Gera uma Ordem de Serviço vinculada a esta entrada</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
          <button onClick={onClose} className="h-8 px-4 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={!isValid}
            className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--brand)' }}>
            <Car size={12} />Adicionar ao pátio
          </button>
        </div>
      </div>
    </div>
  )
}
