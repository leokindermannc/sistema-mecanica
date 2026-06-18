import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Phone, Car, Wrench,
  CheckCircle2, MoreHorizontal, PenLine, Paperclip,
  CalendarDays, Timer, UserCheck, ArrowUpRight, Zap,
} from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'
import { mockSchedule } from '../../mocks/schedule'
import type { ScheduleAppointment, AppointmentType, AppointmentStatus } from '../../types'

// ─── Config ───────────────────────────────────────────────────────────────────

const TODAY = '2026-06-10'

const TYPE_CFG: Record<AppointmentType, { label: string; color: string; light: string; gradient: string; dark: string }> = {
  REVISAO:         { label: 'Revisão',      color: '#6366F1', dark: '#4F46E5', light: 'rgba(99,102,241,0.08)',  gradient: 'rgba(99,102,241,0.12)'  },
  REPARO:          { label: 'Reparo',        color: '#F59E0B', dark: '#D97706', light: 'rgba(245,158,11,0.08)',  gradient: 'rgba(245,158,11,0.12)'  },
  ORCAMENTO:       { label: 'Orçamento',     color: '#3B82F6', dark: '#2563EB', light: 'rgba(59,130,246,0.08)',  gradient: 'rgba(59,130,246,0.12)'  },
  RETORNO_GARANTIA:{ label: 'Ret. Garantia', color: '#A855F7', dark: '#7C3AED', light: 'rgba(168,85,247,0.08)',  gradient: 'rgba(168,85,247,0.12)'  },
}

