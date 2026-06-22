import { useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus, Pencil, MessageCircle,
  Phone, Mail, MapPin, Car, FileText, Wallet,
  AlertTriangle, CheckCircle2, Clock, Building2, User,
  MessageSquare, PenLine, X, ArrowRight, Gauge,
} from 'lucide-react'
import { mockCustomers }     from '../../mocks/customers'
import { mockVehicles }      from '../../mocks/vehicles'
import { mockServiceOrders } from '../../mocks/service-orders'
import { mockFinance }       from '../../mocks/finance'
import { cn, formatDate, formatCurrency } from '../../lib/utils'
import type { Customer, ServiceOrderStatus } from '../../types'
import { VehicleDetailsModal }      from './VehicleDetailsModal'
import { CreateServiceOrderModal }   from './CreateServiceOrderModal'

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_PALETTE: [string, string][] = [
  ['rgba(212,96,26,0.12)',  '#D4601A'],
  ['rgba(37,99,235,0.12)',  '#2563EB'],
  ['rgba(124,58,237,0.12)', '#7C3AED'],
  ['rgba(22,163,74,0.12)',  '#16A34A'],
  ['rgba(219,39,119,0.12)', '#BE185D'],
  ['rgba(8,145,178,0.12)',  '#0E7490'],
]

