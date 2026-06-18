import { useState, useMemo, type ReactNode } from 'react'
import {
  Plus, Search, ChevronLeft, ChevronRight, X, Car, Phone, Mail,
  MessageCircle, MapPin, User, Building2, FileText, MoreHorizontal,
  CheckCircle2, Clock, AlertCircle, PenLine, Paperclip,
} from 'lucide-react'
import { mockCustomers } from '../../mocks/customers'
import { formatDate, cn } from '../../lib/utils'
import type { Customer, CustomerType, CustomerStatus } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type View        = 'list' | 'detail'
type DetailTab   = 'dados' | 'veiculos' | 'historico' | 'financeiro'
type NoteFilter  = 'ativas' | 'resolvidas'

interface LocalNote {
  id: string; customerId: string; title: string; body: string
  tags: string[]; author: string; createdAt: string; resolved: boolean
}

interface Filters { search: string; type: CustomerType | ''; status: CustomerStatus | '' }

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<CustomerType, { label: string; color: string; bg: string }> = {
  PF: { label: 'Pessoa Física',   color: '#2563EB', bg: 'rgba(37,99,235,0.10)'  },
  PJ: { label: 'Pessoa Jurídica', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
}

const STATUS_CFG: Record<CustomerStatus, { label: string; color: string; bg: string }> = {
  ATIVO:   { label: 'Ativo',   color: '#16A34A', bg: 'rgba(22,163,74,0.10)'   },
  INATIVO: { label: 'Inativo', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
}

const AVATAR_COLORS: [string, string][] = [
  ['rgba(249,115,22,0.14)',  '#EA580C'],
  ['rgba(37,99,235,0.14)',   '#2563EB'],
  ['rgba(124,58,237,0.14)',  '#7C3AED'],
  ['rgba(22,163,74,0.14)',   '#16A34A'],
  ['rgba(219,39,119,0.14)',  '#BE185D'],
  ['rgba(8,145,178,0.14)',   '#0E7490'],
  ['rgba(180,83,9,0.14)',    '#B45309'],
]

const NOTE_TAGS = ['Serviço', 'Orçamento', 'Cobrança', 'Garantia', 'Reclamação', 'VIP', 'Observação']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileCompletion(c: Customer): number {
  const fields = [c.name, c.document, c.phone, c.email, c.whatsapp, c.city, c.state]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function avatarColors(name: string): [string, string] {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function CAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const [bg, color] = avatarColors(name)
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-[20px]' : 'w-8 h-8 text-[11px]'
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold flex-shrink-0', sz)}
      style={{ backgroundColor: bg, color }}>
      {initials(name)}
    </div>
  )
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  const s = STATUS_CFG[status]
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-[3px] rounded-full"
      style={{ color: s.color, backgroundColor: s.bg }}>
      <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

function CustomerRow({ c, selected, onSelect }: {
  c: Customer; selected: boolean; onSelect: () => void
}) {
  const pct   = profileCompletion(c)
  const pctClr = pct >= 80 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#EF4444'
  const t     = TYPE_CFG[c.type]

  return (
    <tr
      onClick={onSelect}
      className={cn(
        'group cursor-pointer transition-colors border-b border-t-border last:border-0',
        selected ? 'bg-orange-50 dark:bg-orange-500/[0.06]' : 'hover:bg-t-card-hover',
      )}
    >
      {/* Selected indicator */}
      <td className="pl-4 pr-2 py-3 w-8">
        <div className={cn('w-1.5 h-6 rounded-full transition-all', selected ? 'bg-[#F97316]' : 'bg-transparent')} />
      </td>

      {/* Status */}
      <td className="px-3 py-3 whitespace-nowrap">
        <StatusBadge status={c.status} />
      </td>

      {/* Completude */}
      <td className="px-3 py-3 w-36">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[5px] bg-t-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pctClr }} />
          </div>
          <span className="text-[10px] font-bold tabular-nums w-7 text-right flex-shrink-0"
            style={{ color: pctClr }}>{pct}%</span>
        </div>
      </td>

      {/* Nome */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <CAvatar name={c.name} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-px">
              <p className="text-[12px] font-semibold text-t-text truncate max-w-[170px]">{c.name}</p>
              <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-[2px] rounded flex-shrink-0"
                style={{ color: t.color, backgroundColor: t.bg }}>{c.type}</span>
            </div>
            {c.city && <p className="text-[10px] text-t-muted">{c.city}, {c.state}</p>}
          </div>
        </div>
      </td>

      {/* Documento */}
      <td className="px-3 py-3">
        <span className="font-mono text-[11px] text-t-secondary">{c.document}</span>
      </td>

      {/* Contato */}
      <td className="px-3 py-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-t-secondary">
            <Phone size={9} className="text-t-muted flex-shrink-0" /> {c.phone}
            {c.whatsapp && <MessageCircle size={9} className="text-green-500 ml-0.5" />}
          </div>
          {c.email && (
            <div className="flex items-center gap-1 text-[10px] text-t-muted">
              <Mail size={9} className="flex-shrink-0" />
              <span className="truncate max-w-[150px]">{c.email}</span>
            </div>
          )}
        </div>
      </td>

      {/* Veículos */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Car size={11} className="text-t-muted" />
          <span className={cn('text-[12px] font-bold', c.vehiclesCount > 0 ? 'text-t-text' : 'text-t-muted')}>
            {c.vehiclesCount}
          </span>
        </div>
      </td>

      {/* Última OS */}
      <td className="px-3 py-3">
        {c.lastServiceDate ? (
          <div>
            <p className="text-[11px] font-medium text-t-text">{formatDate(c.lastServiceDate)}</p>
            {c.openOrdersCount > 0 && (
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {c.openOrdersCount} em aberto
              </p>
            )}
          </div>
        ) : <span className="text-[11px] text-t-muted">—</span>}
      </td>

      {/* Actions */}
      <td className="px-3 py-3 w-8">
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-6 h-6 rounded flex items-center justify-center text-t-muted hover:bg-t-surface hover:text-t-text transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal size={12} />
        </button>
      </td>
    </tr>
  )
}

// ─── Detail: Lifecycle timeline ───────────────────────────────────────────────

function LifecycleTimeline({ c }: { c: Customer }) {
  const pct = profileCompletion(c)
  const steps = [
    { label: 'Cadastrado',          done: true,               sub: 'Registro criado' },
    { label: 'Dados Completos',     done: pct >= 80,          sub: pct >= 80 ? 'Perfil completo' : `${pct}% preenchido` },
    { label: 'Veículo Cadastrado',  done: c.vehiclesCount > 0, sub: c.vehiclesCount > 0 ? `${c.vehiclesCount} veículo(s)` : 'Pendente' },
    { label: 'Primeiro Atendimento',done: !!c.lastServiceDate, sub: c.lastServiceDate ? formatDate(c.lastServiceDate) : 'Pendente' },
    { label: 'Cliente Ativo',       done: c.status === 'ATIVO',sub: c.status === 'ATIVO' ? 'Ativo' : 'Inativo' },
  ]

  return (
    <div>
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 border-2',
              step.done ? 'border-[#22C55E] bg-[#22C55E]' : 'border-t-border bg-t-bg',
            )}>
              {step.done
                ? <CheckCircle2 size={9} className="text-white" strokeWidth={3} />
                : <span className="w-[5px] h-[5px] rounded-full bg-t-border" />
              }
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-[2px] my-0.5 flex-1 min-h-[16px]',
                step.done ? 'bg-[#22C55E]' : 'bg-t-border')} />
            )}
          </div>
          <div className="pb-3.5 flex-1 min-w-0 pt-px">
            <p className={cn('text-[11px] font-semibold leading-tight', step.done ? 'text-t-text' : 'text-t-muted')}>
              {step.label}
            </p>
            <p className="text-[9px] text-t-muted mt-px">{step.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Detail: Dados tab ────────────────────────────────────────────────────────

function InfoField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-black text-t-muted uppercase tracking-widest mb-1">{label}</p>
      <p className={cn('text-[12px] text-t-text font-medium', mono && 'font-mono', !value && 'text-t-muted italic')}>
        {value || '—'}
      </p>
    </div>
  )
}

