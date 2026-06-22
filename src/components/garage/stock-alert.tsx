import type { Part } from '../../types'
import { Package, ShoppingCart, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getStockStatus } from '../../lib/utils'

// ── Stock Alert Row ───────────────────────────────────────────────────────────

interface StockAlertRowProps {
  part: Part
  onReorder?: (part: Part) => void
  className?: string
}

export function StockAlertRow({ part, onReorder, className }: StockAlertRowProps) {
  const status = getStockStatus(part.currentStock, part.minimumStock)

  const cfg = {
    NORMAL:      { color: 'var(--success)',   bg: 'var(--success-subtle)',  border: 'var(--success-border)',  label: 'Normal'      },
    BAIXO:       { color: 'var(--warning)',   bg: 'var(--warning-subtle)',  border: 'var(--warning-border)',  label: 'Estoque baixo' },
    SEM_ESTOQUE: { color: 'var(--danger)',    bg: 'var(--danger-subtle)',   border: 'var(--danger-border)',   label: 'Sem estoque' },
  }[status]

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors',
        className,
      )}
    >
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {status === 'SEM_ESTOQUE' ? <AlertTriangle size={13} /> : <Package size={13} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[var(--text-primary)] truncate leading-tight">
          {part.description}
        </p>
        <p className="text-[10px] text-[var(--text-muted)] font-mono">{part.internalCode}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p
            className="text-[11px] font-semibold leading-tight"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {part.currentStock}/{part.minimumStock} {part.unit}
          </p>
        </div>

        {onReorder && (
          <button
            onClick={() => onReorder(part)}
            className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
            title="Solicitar reposição"
          >
            <ShoppingCart size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Stock Alert Card — larger standalone card ─────────────────────────────────

interface StockAlertCardProps {
  part: Part
  showSupplier?: boolean
  showLastPurchase?: boolean
  onReorder?: (part: Part) => void
  className?: string
}

export function StockAlertCard({
  part,
  showSupplier = false,
  onReorder,
  className,
}: StockAlertCardProps) {
  const status = getStockStatus(part.currentStock, part.minimumStock)

  const cfg = {
    NORMAL:      { color: 'var(--success)', bg: 'var(--success-subtle)', border: 'var(--success-border)' },
    BAIXO:       { color: 'var(--warning)', bg: 'var(--warning-subtle)', border: 'var(--warning-border)' },
    SEM_ESTOQUE: { color: 'var(--danger)',  bg: 'var(--danger-subtle)',  border: 'var(--danger-border)'  },
  }[status]

  const pct = part.minimumStock > 0 ? Math.min((part.currentStock / part.minimumStock) * 100, 100) : 0

  return (
    <div
      className={cn(
        'rounded-md border bg-[var(--surface)] p-3 transition-all duration-[150ms]',
        'hover:shadow-card-md',
        className,
      )}
      style={{ borderColor: cfg.border, boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{part.description}</p>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">{part.internalCode}</p>
        </div>
        <span
          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-sm border leading-tight flex-shrink-0"
          style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
        >
          {status === 'SEM_ESTOQUE' ? 'Sem estoque' : status === 'BAIXO' ? 'Baixo' : 'Normal'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
          <span>Atual: <strong style={{ color: cfg.color }}>{part.currentStock}</strong></span>
          <span>Mínimo: {part.minimumStock} {part.unit}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: cfg.color }}
          />
        </div>
      </div>

      {showSupplier && part.supplierName && (
        <p className="text-[10px] text-[var(--text-muted)] mb-2">
          Fornecedor: <span className="text-[var(--text-secondary)]">{part.supplierName}</span>
        </p>
      )}

      {onReorder && (
        <button
          onClick={() => onReorder(part)}
          className="w-full flex items-center justify-center gap-1.5 h-6 text-[11px] font-medium rounded border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] hover:bg-[var(--brand-muted)] transition-all"
        >
          <ShoppingCart size={11} />
          Solicitar reposição
        </button>
      )}
    </div>
  )
}