const STATUS_CFG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  AGENDADO:       { label: 'Agendado',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  CONFIRMADO:     { label: 'Confirmado',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  REALIZADO:      { label: 'Realizado',      color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  NAO_COMPARECEU: { label: 'Não compareceu', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  CANCELADO:      { label: 'Cancelado',      color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
}

const MECH_PALETTES = [
  ['#F97316','#EA580C'], ['#6366F1','#4F46E5'], ['#22C55E','#16A34A'],
  ['#3B82F6','#2563EB'], ['#A855F7','#7C3AED'], ['#EC4899','#DB2777'],
]

const WEEK_DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const NOTE_TAGS = ['Serviço','Orçamento','Garantia','Reclamação','Observação','Urgente']

// ─── Types ────────────────────────────────────────────────────────────────────

interface AptNote { id: string; aptId: string; title: string; body: string; author: string; createdAt: string; tags: string[] }
type PageView = 'gantt' | 'detail'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(ref: string): string[] {
  const d = new Date(ref + 'T12:00:00')
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() === 0 ? 7 : d.getDay()) - 1))
  return Array.from({ length: 6 }, (_, i) => {
    const x = new Date(mon); x.setDate(mon.getDate() + i)
    return x.toISOString().slice(0, 10)
  })
}

function addDays(s: string, n: number): string {
  const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function weekLabel(dates: string[]): string {
  const a = new Date(dates[0] + 'T12:00:00')
  const b = new Date(dates[5] + 'T12:00:00')
  if (a.getMonth() === b.getMonth())
    return `${a.getDate()} – ${b.getDate()} de ${MONTHS[a.getMonth()]} ${a.getFullYear()}`
  return `${a.getDate()} ${MONTHS[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MONTHS[b.getMonth()].slice(0,3)} ${b.getFullYear()}`
}

function mechInitials(name: string) {
  const p = name.split(' ')
  return p.length >= 2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase()
}

function custInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function getMechPalette(idx: number) {
  return MECH_PALETTES[idx % MECH_PALETTES.length]
}

function calcEndTime(time: string, duration: number) {
  const [h, m] = time.split(':').map(Number)
  const t = h * 60 + m + duration
  return `${String(Math.floor(t / 60)).padStart(2,'0')}:${String(t % 60).padStart(2,'0')}`
}

function durationLabel(min: number) {
  return min >= 60 ? `${Math.floor(min/60)}h${min%60>0?` ${min%60}min`:''}` : `${min}min`
}

function buildActivity(apt: ScheduleAppointment) {
  const ev = [
    { id:'c1', avatar:'SIS', name:'Sistema',        text:'Agendamento criado',              sub:`${apt.time} · ${durationLabel(apt.duration)}`, time:'3 dias atrás', done:true,  color:'#9CA3AF' },
  ]
  if (['CONFIRMADO','REALIZADO','NAO_COMPARECEU'].includes(apt.status))
    ev.push({ id:'c2', avatar: mechInitials(apt.mechanicName??'?'), name: apt.mechanicName??'Mecânico', text:'Agendamento confirmado', sub:'Cliente notificado via WhatsApp', time:'2 dias atrás', done:true,  color:'#3B82F6' })
  if (apt.status==='REALIZADO')
    ev.push({ id:'c3', avatar: mechInitials(apt.mechanicName??'?'), name: apt.mechanicName??'Mecânico', text:'Serviço concluído',       sub:'OS pode ser finalizada',          time:'hoje',         done:true,  color:'#22C55E' })
  if (apt.status==='NAO_COMPARECEU')
    ev.push({ id:'c4', avatar: mechInitials(apt.mechanicName??'?'), name: apt.mechanicName??'Mecânico', text:'Cliente não compareceu', sub:'Reagendamento sugerido',          time:'ontem',        done:true,  color:'#EF4444' })
  if (apt.status==='CANCELADO')
    ev.push({ id:'c5', avatar:'SIS', name:'Sistema', text:'Agendamento cancelado',           sub:'',                                time:'ontem',        done:true,  color:'#EF4444' })
  return ev
}

// ─── Gantt: Card ──────────────────────────────────────────────────────────────

function AptCard({ apt, selected, onClick, mechIndex }: {
  apt: ScheduleAppointment; selected: boolean; onClick: () => void; mechIndex: number
}) {
  const t = TYPE_CFG[apt.type]
  const s = STATUS_CFG[apt.status]
  const [c1, c2] = getMechPalette(mechIndex)

  return (
    <button onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl p-3 mb-2 last:mb-0 transition-all duration-200',
        'border hover:shadow-lg hover:-translate-y-px active:translate-y-0',
        selected ? 'shadow-lg -translate-y-px ring-2 ring-[#F97316]/60 ring-offset-1' : 'shadow-sm',
      )}
      style={{ background:`linear-gradient(135deg,${t.gradient} 0%,${t.light} 60%,transparent 100%)`, borderColor:`${t.color}20`, borderLeftColor:t.color, borderLeftWidth:3 }}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest" style={{ color:t.color }}>
          <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor:t.color }} />{t.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black text-t-text tabular-nums">{apt.time}</span>
          <span className="text-[8px] font-bold px-1.5 py-[2px] rounded-full border"
            style={{ color:t.color, backgroundColor:`${t.color}10`, borderColor:`${t.color}20` }}>
            {apt.duration}min
          </span>
        </div>
      </div>
      <p className="text-[13px] font-extrabold text-t-text leading-tight truncate mb-1">{apt.customerName}</p>
      <div className="flex items-center gap-1.5 mb-3">
        <Car size={9} className="text-t-muted flex-shrink-0" />
        <span className="text-[10px] text-t-secondary truncate">{apt.vehicle}</span>
        <span className="text-[9px] font-mono text-t-muted bg-t-surface border border-t-border px-1.5 py-px rounded flex-shrink-0">{apt.plate}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        {apt.mechanicName ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white flex-shrink-0"
              style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
              {mechInitials(apt.mechanicName)}
            </div>
            <span className="text-[9px] text-t-muted truncate">{apt.mechanicName.split(' ')[0]}</span>
          </div>
        ) : <span className="text-[9px] text-t-muted italic">Sem mecânico</span>}
        <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-[3px] rounded-full flex-shrink-0"
          style={{ color:s.color, backgroundColor:s.bg, border:`1px solid ${s.color}20` }}>
          <span className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor:s.color }} />{s.label}
        </span>
      </div>
    </button>
  )
}

// ─── Gantt: Mechanic column cell ──────────────────────────────────────────────