function DadosTab({ c }: { c: Customer }) {
  const [bg, color] = avatarColors(c.name)
  const t = TYPE_CFG[c.type]

  return (
    <div className="space-y-7">
      {/* Personal info hero */}
      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center gap-2">
          <div className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-[22px] font-black flex-shrink-0"
            style={{ backgroundColor: bg, color }}>
            {initials(c.name)}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-[2px] rounded"
            style={{ color: t.color, backgroundColor: t.bg }}>{t.label}</span>
        </div>
        <div>
          <h3 className="text-[17px] font-black text-t-text leading-tight">{c.name}</h3>
          <p className="text-[11px] text-t-muted font-mono mt-0.5">{c.document}</p>
          {c.openOrdersCount > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertCircle size={11} />
              {c.openOrdersCount} OS em aberto
            </div>
          )}
        </div>
      </div>

      {/* Informações pessoais */}
      <section>
        <h4 className="text-[9px] font-black text-t-muted uppercase tracking-widest mb-3 pb-2 border-b border-t-border">
          Informações {c.type === 'PF' ? 'Pessoais' : 'da Empresa'}
        </h4>
        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
          {c.type === 'PF' ? (
            <>
              <InfoField label="Nome Completo" value={c.name} />
              <InfoField label="CPF"           value={c.document} mono />
              <InfoField label="Status"        value={c.status === 'ATIVO' ? 'Ativo' : 'Inativo'} />
            </>
          ) : (
            <>
              <InfoField label="Razão Social" value={c.name} />
              <InfoField label="CNPJ"         value={c.document} mono />
              <InfoField label="Status"       value={c.status === 'ATIVO' ? 'Ativa' : 'Inativa'} />
            </>
          )}
        </div>
      </section>

      {/* Contato */}
      <section>
        <h4 className="text-[9px] font-black text-t-muted uppercase tracking-widest mb-3 pb-2 border-b border-t-border">
          Contato
        </h4>
        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
          <InfoField label="Telefone" value={c.phone} />
          <InfoField label="WhatsApp" value={c.whatsapp} />
          <InfoField label="E-mail"   value={c.email} />
        </div>
      </section>

      {/* Endereço */}
      <section>
        <h4 className="text-[9px] font-black text-t-muted uppercase tracking-widest mb-3 pb-2 border-b border-t-border">
          Endereço
        </h4>
        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
          <InfoField label="Cidade" value={c.city} />
          <InfoField label="Estado" value={c.state} />
        </div>
      </section>
    </div>
  )
}

