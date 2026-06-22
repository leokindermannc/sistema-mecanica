import type { ServiceOrder } from '../../types'
import { Link } from 'react-router-dom'
import { MessageCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { OsStatusBadge } from './os-status-badge'
import { OsTypeBadge } from './os-status-badge'
import { PriorityBar, PriorityChip } from './priority-chip'
import { VehiclePlate } from './vehicle-plate'
import { formatCurrency, formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'

function Avatar({ initials }: { initials: string }) {
  const COLORS: Array<[string, string]> = [
    ['rgba(26,107,53,0.15)',  '#1A6B35'],
    ['rgba(26,78,140,0.15)',  '#1A4E8C'],
    ['rgba(74,46,140,0.15)',  '#4A2E8C'],
    ['rgba(212,96,26,0.12)',  '#D4601A'],
  ]
  const [bg, text] = COLORS[initials.charCodeAt(0) % COLORS.length]
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold uppercase flex-shrink-0"
      style={{ backgroundColor: bg, color: text }}
      title={initials}
    >
      {initials.slice(0, 2)}
    </div>
  )
}

// ── Default variant ───────────────────────────────────────────────────────────

interface OsCardProps {
  order: ServiceOrder
  variant?: 'default' | 'compact' | 'detailed' | 'kanban'
  className?: string
}

export function OsCard({ order, variant = 'default', className }: OsCardProps) {
  if (variant === 'compact')  return <OsCardCompact  order={order} className={className} />
  if (variant === 'kanban')   return <OsCardKanban   order={order} className={className} />
  if (variant === 'detailed') return <OsCardDetailed order={order} className={className} />
  return <OsCardDefault order={order} className={className} />
}

// ── Default: list view row ────────────────────────────────────────────────────

function OsCardDefault({ order, className }: { order: ServiceOrder; className?: string }) {
  return (
    <Link
      to={`/ordens-servico/${order.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5',
        'hover:bg-[var(--surface-hover)] transition-colors duration-[140ms]',
        'group',
        className,
      )}
    >
      <PriorityBar priority={order.priority} className="h-8" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-mono text-[10px] text-[var(--text-muted)] os-code">#{order.number}</span>
          <OsTypeBadge type={order.type} />
        </div>
        <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">
          {order.vehicle}
        </p>
        <p className="text-[10px] text-[var(--text-muted)] truncate">
          {order.customerName}
          {order.plate && (
            <>
              {' · '}
              <span className="font-mono">{order.plate}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <OsStatusBadge status={order.status} dot />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)]">{formatDate(order.entryDate)}</span>
          {order.estimatedValue > 0 && (
            <span className="text-[10px] font-medium text-[var(--text-secondary)] financial-value">
              {formatCurrency(order.estimatedValue)}
            </span>
          )}
        </div>
      </div>

      <Avatar initials={order.mechanic.initials} />
      <ChevronRight size={12} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] transition-colors flex-shrink-0" />
    </Link>
  )
}

// ── Compact: for dashboard and small spaces ───────────────────────────────────

function OsCardCompact({ order, className }: { order: ServiceOrder; className?: string }) {
  return (
    <Link
      to={`/ordens-servico/${order.id}`}
      className={cn(
        'flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors',
        className,
      )}
    >
      <PriorityBar priority={order.priority} className="h-6" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-[var(--text-muted)]">#{order.number}</span>
          <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{order.vehicle}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <VehiclePlate plate={order.plate} size="xs" />
          <span className="text-[10px] text-[var(--text-muted)] truncate">{order.customerName}</span>
        </div>
      </div>
      <OsStatusBadge status={order.status} size="sm" dot compact />
    </Link>
  )
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function OsCardKanban({ order, className }: { order: ServiceOrder; className?: string }) {
  const entryDate    = new Date(order.entryDate)
  const hoursElapsed = Math.floor((Date.now() - entryDate.getTime()) / 3_600_000)
  const daysElapsed  = Math.floor(hoursElapsed / 24)
  const isLate       = hoursElapsed > 48

  return (
    <div
      className={cn(
        'rounded border border-[var(--border)] bg-[var(--surface)] p-3',
        'hover:border-[var(--border-strong)] hover:shadow-card-md',
        'transition-all duration-[150ms] cursor-pointer select-none',
        isLate && 'border-l-2 border-l-[var(--os-atrasado-text)]',
        className,
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-[var(--text-muted)] os-code">#{order.number}</span>
          <PriorityChip priority={order.priority} size="xs" showLabel={false} />
        </div>
        <OsTypeBadge type={order.type} size="sm" />
      </div>

      <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight mb-1 truncate">
        {order.vehicle}
      </p>

      <div className="flex items-center gap-1.5 mb-2.5">
        <VehiclePlate plate={order.plate} size="xs" />
        <span className="text-[10px] text-[var(--text-muted)] truncate flex-1">{order.customerName}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px]" style={{ color: isLate ? 'var(--os-atrasado-text)' : 'var(--text-muted)' }}>
          {isLate ? <AlertTriangle size={10} /> : <Clock size={10} />}
          <span>{daysElapsed > 0 ? `${daysElapsed}d` : `${hoursElapsed}h`}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {order.commentsCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
              <MessageCircle size={10} />
              {order.commentsCount}
            </span>
          )}
          <Avatar initials={order.mechanic.initials} />
        </div>
      </div>
    </div>
  )
}

// ── Detailed: full card for OS detail pages ───────────────────────────────────

function OsCardDetailed({ order, className }: { order: ServiceOrder; className?: string }) {
  const entryDate    = new Date(order.entryDate)
  const hoursElapsed = Math.floor((Date.now() - entryDate.getTime()) / 3_600_000)
  const daysElapsed  = Math.floor(hoursElapsed / 24)
  const isLate       = hoursElapsed > 48

  return (
    <div
      className={cn(
        'rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden',
        className,
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <PriorityBar priority={order.priority} className="h-10" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[11px] font-semibold text-[var(--text-secondary)] os-code">
              OS #{order.number}
            </span>
            <OsTypeBadge type={order.type} />
            <OsStatusBadge status={order.status} dot />
          </div>
          <p className="text-[14px] font-bold text-[var(--text-primary)] truncate">{order.vehicle}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{order.customerName}</p>
        </div>
        <VehiclePlate plate={order.plate} size="md" />
      </div>

      {/* Body */}
      <div className="grid grid-cols-2 gap-px bg-[var(--border)] overflow-hidden">
        {[
          { label: 'Entrada',     value: formatDate(order.entryDate) },
          { label: 'Tempo parado', value: isLate
              ? <span style={{ color: 'var(--os-atrasado-text)' }}>{daysElapsed}d {hoursElapsed % 24}h ⚠</span>
              : `${daysElapsed}d ${hoursElapsed % 24}h`
          },
          { label: 'Responsável', value: order.mechanic.name },
          { label: 'Valor est.',  value: <span className="financial-value">{formatCurrency(order.estimatedValue)}</span> },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[var(--surface)] px-4 py-2.5">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {order.description && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Descrição</p>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{order.description}</p>
        </div>
      )}
    </div>
  )
}
