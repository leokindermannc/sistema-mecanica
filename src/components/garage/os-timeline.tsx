import type { StatusHistoryEntry, ServiceOrderStatus } from '../../types'
import { CheckCircle2, Clock, User, MessageSquare, Smartphone } from 'lucide-react'
import { OS_STATUS_MAP } from '../../design-system/status-map'
import { cn } from '../../lib/utils'

interface TimelineEvent extends StatusHistoryEntry {
  isCurrentStatus?: boolean
  whatsappNotified?: boolean
  internalNote?: string
}

interface OsTimelineProps {
  events: TimelineEvent[]
  currentStatus: ServiceOrderStatus
  className?: string
}

export function OsTimeline({ events, currentStatus, className }: OsTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-[15px] top-5 bottom-5 w-px bg-[var(--border)]" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const cfg     = OS_STATUS_MAP[event.status]
          const isLast  = i === events.length - 1
          const isCurrent = event.status === currentStatus && isLast

          return (
            <div key={`${event.status}-${event.changedAt}`} className="flex gap-3 relative">
              {/* Status dot */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10',
                  isCurrent ? 'border-current' : 'border-[var(--border)] bg-[var(--surface)]',
                )}
                style={isCurrent
                  ? { borderColor: cfg.cssText, backgroundColor: cfg.cssBg, color: cfg.cssText }
                  : undefined
                }
              >
                {isCurrent
                  ? <Clock size={14} />
                  : <CheckCircle2 size={13} style={{ color: cfg.dot }} />
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {/* Status label */}
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-sm border"
                    style={{
                      color:           cfg.cssText,
                      backgroundColor: cfg.cssBg,
                      borderColor:     cfg.cssBorder,
                    }}
                  >
                    {cfg.label}
                  </span>

                  {/* WhatsApp notified */}
                  {event.whatsappNotified && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[var(--success)]">
                      <Smartphone size={10} />
                      Cliente notificado
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mb-1.5">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(event.changedAt).toLocaleString('pt-BR', {
                      day:    '2-digit',
                      month:  '2-digit',
                      year:   'numeric',
                      hour:   '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={10} />
                    {event.changedBy}
                  </span>
                </div>

                {/* Note */}
                {event.note && (
                  <div className="flex items-start gap-1.5 p-2 rounded bg-[var(--surface-muted)] border border-[var(--border)]">
                    <MessageSquare size={11} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug">{event.note}</p>
                  </div>
                )}

                {/* Internal note */}
                {event.internalNote && (
                  <div className="flex items-start gap-1.5 p-2 rounded bg-[var(--warning-subtle)] border border-[var(--warning-border)] mt-1">
                    <MessageSquare size={11} className="text-[var(--warning)] mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-[var(--warning)] leading-snug">{event.internalNote}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Future steps (pending) */}
        {getFutureSteps(currentStatus).map((step) => {
          const cfg = OS_STATUS_MAP[step]
          return (
            <div key={step} className="flex gap-3 relative opacity-40">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center flex-shrink-0 z-10 bg-[var(--surface)]">
                <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
              </div>
              <div className="flex-1 pt-2">
                <span className="text-[11px] text-[var(--text-muted)]">{cfg.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getFutureSteps(current: ServiceOrderStatus): ServiceOrderStatus[] {
  const flow: ServiceOrderStatus[] = [
    'AGENDADO', 'EM_ANALISE', 'AGUARDANDO_APROVACAO',
    'EM_ANDAMENTO', 'CONCLUIDO', 'ENTREGUE',
  ]
  const idx = flow.indexOf(current)
  if (idx === -1 || current === 'CANCELADO') return []
  return flow.slice(idx + 1)
}