// ─── Detail: Note card ────────────────────────────────────────────────────────

function NoteCard({ note }: { note: LocalNote }) {
  return (
    <div className="rounded-xl border border-t-border bg-t-bg p-4">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <p className="text-[12px] font-bold text-t-text leading-tight">{note.title}</p>
        <button className="w-6 h-6 rounded flex items-center justify-center text-t-muted hover:bg-t-surface flex-shrink-0 transition-colors">
          <MoreHorizontal size={11} />
        </button>
      </div>
      <p className="text-[9px] text-t-muted mb-2">
        {note.createdAt} · {note.author}
      </p>
      {note.body && <p className="text-[11px] text-t-secondary leading-relaxed mb-3">{note.body}</p>}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map(tag => (
            <span key={tag} className="text-[9px] font-semibold px-2 py-[3px] rounded-full bg-t-surface border border-t-border text-t-secondary">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail: Add note modal ───────────────────────────────────────────────────

function AddNoteModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (note: Omit<LocalNote, 'id' | 'resolved' | 'customerId'>) => void
}) {
  const [title, setTitle]           = useState('')
  const [body, setBody]             = useState('')
  const [selectedTags, setTags]     = useState<string[]>([])

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(), body: body.trim(), tags: selectedTags,
      author: 'Você', createdAt: new Date().toLocaleDateString('pt-BR'),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-[560px] rounded-2xl bg-t-card border border-t-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-t-border">
          <h3 className="text-[15px] font-bold text-t-text">Adicionar Nota</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-t-muted hover:bg-t-surface transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex divide-x divide-t-border">
          {/* Left */}
          <div className="flex-1 px-6 py-5 space-y-4">
            <div>
              <label className="block text-[9px] font-black text-t-muted uppercase tracking-widest mb-1.5">
                Título da Nota
              </label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Observação sobre pagamento..."
                className="w-full h-10 px-3 rounded-lg border border-t-border bg-t-surface text-[12px] text-t-text placeholder:text-t-muted focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-t-muted uppercase tracking-widest mb-1.5">
                Nota
              </label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5}
                placeholder="Descreva a nota..."
                className="w-full px-3 py-2.5 rounded-lg border border-t-border bg-t-surface text-[12px] text-t-text placeholder:text-t-muted focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316]/50 transition-all resize-none"
              />
              <p className="text-[9px] text-t-muted mt-1">Máx. 250 caracteres</p>
            </div>
          </div>

          {/* Right: tags */}
          <div className="w-44 px-5 py-5">
            <p className="text-[9px] font-black text-t-muted uppercase tracking-widest mb-3">Selecionar Tag</p>
            <div className="space-y-2.5">
              {NOTE_TAGS.map(tag => (
                <label key={tag} className="flex items-center gap-2.5 cursor-pointer group">
                  <div onClick={() => toggleTag(tag)}
                    className={cn(
                      'w-[15px] h-[15px] rounded flex items-center justify-center border-2 flex-shrink-0 cursor-pointer transition-all',
                      selectedTags.includes(tag)
                        ? 'border-[#F97316] bg-[#F97316]'
                        : 'border-t-border bg-t-bg group-hover:border-[#F97316]/40',
                    )}>
                    {selectedTags.includes(tag) && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px] text-t-secondary group-hover:text-t-text transition-colors select-none">{tag}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-t-border bg-t-surface">
          <button className="w-7 h-7 rounded flex items-center justify-center text-t-muted hover:bg-t-card transition-colors">
            <Paperclip size={13} />
          </button>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="h-8 px-4 text-[11px] font-semibold text-t-secondary border border-t-border rounded-lg hover:bg-t-card-hover transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!title.trim()}
              className="h-8 px-4 text-[11px] font-bold text-white rounded-lg disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}>
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function DetailView({ c, allCustomers, notesMap, onBack, onNavigate, onAddNote }: {
  c: Customer
  allCustomers: Customer[]
  notesMap: Record<string, LocalNote[]>
  onBack: () => void
  onNavigate: (id: string) => void
  onAddNote: (note: Omit<LocalNote, 'id' | 'resolved' | 'customerId'>) => void
}) {
  const [tab, setTab]             = useState<DetailTab>('dados')
  const [noteFilter, setNoteFilter] = useState<NoteFilter>('ativas')
  const [showModal, setShowModal] = useState(false)

  const idx   = allCustomers.findIndex(x => x.id === c.id)
  const prev  = idx > 0 ? allCustomers[idx - 1] : null
  const next  = idx < allCustomers.length - 1 ? allCustomers[idx + 1] : null
  const notes = notesMap[c.id] ?? []
  const visible = notes.filter(n => noteFilter === 'ativas' ? !n.resolved : n.resolved)

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'dados',      label: 'Dados Pessoais' },
    { id: 'veiculos',   label: 'Veículos' },
    { id: 'historico',  label: 'Histórico de OS' },
    { id: 'financeiro', label: 'Financeiro' },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* ── Detail header ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-t-topbar border-b border-t-border">

        {/* Breadcrumb + actions row */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <button onClick={onBack}
              className="flex items-center gap-1 text-[11px] font-semibold text-t-muted hover:text-t-text transition-colors">
              <ChevronLeft size={13} /> Clientes
            </button>
            <span className="text-t-border text-[11px]">/</span>
            <span className="text-[13px] font-bold text-t-text">{c.name}</span>
            <StatusBadge status={c.status} />
          </div>

          <div className="flex items-center gap-2">
            {c.openOrdersCount > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
                <AlertCircle size={11} />
                {c.openOrdersCount} {c.openOrdersCount === 1 ? 'OS precisa' : 'OS precisam'} de atenção
              </div>
            )}
            <div className="flex items-center bg-t-surface border border-t-border rounded-lg h-7 overflow-hidden divide-x divide-t-border">
              <button disabled={!prev} onClick={() => prev && onNavigate(prev.id)}
                className="px-2 h-full text-t-muted hover:bg-t-card-hover disabled:opacity-30 transition-colors">
                <ChevronLeft size={12} />
              </button>
              <button disabled={!next} onClick={() => next && onNavigate(next.id)}
                className="px-2 h-full text-t-muted hover:bg-t-card-hover disabled:opacity-30 transition-colors">
                <ChevronRight size={12} />
              </button>
            </div>
            <button className="h-7 px-3 text-[11px] font-semibold text-t-secondary border border-t-border rounded-lg bg-t-surface hover:bg-t-card-hover transition-colors">
              Editar
            </button>
            <button className="h-7 px-3 text-[11px] font-bold text-white rounded-lg transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}>
              Nova OS
            </button>
          </div>
        </div>

        {/* Metadata strip */}
        {(() => {
          type MetaItem = { icon: ReactNode; label: string; value: string; mono?: boolean }
          const meta: MetaItem[] = [
            { icon: <FileText size={10} />, label: c.type === 'PF' ? 'CPF' : 'CNPJ', value: c.document, mono: true },
            { icon: c.type === 'PJ' ? <Building2 size={10} /> : <User size={10} />, label: 'Tipo', value: TYPE_CFG[c.type].label },
            { icon: <Phone size={10} />,  label: 'Telefone', value: c.phone },
            ...(c.email ? [{ icon: <Mail size={10} />,   label: 'E-mail',  value: c.email } as MetaItem] : []),
            ...(c.city  ? [{ icon: <MapPin size={10} />, label: 'Cidade',  value: `${c.city}, ${c.state}` } as MetaItem] : []),
            { icon: <Car size={10} />,    label: 'Veículos', value: String(c.vehiclesCount) },
          ]
          return (
            <div className="flex items-center gap-6 px-6 py-2.5 border-t border-t-border">
              {meta.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-t-muted">{m.icon}</span>
                  <span className="text-[10px] text-t-muted">{m.label}:</span>
                  <span className={cn('text-[11px] font-semibold text-t-text', m.mono && 'font-mono')}>{m.value}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: tabs + content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tab bar */}
          <div className="flex-shrink-0 border-b border-t-border bg-t-card px-6">
            <div className="flex items-center">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn(
                    'h-10 px-4 text-[12px] font-semibold border-b-2 transition-colors relative',
                    tab === t.id ? 'text-[#F97316] border-[#F97316]' : 'text-t-muted border-transparent hover:text-t-text hover:border-t-border',
                  )}>
                  {t.label}
                  {t.id === 'historico' && c.openOrdersCount > 0 && (
                    <span className="ml-1.5 text-[9px] font-bold px-1.5 py-px rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {c.openOrdersCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-8 py-7">
            {tab === 'dados'     && <DadosTab c={c} />}
            {tab === 'veiculos'  && (
              <div className="text-center py-20">
                <Car size={36} className="mx-auto mb-3 text-t-muted opacity-30" />
                <p className="text-[13px] font-semibold text-t-secondary">
                  {c.vehiclesCount > 0 ? `${c.vehiclesCount} veículo(s) cadastrado(s)` : 'Nenhum veículo cadastrado'}
                </p>
                <p className="text-[11px] text-t-muted mt-1">Integração em breve</p>
              </div>
            )}
            {tab === 'historico' && (
              <div className="text-center py-20">
                <Clock size={36} className="mx-auto mb-3 text-t-muted opacity-30" />
                <p className="text-[13px] font-semibold text-t-secondary">
                  {c.lastServiceDate ? `Último atendimento: ${formatDate(c.lastServiceDate)}` : 'Sem histórico de atendimentos'}
                </p>
                {c.openOrdersCount > 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">{c.openOrdersCount} OS em aberto</p>
                )}
              </div>
            )}
            {tab === 'financeiro' && (
              <div className="text-center py-20">
                <FileText size={36} className="mx-auto mb-3 text-t-muted opacity-30" />
                <p className="text-[13px] font-semibold text-t-secondary">Módulo financeiro em desenvolvimento</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Lifecycle + Notes */}
        <div className="w-[270px] flex-shrink-0 border-l border-t-border bg-t-card flex flex-col overflow-hidden">

          {/* Lifecycle */}
          <div className="border-b border-t-border px-4 pt-4 pb-3">
            <p className="text-[9px] font-black text-t-muted uppercase tracking-widest mb-4">Ciclo de Vida</p>
            <LifecycleTimeline c={c} />
          </div>

          {/* Notes */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center px-4 pt-3 pb-0 gap-1">
              <span className="text-[12px] font-bold text-t-text">
                Notas {notes.length > 0 && <span className="text-[10px] text-t-muted ml-0.5">{notes.length}</span>}
              </span>
              <button onClick={() => setShowModal(true)}
                className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#F97316] hover:text-orange-600 transition-colors">
                <PenLine size={10} /> Adicionar
              </button>
            </div>

            {/* Active / Resolved */}
            <div className="flex items-center gap-1 px-4 py-2.5">
              {(['ativas', 'resolvidas'] as NoteFilter[]).map(f => (
                <button key={f} onClick={() => setNoteFilter(f)}
                  className={cn(
                    'h-6 px-3 text-[10px] font-semibold rounded-md transition-colors',
                    noteFilter === f
                      ? 'bg-t-text text-t-bg'
                      : 'bg-t-surface text-t-muted hover:bg-t-card-hover',
                  )}>
                  {f === 'ativas' ? 'Ativas' : 'Resolvidas'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
              {visible.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[11px] text-t-muted">Nenhuma nota {noteFilter === 'ativas' ? 'ativa' : 'resolvida'}</p>
                  {noteFilter === 'ativas' && (
                    <button onClick={() => setShowModal(true)}
                      className="text-[10px] text-[#F97316] font-semibold mt-1.5 hover:underline">
                      + Adicionar nota
                    </button>
                  )}
                </div>
              ) : visible.map(note => <NoteCard key={note.id} note={note} />)}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AddNoteModal
          onClose={() => setShowModal(false)}
          onSave={(note) => { onAddNote(note); setShowModal(false) }}
        />
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CustomersPage() {
  const [view, setView]           = useState<View>('list')
  const [selectedId, setId]       = useState<string | null>(null)
  const [filters, setFilters]     = useState<Filters>({ search: '', type: '', status: '' })
  const [notesMap, setNotesMap]   = useState<Record<string, LocalNote[]>>({})

  const selected = selectedId ? (mockCustomers.find(c => c.id === selectedId) ?? null) : null

  const filtered = useMemo(() => mockCustomers.filter(c => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !c.name.toLowerCase().includes(q) &&
        !c.document.includes(q) &&
        !c.phone.includes(q) &&
        !(c.email ?? '').toLowerCase().includes(q)
      ) return false
    }
    if (filters.type   && c.type   !== filters.type)   return false
    if (filters.status && c.status !== filters.status) return false
    return true
  }), [filters])

  const stats = useMemo(() => ({
    total:  mockCustomers.length,
    ativos: mockCustomers.filter(c => c.status === 'ATIVO').length,
    pf:     mockCustomers.filter(c => c.type === 'PF').length,
    pj:     mockCustomers.filter(c => c.type === 'PJ').length,
    comOS:  mockCustomers.filter(c => c.openOrdersCount > 0).length,
  }), [])

  function selectCustomer(id: string) {
    setId(id); setView('detail')
  }

  function handleAddNote(note: Omit<LocalNote, 'id' | 'resolved' | 'customerId'>) {
    if (!selectedId) return
    const n: LocalNote = { ...note, id: crypto.randomUUID(), resolved: false, customerId: selectedId }
    setNotesMap(prev => ({ ...prev, [selectedId]: [n, ...(prev[selectedId] ?? [])] }))
  }

  // ── Detail ───────────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    return (
      <DetailView
        key={selected.id}
        c={selected}
        allCustomers={mockCustomers}
        notesMap={notesMap}
        onBack={() => { setView('list'); setId(null) }}
        onNavigate={(id) => { setId(id) }}
        onAddNote={handleAddNote}
      />
    )
  }

  // ── List ─────────────────────────────────────────────────────────────────────
  const hasFilters = !!(filters.search || filters.type || filters.status)

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-t-border bg-t-topbar">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[18px] font-black text-t-text tracking-tight leading-tight">Clientes</h1>
            <p className="text-[11px] text-t-muted mt-0.5">
              Gerencie os clientes da oficina e acompanhe históricos de atendimento
            </p>
          </div>
          <button className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[11px] font-bold transition-all hover:shadow-md hover:-translate-y-px flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}>
            <Plus size={12} strokeWidth={2.5} /> Novo Cliente
          </button>
        </div>

        {/* KPI chips */}
        <div className="flex items-center gap-2.5">
          {[
            { label: 'Total',         value: stats.total,  color: '#2563EB' },
            { label: 'Ativos',        value: stats.ativos, color: '#16A34A' },
            { label: 'Pessoa Física', value: stats.pf,     color: '#7C3AED' },
            { label: 'Empresas',      value: stats.pj,     color: '#F97316' },
            { label: 'Com OS Aberta', value: stats.comOS,  color: '#B45309' },
          ].map(k => (
            <div key={k.label} className="flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-t-surface border border-t-border">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: k.color }} />
              <span className="text-[11px] font-black text-t-text tabular-nums">{k.value}</span>
              <span className="text-[9px] text-t-muted">{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 px-6 py-2.5 border-b border-t-border bg-t-card flex items-center gap-2 flex-wrap">
        <div className="relative flex items-center">
          <Search size={11} className="absolute left-2.5 text-t-muted pointer-events-none" />
          <input type="text" placeholder="Nome, CPF/CNPJ ou e-mail..." value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="h-7 w-64 bg-t-surface border border-t-border rounded-lg text-[11px] text-t-text placeholder:text-t-muted pl-7 pr-3 focus:outline-none focus:ring-1 focus:ring-[#F97316]/30 focus:border-[#F97316]/40 transition-colors"
          />
        </div>

        <select value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value as CustomerType | '' }))}
          className="h-7 bg-t-surface border border-t-border rounded-lg text-[11px] text-t-text pl-2.5 pr-6 focus:outline-none appearance-none cursor-pointer">
          <option value="">Tipo: Todos</option>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>

        <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as CustomerStatus | '' }))}
          className="h-7 bg-t-surface border border-t-border rounded-lg text-[11px] text-t-text pl-2.5 pr-6 focus:outline-none appearance-none cursor-pointer">
          <option value="">Status: Todos</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>

        {hasFilters && (
          <button onClick={() => setFilters({ search: '', type: '', status: '' })}
            className="flex items-center gap-1 text-[11px] text-t-muted hover:text-red-500 transition-colors">
            <X size={11} /> Limpar
          </button>
        )}

        <span className="ml-auto text-[11px] text-t-muted">
          {filtered.length} de {mockCustomers.length} cliente{mockCustomers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 860 }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-t-surface border-b border-t-border">
              <th className="w-8 pl-4 pr-2 py-2.5" />
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-t-muted uppercase tracking-widest whitespace-nowrap">Status</th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-t-muted uppercase tracking-widest w-36 whitespace-nowrap">Completude</th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-t-muted uppercase tracking-widest">Nome</th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-t-muted uppercase tracking-widest whitespace-nowrap">Documento</th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-t-muted uppercase tracking-widest">Contato</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-black text-t-muted uppercase tracking-widest whitespace-nowrap">Veículos</th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-t-muted uppercase tracking-widest whitespace-nowrap">Última OS</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="bg-t-card">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <Search size={28} className="mx-auto mb-3 text-t-muted opacity-30" />
                  <p className="text-[13px] font-semibold text-t-secondary">Nenhum cliente encontrado</p>
                  <p className="text-[11px] text-t-muted mt-1">Ajuste os filtros ou cadastre um novo cliente</p>
                </td>
              </tr>
            ) : filtered.map(c => (
              <CustomerRow key={c.id} c={c} selected={selectedId === c.id} onSelect={() => selectCustomer(c.id)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 border-t border-t-border bg-t-card px-6 py-2.5 flex items-center justify-between">
        <p className="text-[11px] text-t-muted">
          Registros 1–{filtered.length} de {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <button disabled className="h-6 w-6 flex items-center justify-center rounded border border-t-border text-t-muted hover:bg-t-surface disabled:opacity-30 transition-colors">
            <ChevronLeft size={11} />
          </button>
          <span className="h-6 min-w-[24px] flex items-center justify-center text-[10px] font-bold text-white rounded px-2"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>1</span>
          <button disabled className="h-6 w-6 flex items-center justify-center rounded border border-t-border text-t-muted hover:bg-t-surface disabled:opacity-30 transition-colors">
            <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