function MechCell({ name, apts, index }: { name: string; apts: ScheduleAppointment[]; index: number }) {
  const [c1,c2]  = getMechPalette(index)
  const total     = apts.length
  const duration  = apts.reduce((s,a) => s+a.duration, 0)
  const confirmed = apts.filter(a => a.status==='CONFIRMADO'||a.status==='REALIZADO').length

  return (
    <div className="flex flex-col gap-2.5 px-3 py-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black text-white flex-shrink-0 shadow-sm"
          style={{ background: name==='Sem mecânico' ? 'var(--color-surface,#f3f4f6)' : `linear-gradient(135deg,${c1},${c2})` }}>
          {name==='Sem mecânico' ? <Wrench size={14} className="text-t-muted" /> : mechInitials(name)}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-t-text truncate leading-tight">{name}</p>
          <p className="text-[9px] text-t-muted mt-px">Mecânico</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between"><span className="text-[9px] text-t-muted">Esta semana</span><span className="text-[10px] font-bold text-t-text">{total} agend.</span></div>
        <div className="flex justify-between"><span className="text-[9px] text-t-muted">Tempo total</span>
          <span className="text-[10px] font-bold text-t-text">
            {duration>=60?`${Math.floor(duration/60)}h${duration%60>0?`${duration%60}m`:''}`:`${duration}min`}
          </span>
        </div>
        {total > 0 && (
          <div className="mt-1">
            <div className="w-full h-[3px] bg-t-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${(confirmed/total)*100}%`, background:`linear-gradient(90deg,${c1},${c2})` }} />
            </div>
            <p className="text-[8px] text-t-muted mt-0.5">{confirmed}/{total} confirmados</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Detail: Add note modal ───────────────────────────────────────────────────

function AddNoteModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (note: Omit<AptNote,'id'|'aptId'>) => void
}) {
  const [title, setTitle] = useState('')
  const [body,  setBody]  = useState('')
  const [tags,  setTags]  = useState<string[]>([])

  function toggle(tag: string) { setTags(p => p.includes(tag) ? p.filter(t=>t!==tag) : [...p,tag]) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[560px] rounded-2xl bg-t-card border border-t-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="h-[3px]" style={{ background:'linear-gradient(90deg,#F97316,#6366F1,#A855F7)' }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-t-border">
          <h3 className="text-[15px] font-bold text-t-text">Adicionar Nota</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-t-muted hover:bg-t-surface transition-colors"><X size={13} /></button>
        </div>
        <div className="flex divide-x divide-t-border">
          <div className="flex-1 px-6 py-5 space-y-4">
            <div>
              <label className="block text-[9px] font-black text-t-muted uppercase tracking-widest mb-1.5">Título</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título da nota..."
                className="w-full h-10 px-3 rounded-xl border border-t-border bg-t-surface text-[12px] text-t-text placeholder:text-t-muted focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316]/50 transition-all" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-t-muted uppercase tracking-widest mb-1.5">Nota</label>
              <textarea value={body} onChange={(e)=>setBody(e.target.value)} rows={4} placeholder="Descreva a nota..."
                className="w-full px-3 py-2.5 rounded-xl border border-t-border bg-t-surface text-[12px] text-t-text placeholder:text-t-muted focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316]/50 transition-all resize-none" />
            </div>
          </div>
          <div className="w-44 px-5 py-5">
            <p className="text-[9px] font-black text-t-muted uppercase tracking-widest mb-3">Selecionar Tag</p>
            <div className="space-y-2.5">
              {NOTE_TAGS.map(tag => (
                <label key={tag} className="flex items-center gap-2.5 cursor-pointer group">
                  <div onClick={()=>toggle(tag)}
                    className={cn('w-[15px] h-[15px] rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all',
                      tags.includes(tag)?'border-[#F97316] bg-[#F97316]':'border-t-border bg-t-bg group-hover:border-[#F97316]/40')}>
                    {tags.includes(tag) && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="text-[11px] text-t-secondary group-hover:text-t-text transition-colors select-none">{tag}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-t-border bg-t-surface">
          <button className="w-7 h-7 rounded flex items-center justify-center text-t-muted hover:bg-t-card transition-colors"><Paperclip size={13} /></button>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-8 px-4 text-[11px] font-semibold text-t-secondary border border-t-border rounded-lg hover:bg-t-card-hover transition-colors">Cancelar</button>
            <button onClick={() => { if(!title.trim()) return; onSave({title:title.trim(),body:body.trim(),tags,author:'Você',createdAt:new Date().toLocaleDateString('pt-BR')}); onClose() }}
              disabled={!title.trim()}
              className="h-8 px-4 text-[11px] font-bold text-white rounded-lg disabled:opacity-40"
              style={{ background:'linear-gradient(135deg,#F97316,#EA580C)', boxShadow:'0 2px 8px rgba(249,115,22,0.3)' }}>
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Detail: Premium note card ────────────────────────────────────────────────

function NoteCard({ note }: { note: AptNote }) {
  return (
    <div className="rounded-xl border border-t-border bg-t-bg overflow-hidden">
      <div className="h-[2px]" style={{ background:'linear-gradient(90deg,#F97316,transparent)' }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[12px] font-bold text-t-text leading-tight">{note.title}</p>
          <button className="w-6 h-6 rounded-md flex items-center justify-center text-t-muted hover:bg-t-surface flex-shrink-0 transition-colors"><MoreHorizontal size={11} /></button>
        </div>
        <p className="text-[9px] text-t-muted mb-2.5">{note.createdAt} · {note.author}</p>
        {note.body && <p className="text-[11px] text-t-secondary leading-relaxed mb-3">{note.body}</p>}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map(tag => (
              <span key={tag} className="text-[9px] font-semibold px-2 py-[3px] rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Detail: Premium sidebar card ─────────────────────────────────────────────

function SideCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-t-border bg-t-card overflow-hidden shadow-sm">
      <div className="h-[2px]" style={{ backgroundColor: color }} />
      <div className="px-4 pt-3 pb-1">
        <p className="text-[9px] font-black text-t-muted uppercase tracking-[0.12em]">{title}</p>
      </div>
      <div className="px-4 pb-4 pt-2">{children}</div>
    </div>
  )
}

// ─── Detail: Full-page premium detail ────────────────────────────────────────

function AptDetail({ apt, notes, mechIndex, onBack, onAddNote }: {
  apt: ScheduleAppointment
  notes: AptNote[]
  mechIndex: number
  onBack: () => void
  onAddNote: (note: Omit<AptNote,'id'|'aptId'>) => void
}) {
  const [showModal, setShowModal] = useState(false)

  const t        = TYPE_CFG[apt.type]
  const s        = STATUS_CFG[apt.status]
  const [c1,c2]  = getMechPalette(mechIndex)
  const activity = buildActivity(apt)
  const endTime  = calcEndTime(apt.time, apt.duration)
  const isDone   = apt.status === 'REALIZADO'
  const isClosed = apt.status === 'REALIZADO' || apt.status === 'CANCELADO'

  const statusOrder: AppointmentStatus[] = ['AGENDADO','CONFIRMADO','REALIZADO']
  const statusDoneIdx = statusOrder.indexOf(apt.status)

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden">

      {/* ── Premium header ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-t-topbar border-b border-t-border">

        {/* Type accent strip */}
        <div className="h-[3px]" style={{ background:`linear-gradient(90deg,${t.color},${t.dark},transparent 70%)` }} />

        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={onBack}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-t-muted hover:text-t-text transition-colors group">
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Agenda
            </button>
            <span className="text-t-border text-[12px]">/</span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: t.color }}>
              <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor:t.color }} />
              {t.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isClosed && (
              <button className="flex items-center gap-1.5 h-8 px-3.5 text-[11px] font-bold rounded-xl border-2 transition-all hover:shadow-sm"
                style={{ color:'#16A34A', borderColor:'#22C55E40', backgroundColor:'rgba(34,197,94,0.06)' }}>
                <CheckCircle2 size={13} strokeWidth={2.5} /> Marcar como Realizado
              </button>
            )}
            <button className="h-8 px-3.5 text-[11px] font-semibold rounded-xl border border-t-border bg-t-surface text-t-secondary hover:bg-t-card-hover transition-colors">
              Editar
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3.5 text-[11px] font-bold text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-px"
              style={{ background:'linear-gradient(135deg,#F97316,#EA580C)', boxShadow:'0 2px 12px rgba(249,115,22,0.3)' }}>
              Abrir OS <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* Hero: customer name + status */}
        <div className="flex items-end justify-between px-6 pb-3">
          <div>
            <h1 className="text-[22px] font-black text-t-text tracking-tight leading-none mb-1.5">
              {apt.customerName}
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{ color:s.color, backgroundColor:s.bg, border:`1px solid ${s.color}30` }}>
                <span className={cn('w-[6px] h-[6px] rounded-full', isDone && 'animate-none')}
                  style={{ backgroundColor:s.color }} />
                {s.label}
              </span>
              <span className="text-[11px] text-t-muted">#{apt.id.slice(0,8).toUpperCase()}</span>
            </div>
          </div>

          {/* Quick metadata chips */}
          <div className="flex items-center gap-2 pb-0.5">
            {[
              { icon:<CalendarDays size={11}/>, value: formatDate(apt.date) },
              { icon:<Clock size={11}/>,        value: `${apt.time} – ${endTime}` },
              { icon:<Timer size={11}/>,        value: durationLabel(apt.duration) },
            ].map((m,i) => (
              <div key={i} className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-t-surface border border-t-border">
                <span className="text-t-muted">{m.icon}</span>
                <span className="text-[11px] font-semibold text-t-text">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata strip */}
        <div className="flex items-center gap-0 px-6 border-t border-t-border">
          {[
            { icon:<Car size={10}/>,       label:'Veículo',  value:apt.vehicle },
            { icon:<Car size={10}/>,       label:'Placa',    value:apt.plate,           mono:true },
            ...(apt.mechanicName?[{ icon:<UserCheck size={10}/>, label:'Mecânico', value:apt.mechanicName }]:[]),
            ...(apt.customerPhone?[{ icon:<Phone size={10}/>,    label:'Telefone', value:apt.customerPhone }]:[]),
          ].map((m,i,arr) => (
            <div key={i} className={cn('flex items-center gap-1.5 py-2.5 pr-6', i < arr.length-1 && 'border-r border-t-border mr-6')}>
              <span className="text-t-muted">{m.icon}</span>
              <span className="text-[10px] text-t-muted">{m.label}:</span>
              <span className={cn('text-[11px] font-semibold text-t-text', (m as {mono?:boolean}).mono && 'font-mono tracking-wide')}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden bg-t-bg">

        {/* Left: content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-7 min-w-0">

          {/* Description */}
          {apt.description && (
            <div className="mb-8">
              <p className="text-[10px] font-black text-t-muted uppercase tracking-widest mb-3">Descrição do Serviço</p>
              <div className="rounded-xl border border-t-border bg-t-card p-4 border-l-4" style={{ borderLeftColor: t.color }}>
                <p className="text-[13px] text-t-secondary leading-relaxed">{apt.description}</p>
              </div>
            </div>
          )}

          {/* Activity feed */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-black text-t-muted uppercase tracking-widest">Linha do Tempo</p>
              <span className="text-[9px] font-bold text-t-muted bg-t-surface border border-t-border px-2 py-1 rounded-full">
                {activity.length} eventos
              </span>
            </div>

            {/* Date separator */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-t-border" />
              <div className="flex items-center gap-1.5 bg-t-surface border border-t-border rounded-full px-3 py-1">
                <CalendarDays size={9} className="text-t-muted" />
                <span className="text-[9px] font-bold text-t-muted">{formatDate(apt.date)}</span>
              </div>
              <div className="flex-1 h-px bg-t-border" />
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-5 bottom-5 w-[2px] bg-t-border" />

              <div className="space-y-1">
                {activity.map((ev, i) => (
                  <div key={ev.id} className="flex gap-4 relative">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 relative z-10 shadow-sm border-2 border-t-card"
                      style={{ background: ev.icon==='created'||ev.avatar==='SIS'
                        ? 'linear-gradient(135deg,#6B7280,#4B5563)'
                        : `linear-gradient(135deg,${c1},${c2})` }}>
                      {ev.avatar==='SIS' ? <Zap size={13} /> : ev.avatar}
                    </div>

                    {/* Event card */}
                    <div className={cn(
                      'flex-1 rounded-xl border p-3.5 mb-3 transition-all',
                      i === activity.length - 1 ? 'border-t-border bg-t-card shadow-sm' : 'border-t-border bg-t-bg',
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[12px] font-bold text-t-text">{ev.text}</p>
                            <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                              style={{ backgroundColor: ev.color }} />
                          </div>
                          <p className="text-[10px] text-t-muted">{ev.name}</p>
                        </div>
                        <span className="text-[9px] text-t-muted bg-t-surface border border-t-border px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                          {ev.time}
                        </span>
                      </div>
                      {ev.sub && (
                        <p className="text-[11px] text-t-secondary mt-2 pt-2 border-t border-t-border">{ev.sub}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add note / comment trigger */}
            <div className="flex gap-3 mt-2 ml-0">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <PenLine size={14} className="text-[#F97316]" />
              </div>
              <button onClick={() => setShowModal(true)}
                className="flex-1 h-10 px-4 text-left text-[12px] text-t-muted rounded-xl border border-t-border border-dashed bg-t-card hover:bg-t-card-hover hover:border-solid hover:text-t-secondary transition-all">
                Adicionar nota ao agendamento...
              </button>
            </div>
          </div>

          {/* Notes */}
          {notes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-t-muted uppercase tracking-widest">
                  Notas <span className="ml-1 text-t-text">{notes.length}</span>
                </p>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#F97316] hover:text-orange-600 transition-colors">
                  <Plus size={10} /> Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {notes.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar ───────────────────────────────────────────────────── */}
        <div className="w-[288px] flex-shrink-0 border-l border-t-border overflow-y-auto px-4 py-5 space-y-3 bg-t-card">

          {/* Cliente */}
          <SideCard title="Cliente" color="#3B82F6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-black text-white flex-shrink-0 shadow-md"
                style={{ background:'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
                {custInitials(apt.customerName)}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-t-text leading-tight truncate">{apt.customerName}</p>
                {apt.customerPhone && (
                  <div className="flex items-center gap-1 mt-1">
                    <Phone size={9} className="text-t-muted" />
                    <span className="text-[10px] text-t-muted">{apt.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>
            <button className="w-full h-7 text-[10px] font-semibold text-t-secondary border border-t-border rounded-lg hover:bg-t-surface transition-colors flex items-center justify-center gap-1">
              Ver perfil completo <ArrowUpRight size={10} />
            </button>
          </SideCard>

          {/* Veículo */}
          <SideCard title="Veículo" color={t.color}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-t-surface border border-t-border flex items-center justify-center flex-shrink-0">
                <Car size={20} className="text-t-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-t-text truncate leading-tight">{apt.vehicle}</p>
                {/* License plate style */}
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded border-2 border-t-border bg-t-bg"
                  style={{ fontFamily:'monospace' }}>
                  <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor:t.color }} />
                  <span className="text-[11px] font-black text-t-text tracking-widest">{apt.plate}</span>
                </div>
              </div>
            </div>
          </SideCard>

          {/* Mecânico */}
          {apt.mechanicName && (
            <SideCard title="Mecânico Responsável" color={c1}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-black text-white flex-shrink-0 shadow-md"
                  style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
                  {mechInitials(apt.mechanicName)}
                </div>
                <div>
                  <p className="text-[13px] font-black text-t-text leading-tight">{apt.mechanicName}</p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold mt-1 px-2 py-[3px] rounded-full"
                    style={{ color:c1, backgroundColor:`${c1}15`, border:`1px solid ${c1}30` }}>
                    <span className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor:c1 }} />
                    Mecânico
                  </span>
                </div>
              </div>
            </SideCard>
          )}

          {/* Status stepper */}
          <SideCard title="Progresso do Atendimento" color={s.color}>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-[10px] top-3 bottom-3 w-[2px] bg-t-border" />
              <div className="space-y-0">
                {statusOrder.map((st, i) => {
                  const sc      = STATUS_CFG[st]
                  const isPast  = statusDoneIdx >= i && !['NAO_COMPARECEU','CANCELADO'].includes(apt.status)
                  const isCurr  = apt.status === st
                  const isSkipped = ['NAO_COMPARECEU','CANCELADO'].includes(apt.status) && i > 0

                  return (
                    <div key={st} className="flex items-start gap-3 relative pb-4 last:pb-0">
                      <div className={cn(
                        'w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 relative z-10 border-2 transition-all',
                        isPast ? 'border-none shadow-sm' : 'border-t-border bg-t-bg',
                      )}
                        style={isPast ? { background:`linear-gradient(135deg,${sc.color}cc,${sc.color})` } : undefined}>
                        {isPast
                          ? <CheckCircle2 size={12} className="text-white" strokeWidth={2.5} />
                          : <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: isSkipped ? '#EF444440' : '#E5E7EB' }} />
                        }
                      </div>
                      <div className="pt-0.5 flex-1">
                        <p className={cn('text-[11px] font-bold leading-tight',
                          isPast ? 'text-t-text' : 'text-t-muted')}>
                          {sc.label}
                        </p>
                        {isCurr && !isClosed && (
                          <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 inline-block"
                            style={{ color: sc.color }}>
                            ATUAL
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {['NAO_COMPARECEU','CANCELADO'].includes(apt.status) && (
                  <div className="flex items-start gap-3 relative pt-1">
                    <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 relative z-10 border-2 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10">
                      <X size={11} className="text-red-500" strokeWidth={2.5} />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[11px] font-bold text-red-500">{s.label}</p>
                      <span className="text-[8px] font-black uppercase tracking-widest text-red-400">ATUAL</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SideCard>

          {/* Linked OS */}
          {apt.serviceOrderId && (
            <SideCard title="Ordem de Serviço" color="#F97316">
              <button className="w-full text-left p-2 rounded-lg hover:bg-t-surface transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-black text-[#F97316]">#{apt.serviceOrderId}</p>
                    <p className="text-[9px] text-t-muted mt-0.5">Clique para abrir</p>
                  </div>
                  <ArrowUpRight size={14} className="text-t-muted group-hover:text-[#F97316] transition-colors" />
                </div>
              </button>
            </SideCard>
          )}
        </div>
      </div>

      {showModal && (
        <AddNoteModal onClose={() => setShowModal(false)} onSave={(n) => { onAddNote(n); setShowModal(false) }} />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SchedulePage() {
  const [weekRef, setWeekRef]     = useState(TODAY)
  const [view, setView]           = useState<PageView>('gantt')
  const [selectedId, setSelected] = useState<string | null>(null)
  const [notesMap, setNotesMap]   = useState<Record<string, AptNote[]>>({})

  const weekDates = getWeekDates(weekRef)
  const label     = weekLabel(weekDates)
  const weekApts  = mockSchedule.filter(a => weekDates.includes(a.date))

  const mechanics = useMemo(() => {
    const names = [...new Set(weekApts.map(a => a.mechanicName ?? 'Sem mecânico'))]
    return names.sort((a, b) => a==='Sem mecânico'?1:b==='Sem mecânico'?-1:a.localeCompare(b))
  }, [weekApts])

  const ganttMap = useMemo(() => {
    const map: Record<string,Record<string,ScheduleAppointment[]>> = {}
    for (const apt of weekApts) {
      const mech = apt.mechanicName ?? 'Sem mecânico'
      if (!map[mech]) map[mech] = {}
      if (!map[mech][apt.date]) map[mech][apt.date] = []
      map[mech][apt.date].push(apt)
    }
    for (const m of Object.keys(map))
      for (const d of Object.keys(map[m]))
        map[m][d].sort((a,b) => a.time.localeCompare(b.time))
    return map
  }, [weekApts])

  const kpiWeek      = weekApts.length
  const kpiConfirmed = weekApts.filter(a => a.status==='CONFIRMADO').length
  const kpiDone      = weekApts.filter(a => a.status==='REALIZADO').length
  const kpiToday     = mockSchedule.filter(a => a.date===TODAY).length

  function openDetail(id: string) { setSelected(id); setView('detail') }

  function handleAddNote(note: Omit<AptNote,'id'|'aptId'>) {
    if (!selectedId) return
    const n: AptNote = { ...note, id: crypto.randomUUID(), aptId: selectedId }
    setNotesMap(prev => ({ ...prev, [selectedId]: [n, ...(prev[selectedId]??[])] }))
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (view==='detail' && selectedId) {
    const apt = mockSchedule.find(a => a.id===selectedId)
    if (apt) {
      const mechIdx = mechanics.indexOf(apt.mechanicName ?? 'Sem mecânico')
      return (
        <AptDetail
          key={selectedId}
          apt={apt}
          notes={notesMap[selectedId] ?? []}
          mechIndex={mechIdx >= 0 ? mechIdx : 0}
          onBack={() => setView('gantt')}
          onAddNote={handleAddNote}
        />
      )
    }
  }

  // ── Gantt view ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-t-border bg-t-topbar">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[15px] font-bold text-t-text tracking-tight leading-none">Agenda</h1>
              <p className="text-[10px] text-t-muted mt-0.5">Roadmap de agendamentos da semana</p>
            </div>
            <div className="flex items-center bg-t-surface border border-t-border rounded-lg h-7 overflow-hidden divide-x divide-t-border">
              <button onClick={() => setWeekRef(addDays(weekRef,-7))} className="px-2.5 h-full hover:bg-t-card-hover text-t-muted transition-colors"><ChevronLeft size={13} /></button>
              <span className="px-3 text-[11px] font-semibold text-t-text">{label}</span>
              <button onClick={() => setWeekRef(addDays(weekRef,7))}  className="px-2.5 h-full hover:bg-t-card-hover text-t-muted transition-colors"><ChevronRight size={13} /></button>
            </div>
            <button onClick={() => setWeekRef(TODAY)} className="h-7 px-3 text-[10px] font-bold text-t-secondary border border-t-border rounded-lg bg-t-surface hover:bg-t-card-hover transition-colors">Hoje</button>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {[
              { label:'Semana',      value:kpiWeek,      color:'#6366F1' },
              { label:'Confirmados', value:kpiConfirmed, color:'#3B82F6' },
              { label:'Realizados',  value:kpiDone,      color:'#22C55E' },
              { label:'Hoje',        value:kpiToday,     color:'#F97316' },
            ].map(k => (
              <div key={k.label} className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-t-border bg-t-surface">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:k.color }} />
                <span className="text-[11px] font-black text-t-text tabular-nums">{k.value}</span>
                <span className="text-[9px] text-t-muted">{k.label}</span>
              </div>
            ))}
            <button className="flex items-center gap-1.5 h-7 px-3 ml-1 rounded-lg text-white text-[11px] font-bold hover:shadow-md hover:-translate-y-px transition-all"
              style={{ background:'linear-gradient(135deg,#F97316,#EA580C)', boxShadow:'0 2px 8px rgba(249,115,22,0.25)' }}>
              <Plus size={11} strokeWidth={2.5} /> Agendar
            </button>
          </div>
        </div>
        <div className="flex items-center gap-5 mt-2.5 pt-2.5 border-t border-t-border">
          {(Object.entries(TYPE_CFG) as [AppointmentType, typeof TYPE_CFG[AppointmentType]][]).map(([,c]) => (
            <span key={c.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor:c.color }} />
              <span className="text-[9px] font-semibold text-t-muted">{c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Gantt table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth:960 }}>
          <thead>
            <tr className="sticky top-0 z-10">
              <th className="sticky left-0 z-20 w-[200px] border-b border-r border-t-border bg-t-surface px-3 py-3 text-left">
                <span className="text-[9px] font-bold text-t-muted uppercase tracking-widest">Equipe</span>
              </th>
              {weekDates.map(date => {
                const d = new Date(date+'T12:00:00')
                const isToday = date===TODAY
                const count = weekApts.filter(a=>a.date===date).length
                return (
                  <th key={date} className={cn('border-b border-r border-t-border px-3 py-3 text-center',
                    isToday?'bg-orange-50 dark:bg-orange-500/[0.07]':'bg-t-surface')}>
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest', isToday?'text-[#F97316]':'text-t-muted')}>
                        {WEEK_DAYS[d.getDay()]}
                      </span>
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-black', isToday?'text-white':'text-t-text')}
                        style={isToday?{background:'linear-gradient(135deg,#F97316,#EA580C)',boxShadow:'0 4px 12px rgba(249,115,22,0.35)'}:undefined}>
                        {d.getDate()}
                      </div>
                      {count>0
                        ? <span className={cn('text-[8px] font-bold px-1.5 py-px rounded-full',
                          isToday?'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/15':'text-t-muted bg-t-border')}>
                          {count} agend.
                        </span>
                        : <span className="text-[8px] opacity-0">—</span>
                      }
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {mechanics.length===0 ? (
              <tr><td colSpan={7} className="py-20 text-center">
                <p className="text-[13px] font-semibold text-t-secondary">Nenhum agendamento nesta semana</p>
              </td></tr>
            ) : mechanics.map((mech, idx) => {
              const mechApts = Object.values(ganttMap[mech]??{}).flat()
              return (
                <tr key={mech} className={cn('transition-colors', idx%2===0?'bg-t-card':'bg-t-bg')}>
                  <td className={cn('sticky left-0 z-[5] border-r border-b border-t-border align-top', idx%2===0?'bg-t-card':'bg-t-bg')}>
                    <MechCell name={mech} apts={mechApts} index={idx} />
                  </td>
                  {weekDates.map(date => {
                    const isToday = date===TODAY
                    const apts = ganttMap[mech]?.[date]??[]
                    return (
                      <td key={date}
                        className={cn('border-r border-b border-t-border align-top px-2 py-2', isToday&&'bg-orange-50/30 dark:bg-orange-500/[0.03]')}
                        style={{ minWidth:150 }}>
                        {apts.map(apt => (
                          <AptCard key={apt.id} apt={apt} selected={selectedId===apt.id} mechIndex={idx} onClick={()=>openDetail(apt.id)} />
                        ))}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