function avatarColors(name: string): [string, string] {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function profileCompletion(c: Customer): number {
  const fields = [c.name, c.document, c.phone, c.email, c.whatsapp, c.city, c.state]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

// ── OS status display ─────────────────────────────────────────────────────────

const OS_STATUS_CFG: Record<ServiceOrderStatus, { label: string; cssKey: string }> = {
  AGENDADO:             { label: 'Agendado',           cssKey: 'agendado' },
  EM_ANALISE:           { label: 'Em diagnóstico',     cssKey: 'analise' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação',  cssKey: 'aprovacao' },
  EM_ANDAMENTO:         { label: 'Em serviço',         cssKey: 'andamento' },
  CONCLUIDO:            { label: 'Concluído',          cssKey: 'concluido' },
  ENTREGUE:             { label: 'Entregue',           cssKey: 'entregue' },
  CANCELADO:            { label: 'Cancelado',          cssKey: 'cancelado' },
}

// ── Local types ───────────────────────────────────────────────────────────────

interface LocalNote {
  id: string; title: string; body: string; author: string; createdAt: string
}

type Tab = 'resumo' | 'veiculos' | 'servicos' | 'financeiro' | 'dados'

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const [bg, color] = avatarColors(name)
  const cls = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-14 h-14 text-[20px]',
    xl: 'w-16 h-16 text-[22px]',
  }[size]
  return (
    <div className={cn('rounded-full flex items-center justify-center font-extrabold flex-shrink-0', cls)}
      style={{ backgroundColor: bg, color }}>
      {initials(name)}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
      active
        ? 'text-[var(--success)] bg-[var(--success-subtle)]'
        : 'text-[var(--text-muted)] bg-[var(--surface-muted)]',
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]')} />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

// ── Profile card ──────────────────────────────────────────────────────────────

function ProfileCard({ c, openCount }: { c: Customer; openCount: number }) {
  const [bg] = avatarColors(c.name)
  const pct  = profileCompletion(c)
  const pctColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Top accent bar */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${bg}, var(--brand))` }} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar name={c.name} size="xl" />

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h2 className="text-[18px] font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
                {c.name}
              </h2>
              <StatusDot active={c.status === 'ATIVO'} />
              {openCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--os-aprovacao-bg)] text-[var(--os-aprovacao-text)] border border-[var(--os-aprovacao-border)]">
                  <AlertTriangle size={10} />
                  {openCount} {openCount === 1 ? 'OS aberta' : 'OS abertas'}
                </span>
              )}
            </div>

            {/* Type badge */}
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5 font-mono">
              {c.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'} · {c.document}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
              {c.phone && (
                <span className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                  <Phone size={11} className="text-[var(--text-muted)]" />
                  {c.phone}
                  {c.whatsapp && <MessageCircle size={10} className="text-green-500 ml-0.5" />}
                </span>
              )}
              {c.email && (
                <span className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                  <Mail size={11} className="text-[var(--text-muted)]" />
                  {c.email}
                </span>
              )}
              {c.city && (
                <span className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                  <MapPin size={11} className="text-[var(--text-muted)]" />
                  {c.city}, {c.state}
                </span>
              )}
              <span className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                <Car size={11} className="text-[var(--text-muted)]" />
                {c.vehiclesCount} {c.vehiclesCount === 1 ? 'veículo' : 'veículos'}
              </span>
              {c.lastServiceDate && (
                <span className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                  <Clock size={11} className="text-[var(--text-muted)]" />
                  Último atendimento {formatDate(c.lastServiceDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile completeness */}
        <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-muted)]">Completude do perfil</span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pctColor }} />
          </div>
          <span className="text-[11px] font-bold tabular-nums flex-shrink-0" style={{ color: pctColor }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ── KPI mini cards ────────────────────────────────────────────────────────────

function MiniCard({ label, value, icon, accent }: {
  label: string; value: string | number; icon: React.ReactNode; accent: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <span className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + '18', color: accent }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[19px] font-extrabold text-[var(--text-primary)] leading-none tabular-nums">{value}</p>
        <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── OS status chip ────────────────────────────────────────────────────────────

function OsChip({ status }: { status: ServiceOrderStatus }) {
  const cfg = OS_STATUS_CFG[status]
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border inline-flex"
      style={{
        color:           `var(--os-${cfg.cssKey}-text)`,
        backgroundColor: `var(--os-${cfg.cssKey}-bg)`,
        borderColor:     `var(--os-${cfg.cssKey}-border)`,
      }}>
      {cfg.label}
    </span>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'resumo',     label: 'Resumo' },
  { key: 'veiculos',   label: 'Veículos' },
  { key: 'servicos',   label: 'Serviços' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'dados',      label: 'Dados' },
]

// ── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.12em] mb-3">
      {children}
    </h3>
  )
}

// ── Field display ─────────────────────────────────────────────────────────────

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.08em] mb-0.5">{label}</p>
      <p className={cn('text-[13px] font-medium text-[var(--text-primary)]', mono && 'font-mono', !value && 'text-[var(--text-muted)] italic text-[12px]')}>
        {value ?? '—'}
      </p>
    </div>
  )
}

// ── Tab: Resumo ───────────────────────────────────────────────────────────────

function ResumoTab({ c, vehicles, orders }: {
  c: Customer
  vehicles: ReturnType<typeof mockVehicles.filter>
  orders: ReturnType<typeof mockServiceOrders.filter>
}) {
  const recentOrders = orders.slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Contact & address grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <SectionTitle>Contato</SectionTitle>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[12px]">
              <Phone size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[var(--text-primary)]">{c.phone ?? '—'}</span>
            </div>
            {c.whatsapp && (
              <div className="flex items-center gap-2 text-[12px]">
                <MessageCircle size={13} className="text-green-500 flex-shrink-0" />
                <span className="text-[var(--text-primary)]">{c.whatsapp}</span>
              </div>
            )}
            {c.email && (
              <div className="flex items-center gap-2 text-[12px]">
                <Mail size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-[var(--text-primary)]">{c.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <SectionTitle>Endereço</SectionTitle>
          {c.city ? (
            <div className="flex items-start gap-2 text-[12px]">
              <MapPin size={13} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-primary)]">{c.city}, {c.state}</span>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--text-muted)] italic">Endereço não informado</p>
          )}
        </div>
      </div>

      {/* Linked vehicles */}
      {vehicles.length > 0 && (
        <div>
          <SectionTitle>Veículos vinculados</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {vehicles.map(v => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors">
                <span className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563EB' }}>
                  <Car size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight truncate">
                    {v.brand} {v.model} {v.year}
                  </p>
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">{v.plate}</p>
                </div>
                {v.openServiceOrders > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: 'var(--os-andamento-text)', backgroundColor: 'var(--os-andamento-bg)' }}>
                    {v.openServiceOrders} OS
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div>
          <SectionTitle>Últimos serviços</SectionTitle>
          <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
            {recentOrders.map(os => (
              <Link key={os.id} to={`/ordens-servico/${os.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors group">
                <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{os.vehicle}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">#{os.number} · {formatDate(os.entryDate)}</p>
                  </div>
                  <OsChip status={os.status} />
                  {os.estimatedValue != null && (
                    <span className="hidden sm:block text-[12px] font-medium tabular-nums text-[var(--text-secondary)] text-right w-24">
                      {formatCurrency(os.estimatedValue)}
                    </span>
                  )}
                </div>
                <ArrowRight size={12} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && vehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText size={28} className="text-[var(--text-disabled)] mb-2" />
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">Nenhum histórico ainda</p>
          <p className="text-[12px] text-[var(--text-muted)]">Crie uma OS para este cliente para começar.</p>
        </div>
      )}
    </div>
  )
}

