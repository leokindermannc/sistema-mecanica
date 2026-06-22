import type { ScheduleAppointment } from '../../types'
import { cn } from '../../lib/utils'
import { VehiclePlate } from './vehicle-plate'

// ── Agenda Item — compact row for schedule list ───────────────────────────────

const APPOINTMENT_TYPE_MAP: Record<string, { label: string; cssText: string; cssBg: string; cssBorder: string }> = {
  REVISAO:         { label: 'Revisão',    cssText: 'var(--os-revisao-text)',   cssBg: 'var(--os-revisao-bg)',   cssBorder: 'var(--os-revisao-border)'   },
  REPARO:          { label: 'Reparo',     cssText: 'var(--os-andamento-text)', cssBg: 'var(--os-andamento-bg)', cssBorder: 'var(--os-andamento-border)' },
  ORCAMENTO:       { label: 'Orçamento',  cssText: 'var(--os-orcamento-text)', cssBg: 'var(--os-orcamento-bg)', cssBorder: 'var(--os-orcamento-border)' },
  RETORNO_GARANTIA:{ label: 'Garantia',   cssText: 'var(--os-garantia-text)',  cssBg: 'var(--os-garantia-bg)',  cssBorder: 'var(--os-garantia-border)'  },
}

const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  AGENDADO:       'var(--os-agendado-text)',
  CONFIRMADO:     'var(--os-andamento-text)',
  REALIZADO:      'var(--os-concluido-text)',
  NAO_COMPARECEU: 'var(--os-cancelado-text)',
  CANCELADO:      'var(--os-cancelado-text)',
}

interface AgendaItemProps {
  appointment: ScheduleAppointment
  compact?: boolean
  className?: string
}

export function AgendaItem({ appointment, compact = false, className }: AgendaItemProps) {
  const typeConfig = APPOINTMENT_TYPE_MAP[appointment.type] ?? APPOINTMENT_TYPE_MAP.REVISAO
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status] ?? 'var(--text-muted)'

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors', className)}>
        <span className="font-mono text-[11px] font-semibold text-[var(--text-muted)] w-10 flex-shrink-0">
          {appointment.time}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">
            {appointment.customerName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-[var(--text-muted)] truncate flex-1">{appointment.vehicle}</span>
            <VehiclePlate plate={appointment.plate} size="xs" />
          </div>
        </div>
        <span
          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-sm border flex-shrink-0"
          style={{
            color:           typeConfig.cssText,
            backgroundColor: typeConfig.cssBg,
            borderColor:     typeConfig.cssBorder,
          }}
        >
          {typeConfig.label}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3 p-3 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-card-md transition-all duration-[150ms]', className)}>
      {/* Time column */}
      <div className="flex flex-col items-center w-10 flex-shrink-0 pt-0.5">
        <span className="font-mono text-[13px] font-bold text-[var(--text-primary)] leading-none">{appointment.time}</span>
        <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
          {appointment.duration}min
        </span>
        {/* Status dot */}
        <div
          className="w-1.5 h-1.5 rounded-full mt-1.5"
          style={{ backgroundColor: statusColor }}
          title={appointment.status}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
            {appointment.customerName}
          </p>
          <span
            className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-sm border flex-shrink-0"
            style={{
              color:           typeConfig.cssText,
              backgroundColor: typeConfig.cssBg,
              borderColor:     typeConfig.cssBorder,
            }}
          >
            {typeConfig.label}
          </span>
        </div>

        <p className="text-[11px] text-[var(--text-secondary)] truncate mb-1.5">{appointment.vehicle}</p>

        <div className="flex items-center gap-2">
          <VehiclePlate plate={appointment.plate} size="xs" />
          {appointment.mechanicName && (
            <span className="text-[10px] text-[var(--text-muted)]">· {appointment.mechanicName}</span>
          )}
        </div>
      </div>
    </div>
  )
}
