import { useState, useMemo } from 'react'
import { Landmark, TrendingUp, TrendingDown, Plus, ArrowDownCircle, ArrowUpCircle, Minus } from 'lucide-react'
import type { CaixaSession, CaixaMovement, CaixaMovementType } from '../../types'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { toast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtTime  = (s: string) => new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const fmtDT    = (s: string) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const MOVEMENT_CFG: Record<CaixaMovementType, { label: string; color: string; sign: 1 | -1 | 0 }> = {
  ABERTURA:     { label: 'Abertura de caixa',  color: 'var(--info)',        sign:  1 },
  RECEBIMENTO:  { label: 'Recebimento',         color: 'var(--success)',    sign:  1 },
  PAGAMENTO:    { label: 'Pagamento',           color: 'var(--danger)',     sign: -1 },
  SANGRIA:      { label: 'Sangria',             color: 'var(--warning)',    sign: -1 },
  SUPRIMENTO:   { label: 'Suprimento',          color: 'var(--info)',       sign:  1 },
  FECHAMENTO:   { label: 'Fechamento',          color: 'var(--text-muted)', sign:  0 },
}

const MOCK_SESSION: CaixaSession = {
  id: 'cx1',
  openedAt: new Date().toISOString().replace(/T.*/, 'T08:00:00'),
  openedBy: 'Admin',
  openingBalance: 300,
  expectedBalance: 0,
  status: 'ABERTO',
  movements: [
    { id: 'mov1', type: 'ABERTURA',    description: 'Abertura do caixa',               value: 300,    userId: 'u1', userName: 'Admin',          createdAt: new Date().toISOString().replace(/T.*/, 'T08:00:00') },
    { id: 'mov2', type: 'RECEBIMENTO', description: 'OS-2026-000009 — Maria Silva',    value: 395,    userId: 'u1', userName: 'Admin',          createdAt: new Date().toISOString().replace(/T.*/, 'T09:30:00'), relatedId: 'os9' },
    { id: 'mov3', type: 'RECEBIMENTO', description: 'OS-2026-000010 — Pedro Alves',    value: 320,    userId: 'u1', userName: 'Admin',          createdAt: new Date().toISOString().replace(/T.*/, 'T10:15:00'), relatedId: 'os10' },
    { id: 'mov4', type: 'PAGAMENTO',   description: 'Compra de óleo e filtros',        value: 184,    userId: 'u1', userName: 'Admin',          createdAt: new Date().toISOString().replace(/T.*/, 'T11:00:00') },
    { id: 'mov5', type: 'SANGRIA',     description: 'Sangria — depósito bancário',     value: 500,    userId: 'u1', userName: 'Admin',          createdAt: new Date().toISOString().replace(/T.*/, 'T12:00:00') },
    { id: 'mov6', type: 'RECEBIMENTO', description: 'OS-2026-000007 — Pedro Alves',    value: 750,    userId: 'u1', userName: 'Admin',          createdAt: new Date().toISOString().replace(/T.*/, 'T14:30:00'), relatedId: 'os7' },
  ],
}

export function CaixaPage() {
  const [session, setSession] = useState<CaixaSession>(MOCK_SESSION)
  const [showFechamento, setShowFechamento] = useState(false)
  const [showMovimento, setShowMovimento]   = useState<'RECEBIMENTO' | 'SANGRIA' | 'SUPRIMENTO' | 'PAGAMENTO' | null>(null)
  const [novoValor, setNovoValor]   = useState('')
  const [novaDesc, setNovaDesc]     = useState('')
  const [novoPagamento, setNovoPagamento] = useState('DINHEIRO')

  const totais = useMemo(() => {
    const entradas = session.movements.filter(m => MOVEMENT_CFG[m.type].sign === 1).reduce((s, m) => s + m.value, 0)
    const saidas   = session.movements.filter(m => MOVEMENT_CFG[m.type].sign === -1).reduce((s, m) => s + m.value, 0)
    return { entradas, saidas, saldo: entradas - saidas }
  }, [session.movements])

  function addMovement(type: CaixaMovementType, value: number, description: string) {
    const mov: CaixaMovement = {
      id: `mov${Date.now()}`,
      type,
      description,
      value,
      paymentMethod: novoPagamento,
      userId: 'u1',
      userName: 'Admin',
      createdAt: new Date().toISOString(),
    }
    setSession(prev => ({ ...prev, movements: [...prev.movements, mov] }))
    toast.success(`${MOVEMENT_CFG[type].label} registrado: ${fmtMoney(value)}`)
    setNovoValor('')
    setNovaDesc('')
    setShowMovimento(null)
  }

  function fecharCaixa(reason?: string) {
    setSession(prev => ({
      ...prev,
      status: 'FECHADO',
      closedAt: new Date().toISOString(),
      closedBy: 'Admin',
      countedBalance: totais.saldo,
      difference: 0,
      movements: [...prev.movements, {
        id: `mov${Date.now()}`,
        type: 'FECHAMENTO' as CaixaMovementType,
        description: reason ? `Fechamento — ${reason}` : 'Fechamento de caixa',
        value: totais.saldo,
        userId: 'u1',
        userName: 'Admin',
        createdAt: new Date().toISOString(),
      }],
    }))
    toast.success('Caixa fechado com sucesso')
  }

  const inputClass = 'w-full h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] text-[13px] text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50'

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* ── Fixed header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* Title row */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Caixa</h1>
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', session.status === 'ABERTO'
              ? 'text-[var(--success)] bg-[var(--success-subtle)] border-[var(--success-border)]'
              : 'text-[var(--text-muted)] bg-[var(--surface-muted)] border-[var(--border)]')}>
              {session.status === 'ABERTO' ? 'Aberto' : 'Fechado'}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Aberto às {fmtTime(session.openedAt)} por {session.openedBy}
              {session.closedAt && ` · Fechado às ${fmtDT(session.closedAt)}`}
            </span>
          </div>
          {session.status === 'ABERTO' && (
            <button onClick={() => setShowFechamento(true)}
              className="h-8 px-4 rounded-lg border border-[var(--border)] text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors flex-shrink-0">
              Fechar caixa
            </button>
          )}
        </div>

        {/* Saldo chips */}
        <div className="flex items-center gap-4 mb-3">
          {[
            { label: 'Entradas', value: totais.entradas, color: '#16A34A', icon: <TrendingUp size={12} /> },
            { label: 'Saídas',   value: totais.saidas,   color: '#DC2626', icon: <TrendingDown size={12} /> },
            { label: 'Saldo',    value: totais.saldo,    color: totais.saldo >= 0 ? '#16A34A' : '#DC2626', icon: <Landmark size={12} /> },
          ].map((k, i) => (
            <div key={k.label} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-4 bg-[var(--border)]" />}
              <div className="flex items-center gap-1.5 text-[12px]">
                <span style={{ color: k.color }}>{k.icon}</span>
                <span className="text-[var(--text-muted)]">{k.label}:</span>
                <span className="font-bold tabular-nums financial-value" style={{ color: k.color }}>{fmtMoney(k.value)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {session.status === 'ABERTO' && (
          <div className="flex flex-wrap gap-1.5">
            {[
              { type: 'RECEBIMENTO' as const, label: 'Recebimento', icon: <ArrowDownCircle size={12} />, color: 'var(--success)' },
              { type: 'PAGAMENTO'   as const, label: 'Pagamento',   icon: <ArrowUpCircle size={12} />,   color: 'var(--danger)' },
              { type: 'SANGRIA'     as const, label: 'Sangria',     icon: <Minus size={12} />,           color: 'var(--warning)' },
              { type: 'SUPRIMENTO'  as const, label: 'Suprimento',  icon: <Plus size={12} />,            color: 'var(--info)' },
            ].map(a => (
              <button key={a.type} onClick={() => setShowMovimento(a.type)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
                <span style={{ color: a.color }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-5 space-y-4">

      {/* Movimento form */}
      {showMovimento && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 mb-5 shadow-[var(--shadow-card)]">
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">{MOVEMENT_CFG[showMovimento].label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">Valor (R$) *</label>
              <input type="number" min="0.01" step="0.01" className={inputClass} value={novoValor} onChange={e => setNovoValor(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">Forma de pagamento</label>
              <select className={inputClass} value={novoPagamento} onChange={e => setNovoPagamento(e.target.value)}>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO_DEBITO">Cartão Débito</option>
                <option value="CARTAO_CREDITO">Cartão Crédito</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">Descrição</label>
              <input className={inputClass} value={novaDesc} onChange={e => setNovaDesc(e.target.value)} placeholder="Descreva o lançamento..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowMovimento(null)} className="h-8 px-4 rounded-lg border border-[var(--border)] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">Cancelar</button>
            <button
              onClick={() => {
                const v = parseFloat(novoValor)
                if (!v || v <= 0) { toast.error('Informe um valor válido'); return }
                addMovement(showMovimento, v, novaDesc || MOVEMENT_CFG[showMovimento].label)
              }}
              className="h-8 px-4 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold hover:bg-[var(--brand-dark)] transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Movimentos list */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
          <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Movimentações do dia — {session.movements.length} lançamentos</p>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Hora</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tipo</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden md:table-cell">Descrição</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Valor</th>
            </tr>
          </thead>
          <tbody>
            {session.movements.map(mov => {
              const cfg  = MOVEMENT_CFG[mov.type]
              const sign = cfg.sign
              return (
                <tr key={mov.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-[11px]">{fmtTime(mov.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] hidden md:table-cell">{mov.description}</td>
                  <td className={cn('px-4 py-3 text-right font-semibold financial-value', sign === 0 ? 'text-[var(--text-muted)]' : sign > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
                    {sign > 0 ? '+' : sign < 0 ? '−' : ''} {fmtMoney(mov.value)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-muted)]">
              <td colSpan={3} className="px-4 py-3 text-[12px] font-semibold text-[var(--text-secondary)]">Saldo atual</td>
              <td className={cn('px-4 py-3 text-right text-[14px] font-bold financial-value', totais.saldo >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
                {fmtMoney(totais.saldo)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      </div>

      <ConfirmModal
        open={showFechamento}
        onClose={() => setShowFechamento(false)}
        onConfirm={fecharCaixa}
        title="Fechar caixa"
        message={`Saldo atual: ${fmtMoney(totais.saldo)}. Confirme o fechamento do caixa.`}
        confirmLabel="Fechar caixa"
        requireReason={false}
        variant="default"
      />
    </div>
  )
}