// ── Tab: Veículos ─────────────────────────────────────────────────────────────

function VeiculosTab({ vehicles, onViewVehicle, onNewOS }: {
  vehicles: ReturnType<typeof mockVehicles.filter>
  customerId: string
  onViewVehicle: (id: string) => void
  onNewOS: (id: string) => void
}) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Car size={32} className="text-[var(--text-disabled)] mb-2" />
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Nenhum veículo cadastrado</p>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Adicione o primeiro veículo deste cliente.</p>
        <Link to="/veiculos"
          className="mt-3 text-[12px] font-semibold flex items-center gap-1 hover:underline"
          style={{ color: 'var(--brand)' }}>
          <Plus size={12} /> Adicionar veículo
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {vehicles.map(v => (
        <div key={v.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--border-strong)] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563EB' }}>
                <Car size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[var(--text-primary)] leading-tight">
                  {v.brand} {v.model} {v.year}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[12px] font-semibold text-[var(--text-secondary)]">{v.plate}</span>
                  {v.color && <span className="text-[11px] text-[var(--text-muted)]">· {v.color}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {v.openServiceOrders > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: 'var(--os-andamento-text)', backgroundColor: 'var(--os-andamento-bg)' }}>
                  {v.openServiceOrders} OS ativa{v.openServiceOrders !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-3 border-t border-[var(--border)]">
            {v.currentKm != null && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">KM atual</p>
                <p className="text-[12px] font-semibold text-[var(--text-primary)] tabular-nums">
                  {v.currentKm.toLocaleString('pt-BR')} km
                </p>
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Combustível</p>
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">{v.fuel}</p>
            </div>
            {v.lastServiceDate && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Última OS</p>
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{formatDate(v.lastServiceDate)}</p>
              </div>
            )}
            {v.nextRevisionKm != null && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Próxima revisão</p>
                <p className="text-[12px] font-semibold text-[var(--text-primary)] tabular-nums">
                  {v.nextRevisionKm.toLocaleString('pt-BR')} km
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onNewOS(v.id)}
              className="flex items-center gap-1 h-7 px-3 rounded border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
              <Plus size={11} /> Nova OS
            </button>
            <button
              onClick={() => onViewVehicle(v.id)}
              className="flex items-center gap-1 h-7 px-3 rounded border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
              <Gauge size={11} /> Ver veículo
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Serviços ─────────────────────────────────────────────────────────────

function ServicosTab({ orders }: { orders: ReturnType<typeof mockServiceOrders.filter> }) {
  const open   = orders.filter(os => !['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status))
  const closed = orders.filter(os => ['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status))

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText size={32} className="text-[var(--text-disabled)] mb-2" />
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Sem histórico de serviços</p>
      </div>
    )
  }

  const OsRow = ({ os }: { os: (typeof orders)[number] }) => (
    <Link to={`/ordens-servico/${os.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors group">
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{os.vehicle}</p>
          <p className="text-[11px] text-[var(--text-muted)]">#{os.number} · {os.description?.slice(0, 50)}</p>
        </div>
        <span className="hidden sm:block text-[11px] text-[var(--text-muted)] w-20">{formatDate(os.entryDate)}</span>
        <OsChip status={os.status} />
        {os.estimatedValue != null && (
          <span className="hidden sm:block text-[12px] font-medium tabular-nums text-[var(--text-primary)] w-24 text-right">
            {formatCurrency(os.estimatedValue)}
          </span>
        )}
      </div>
      <ArrowRight size={12} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
    </Link>
  )

  return (
    <div className="space-y-5">
      {open.length > 0 && (
        <div>
          <SectionTitle>Em aberto ({open.length})</SectionTitle>
          <div className="rounded-lg border border-[var(--os-aprovacao-border)] overflow-hidden divide-y divide-[var(--border)]"
            style={{ backgroundColor: 'var(--os-aprovacao-bg)' }}>
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

// ── Tab: Financeiro ───────────────────────────────────────────────────────────

function FinanceiroTab({ finances }: { finances: ReturnType<typeof mockFinance.filter> }) {
  const receber = finances.filter(f => f.type === 'RECEBER')
  const pagar   = finances.filter(f => f.type === 'PAGAR')
  const total   = receber.reduce((s, f) => s + (f.status === 'PAGA' ? f.paidValue ?? f.value : 0), 0)
  const aberto  = receber.filter(f => f.status === 'ABERTA').reduce((s, f) => s + f.value, 0)
  const vencido = receber.filter(f => f.status === 'VENCIDA').reduce((s, f) => s + f.value, 0)

  if (finances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wallet size={32} className="text-[var(--text-disabled)] mb-2" />
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Sem registros financeiros</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--text-muted)]">Total recebido</p>
          <p className="text-[16px] font-extrabold tabular-nums text-[var(--success)]">{formatCurrency(total)}</p>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--text-muted)]">A receber</p>
          <p className="text-[16px] font-extrabold tabular-nums text-[var(--info)]">{formatCurrency(aberto)}</p>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--text-muted)]">Em atraso</p>
          <p className={cn('text-[16px] font-extrabold tabular-nums', vencido > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]')}>
            {formatCurrency(vencido)}
          </p>
        </div>
      </div>

      {/* List */}
      {receber.length > 0 && (
        <div>
          <SectionTitle>Histórico de recebimentos</SectionTitle>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)]">
            {receber.map(f => {
              const overdue = f.status === 'ABERTA' && new Date(f.dueDate) < new Date()
              return (
                <div key={f.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--text-primary)]">{f.description}</p>
                    <p className={cn('text-[10px]', overdue ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]')}>
                      Venc. {formatDate(f.dueDate)}{overdue ? ' — Vencido' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(f.value)}
                    </p>
                    <p className="text-[10px]" style={{
                      color: f.status === 'PAGA' ? 'var(--success)' : overdue ? 'var(--danger)' : 'var(--info)',
                    }}>
                      {f.status === 'PAGA' ? 'Pago' : overdue ? 'Vencido' : 'Em aberto'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Dados ────────────────────────────────────────────────────────────────

function DadosTab({ c }: { c: Customer }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <SectionTitle>Identificação</SectionTitle>
          <Field label={c.type === 'PF' ? 'Nome completo' : 'Razão social'} value={c.name} />
          <Field label={c.type === 'PF' ? 'CPF' : 'CNPJ'} value={c.document} mono />
          <Field label="Tipo" value={c.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'} />
          <Field label="Status" value={c.status === 'ATIVO' ? 'Ativo' : 'Inativo'} />
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <SectionTitle>Contato</SectionTitle>
          <Field label="Telefone"  value={c.phone} />
          <Field label="WhatsApp" value={c.whatsapp} />
          <Field label="E-mail"   value={c.email} />
        </div>
      </div>
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <SectionTitle>Localização</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Cidade" value={c.city} />
          <Field label="Estado" value={c.state} />
        </div>
      </div>
    </div>
  )
}

// ── Right sidebar blocks ──────────────────────────────────────────────────────

function SidebarCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4', className)}>
      {children}
    </div>
  )
}

function SideBlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.12em] mb-3">{children}</p>
  )
}

function LifecycleBlock({ c }: { c: Customer }) {
  const pct = profileCompletion(c)
  const steps = [
    { label: 'Cadastrado',          done: true,                sub: 'Registro criado' },
    { label: 'Dados completos',     done: pct >= 80,           sub: pct >= 80 ? 'Perfil completo' : `${pct}% preenchido` },
    { label: 'Veículo cadastrado',  done: c.vehiclesCount > 0, sub: c.vehiclesCount > 0 ? `${c.vehiclesCount} veículo(s)` : 'Pendente' },
    { label: 'Primeiro atendimento', done: !!c.lastServiceDate, sub: c.lastServiceDate ? formatDate(c.lastServiceDate) : 'Pendente' },
    { label: 'Cliente ativo',       done: c.status === 'ATIVO', sub: c.status === 'ATIVO' ? 'Ativo' : 'Inativo' },
  ]

  return (
    <SidebarCard>
      <SideBlockTitle>Ciclo de vida</SideBlockTitle>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                step.done ? 'border-[var(--success)] bg-[var(--success)]' : 'border-[var(--border)] bg-[var(--surface)]',
              )}>
                {step.done
                  ? <CheckCircle2 size={8} className="text-white" strokeWidth={3} />
                  : <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                }
              </div>
              {i < steps.length - 1 && (
                <div className={cn('w-px my-0.5 flex-1 min-h-[14px]', step.done ? 'bg-[var(--success)]' : 'bg-[var(--border)]')} />
              )}
            </div>
            <div className="pb-3 flex-1 pt-px">
              <p className={cn('text-[11px] font-semibold leading-tight', step.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                {step.label}
              </p>
              <p className="text-[9px] text-[var(--text-muted)]">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </SidebarCard>
  )
}

function AlertsBlock({ c, openCount }: { c: Customer; openCount: number }) {
  const hasAlerts = openCount > 0

  return (
    <SidebarCard>
      <SideBlockTitle>Atenção</SideBlockTitle>
      {hasAlerts ? (
        <div className="space-y-2">
          {openCount > 0 && (
            <div className="flex items-start gap-2 p-2.5 rounded-md"
              style={{ backgroundColor: 'var(--os-aprovacao-bg)', border: '1px solid var(--os-aprovacao-border)' }}>
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--os-aprovacao-text)' }} />
              <p className="text-[11px]" style={{ color: 'var(--os-aprovacao-text)' }}>
                {openCount} {openCount === 1 ? 'OS precisa' : 'OS precisam'} de atenção
              </p>
            </div>
          )}
          {!c.lastServiceDate && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-[var(--surface-muted)] border border-[var(--border)]">
              <Clock size={12} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[var(--text-secondary)]">Nenhum atendimento registrado</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <CheckCircle2 size={13} className="text-[var(--success)]" />
          Nenhum alerta no momento
        </div>
      )}
    </SidebarCard>
  )
}

function ActionsBlock({ c }: { c: Customer }) {
  return (
    <SidebarCard>
      <SideBlockTitle>Próxima ação</SideBlockTitle>
      <div className="space-y-1.5">
        {c.whatsapp && (
          <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-2 h-7 px-3 rounded border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
            <MessageCircle size={11} className="text-green-500" />
            Chamar no WhatsApp
          </a>
        )}
        <Link to="/servicos"
          className="w-full flex items-center gap-2 h-7 px-3 rounded border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
          <Plus size={11} style={{ color: 'var(--brand)' }} />
          Criar OS
        </Link>
      </div>
    </SidebarCard>
  )
}

function NotesBlock() {
  const [notes, setNotes] = useState<LocalNote[]>([])
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)

  function addNote() {
    if (!input.trim()) return
    setNotes(prev => [{
      id: crypto.randomUUID(), title: input.trim(),
      body: '', author: 'Admin', createdAt: new Date().toLocaleDateString('pt-BR'),
    }, ...prev])
    setInput('')
    setAdding(false)
  }

  return (
    <SidebarCard>
      <div className="flex items-center justify-between mb-3">
        <SideBlockTitle>Notas internas</SideBlockTitle>
        <button onClick={() => setAdding(v => !v)}
          className="text-[10px] font-semibold flex items-center gap-0.5 hover:underline"
          style={{ color: 'var(--brand)' }}>
          <PenLine size={10} /> Adicionar
        </button>
      </div>

      {adding && (
        <div className="mb-3 space-y-1.5">
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNote()}
            placeholder="Digite a nota e pressione Enter..."
            className="w-full h-8 px-2.5 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
          />
          <div className="flex gap-1">
            <button onClick={addNote}
              className="flex-1 h-6 text-[10px] font-semibold text-white rounded"
              style={{ backgroundColor: 'var(--brand)' }}>
              Salvar
            </button>
            <button onClick={() => { setAdding(false); setInput('') }}
              className="h-6 w-6 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
              <X size={10} />
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-4">
          <MessageSquare size={18} className="text-[var(--text-disabled)] mx-auto mb-1" />
          <p className="text-[11px] text-[var(--text-muted)]">Nenhuma nota ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="p-2.5 rounded bg-[var(--surface-muted)] border border-[var(--border)]">
              <p className="text-[11px] font-semibold text-[var(--text-primary)]">{note.title}</p>
              <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{note.createdAt} · {note.author}</p>
            </div>
          ))}
        </div>
      )}
    </SidebarCard>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [tab, setTab]                         = useState<Tab>('resumo')
  const [vehicleDetailId, setVehicleDetailId] = useState<string | null>(null)
  const [newOsVehicleId, setNewOsVehicleId]   = useState<string | null>(null)

  const customer = useMemo(() => mockCustomers.find(c => c.id === id) ?? null, [id])
  const vehicles  = useMemo(() => mockVehicles.filter(v => v.customerId === id), [id])
  const orders    = useMemo(() => mockServiceOrders.filter(os => os.customerId === id), [id])
  const finances  = useMemo(() => mockFinance.filter(f => f.entityId === id), [id])

  const openOrders = useMemo(
    () => orders.filter(os => !['CONCLUIDO', 'ENTREGUE', 'CANCELADO'].includes(os.status)),
    [orders],
  )

  // Prev / next navigation within customer list
  const allIds = mockCustomers.map(c => c.id)
  const idx    = id ? allIds.indexOf(id) : -1
  const prevId = idx > 0 ? allIds[idx - 1] : null
  const nextId = idx < allIds.length - 1 ? allIds[idx + 1] : null

  const vehicleDetail = vehicleDetailId ? vehicles.find(v => v.id === vehicleDetailId) ?? null : null
  const newOsVehicle  = newOsVehicleId  ? vehicles.find(v => v.id === newOsVehicleId)  ?? null : null

  if (!customer) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-3">
        <User size={36} className="text-[var(--text-disabled)]" />
        <p className="text-[16px] font-bold text-[var(--text-secondary)]">Cliente não encontrado</p>
        <Link to="/cadastros" className="text-[13px] font-medium hover:underline" style={{ color: 'var(--brand)' }}>
          Voltar para Cadastros
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5">

        {/* ── Breadcrumb + header ────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
              <Link to="/cadastros" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                Cadastros
              </Link>
              <ChevronRight size={11} className="text-[var(--text-disabled)]" />
              <Link to="/cadastros" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                Clientes
              </Link>
              <ChevronRight size={11} className="text-[var(--text-disabled)]" />
              <span className="font-semibold text-[var(--text-primary)]">{customer.name}</span>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Prev / Next */}
            <div className="flex items-center border border-[var(--border)] rounded overflow-hidden">
              <button disabled={!prevId} onClick={() => prevId && navigate(`/cadastros/clientes/${prevId}`)}
                className="h-7 px-2 border-r border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-colors"
                aria-label="Cliente anterior">
                <ChevronLeft size={13} />
              </button>
              <button disabled={!nextId} onClick={() => nextId && navigate(`/cadastros/clientes/${nextId}`)}
                className="h-7 px-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-colors"
                aria-label="Próximo cliente">
                <ChevronRight size={13} />
              </button>
            </div>

            {customer.whatsapp && (
              <a href={`https://wa.me/55${customer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                aria-label="WhatsApp">
                <MessageCircle size={13} className="text-green-500" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <button className="flex items-center gap-1.5 h-7 px-3 rounded border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              <Pencil size={12} />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <Link to="/servicos"
              className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--brand)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}>
              <Plus size={13} strokeWidth={2.5} />
              Nova OS
            </Link>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-5 items-start">

          {/* ── Main content ──────────────────────────────────────── */}
          <div className="space-y-4 min-w-0">

            {/* Profile card */}
            <ProfileCard c={customer} openCount={openOrders.length} />

            {/* KPI mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniCard
                label="Veículos"
                value={vehicles.length}
                icon={<Car size={14} />}
                accent="#2563EB"
              />
              <MiniCard
                label="OS abertas"
                value={openOrders.length}
                icon={<FileText size={14} />}
                accent={openOrders.length > 0 ? 'var(--warning)' : 'var(--text-muted)'}
              />
              <MiniCard
                label="Último atend."
                value={customer.lastServiceDate ? formatDate(customer.lastServiceDate) : '—'}
                icon={<Clock size={14} />}
                accent="var(--brand)"
              />
              <MiniCard
                label="Total moviment."
                value={finances.length > 0
                  ? formatCurrency(finances.filter(f => f.status === 'PAGA').reduce((s, f) => s + f.value, 0))
                  : '—'}
                icon={<Wallet size={14} />}
                accent="var(--success)"
              />
            </div>

            {/* Tabs */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-[var(--border)] px-4 overflow-x-auto" role="tablist">
                {TABS.map(t => {
                  const badge = t.key === 'servicos' && openOrders.length > 0 ? openOrders.length : 0
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={tab === t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        'relative flex items-center gap-1.5 h-10 px-3.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-[140ms] flex-shrink-0',
                        tab === t.key
                          ? 'text-[var(--brand)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                      )}
                    >
                      {t.label}
                      {badge > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-px rounded-full"
                          style={{ backgroundColor: 'var(--os-aprovacao-bg)', color: 'var(--os-aprovacao-text)' }}>
                          {badge}
                        </span>
                      )}
                      {tab === t.key && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                          style={{ backgroundColor: 'var(--brand)' }} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Tab content */}
              <div className="p-5">
                {tab === 'resumo'     && <ResumoTab c={customer} vehicles={vehicles} orders={orders} />}
                {tab === 'veiculos'   && (
                  <VeiculosTab
                    vehicles={vehicles}
                    customerId={customer.id}
                    onViewVehicle={id => setVehicleDetailId(id)}
                    onNewOS={id => setNewOsVehicleId(id)}
                  />
                )}
                {tab === 'servicos'   && <ServicosTab orders={orders} />}
                {tab === 'financeiro' && <FinanceiroTab finances={finances} />}
                {tab === 'dados'      && <DadosTab c={customer} />}
              </div>
            </div>
          </div>

          {/* ── Right sidebar ──────────────────────────────────────── */}
          <aside className="space-y-3 lg:sticky lg:top-[60px]">
            <AlertsBlock c={customer} openCount={openOrders.length} />
            <ActionsBlock c={customer} />
            <LifecycleBlock c={customer} />
            <NotesBlock />
          </aside>
        </div>

      </div>

      {vehicleDetail && (
        <VehicleDetailsModal
          vehicle={vehicleDetail}
          onClose={() => setVehicleDetailId(null)}
          onNewOS={() => {
            setVehicleDetailId(null)
            setNewOsVehicleId(vehicleDetail.id)
          }}
        />
      )}
      {newOsVehicle && (
        <CreateServiceOrderModal
          vehicle={newOsVehicle}
          customerName={customer.name}
          onClose={() => setNewOsVehicleId(null)}
        />
      )}
    </div>
  )
}
