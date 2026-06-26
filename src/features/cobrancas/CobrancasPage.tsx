import { useState, useMemo } from 'react'
import { Search, MessageCircle, Phone, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { mockFinance } from '../../mocks/finance'
import type { FinancialAccount } from '../../types'
import { toast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate  = (s: string) => new Date(s).toLocaleDateString('pt-BR')

function daysOverdue(dueDate: string): number {
  return Math.ceil((Date.now() - new Date(dueDate).getTime()) / 86400000)
}

function PriorityChip({ days }: { days: number }) {
  if (days >= 30) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border text-[var(--danger)] bg-[var(--danger-subtle)] border-[var(--danger-border)]"><AlertTriangle size={9} />+{days}d</span>
  if (days >= 7)  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border text-[var(--warning)] bg-[var(--warning-subtle)] border-[var(--warning-border)]"><Clock size={9} />{days}d</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border text-[var(--info)] bg-[var(--info-subtle)] border-[var(--info-border)]"><Clock size={9} />{days}d</span>
}

export function CobrancasPage() {
  const [search, setSearch] = useState('')
  const [contacted, setContacted] = useState<Set<string>>(new Set())

  const overdue: FinancialAccount[] = useMemo(() => {
    const q = search.toLowerCase()
    return mockFinance
      .filter(f => f.type === 'RECEBER' && (f.status === 'VENCIDA' || (f.status === 'ABERTA' && new Date(f.dueDate) < new Date())))
      .filter(f => !q || f.entity.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [search])

  const totalOverdue = overdue.reduce((s, f) => s + f.value, 0)

  function markContacted(id: string, method: string) {
    setContacted(prev => new Set([...prev, id]))
    toast.success(`Cobrança registrada via ${method}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* ── Fixed header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* Title row */}
        <div className="mb-3">
          <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Cobranças</h1>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Clientes com pagamentos vencidos ou em atraso</p>
        </div>

        {/* KPI chips + alert */}
        <div className="flex items-center gap-4 mb-3">
          {[
            { label: 'Em atraso',      value: overdue.length,                      color: '#DC2626' },
            { label: 'Total em aberto', value: fmtMoney(totalOverdue),             color: '#DC2626' },
            { label: 'Contatados',     value: `${contacted.size}/${overdue.length}`, color: '#16A34A' },
          ].map((k, i) => (
            <div key={k.label} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-3.5 bg-[var(--border)]" />}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: k.color }} />
                <span className="font-bold tabular-nums financial-value" style={{ color: k.color }}>{k.value}</span>
                <span className="text-[var(--text-muted)]">{k.label}</span>
              </div>
            </div>
          ))}
        </div>

        {overdue.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] mb-3"
            style={{ background: 'var(--danger-subtle)', borderColor: 'var(--danger-border)' }}>
            <AlertTriangle size={12} style={{ color: 'var(--danger)' }} className="flex-shrink-0" />
            <p className="font-semibold" style={{ color: 'var(--danger)' }}>
              {overdue.length} vencido{overdue.length > 1 ? 's' : ''} · {fmtMoney(totalOverdue)} em aberto — priorize os mais antigos
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-[340px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input type="text" placeholder="Buscar por cliente ou descrição..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[12px] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50" />
        </div>
      </div>

      {/* ── Scrollable list ── */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-5">
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
        {overdue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 size={32} className="text-[var(--success)] mb-3 opacity-60" />
            <p className="text-[14px] font-semibold text-[var(--text-secondary)] mb-1">Nenhuma cobrança pendente</p>
            <p className="text-[12px] text-[var(--text-muted)]">{search ? 'Nenhum resultado para a busca' : 'Todos os pagamentos estão em dia'}</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Cliente · Descrição</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden md:table-cell">Vencimento</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Atraso</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden lg:table-cell">Ação</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map(f => {
                const days   = daysOverdue(f.dueDate)
                const done   = contacted.has(f.id)
                return (
                  <tr key={f.id} className={cn('border-b border-[var(--border)] last:border-0 transition-colors', done ? 'opacity-50' : 'hover:bg-[var(--surface-hover)]')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{f.entity}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{f.description}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] hidden md:table-cell">{fmtDate(f.dueDate)}</td>
                    <td className="px-4 py-3">
                      {done
                        ? <span className="inline-flex items-center gap-1 text-[11px] text-[var(--success)] font-medium"><CheckCircle2 size={11} />Contatado</span>
                        : <PriorityChip days={days} />}
                    </td>
                    <td className="px-4 py-3 text-right font-bold financial-value text-[var(--danger)]">{fmtMoney(f.value)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {!done ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => markContacted(f.id, 'WhatsApp')}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                          >
                            <MessageCircle size={11} /> WhatsApp
                          </button>
                          <button
                            onClick={() => markContacted(f.id, 'telefone')}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                          >
                            <Phone size={11} /> Ligar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">Aguardando retorno</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  )
}
