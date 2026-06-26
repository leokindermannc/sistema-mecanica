import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Users, Shield, Wrench,
  ChevronRight, Phone, Mail, X, Calendar,
  CheckCircle2, AlertTriangle, Save, Trash2,
} from 'lucide-react'
import { mockUsers } from '../../mocks/users'
import { cn } from '../../lib/utils'
import type { SystemUser, SystemUserRole, SystemUserStatus } from '../../types'

// ── Config ────────────────────────────────────────────────────────────────────

const ROLE_CFG: Record<SystemUserRole, { label: string; color: string; bg: string }> = {
  ADMINISTRADOR: { label: 'Administrador', color: '#D4601A', bg: 'rgba(212,96,26,0.10)' },
  GERENTE:       { label: 'Gerente',       color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  MECANICO:      { label: 'Mecânico',      color: '#1A6B35', bg: 'rgba(26,107,53,0.10)'  },
  RECEPCIONISTA: { label: 'Recepcionista', color: '#1A4E8C', bg: 'rgba(26,78,140,0.10)'  },
}

const STATUS_CFG: Record<SystemUserStatus, { label: string; color: string }> = {
  ATIVO:   { label: 'Ativo',   color: 'var(--success)'    },
  INATIVO: { label: 'Inativo', color: 'var(--text-muted)' },
}

const CARGO_INFO: Record<SystemUserRole, { desc: string; icon: React.ReactNode }> = {
  ADMINISTRADOR: { desc: 'Acesso total ao sistema, incluindo configurações e dados financeiros.',      icon: <Shield size={16} /> },
  GERENTE:       { desc: 'Supervisão da equipe e relatórios. Sem acesso a configurações do sistema.', icon: <Users  size={16} /> },
  MECANICO:      { desc: 'Acesso às ordens de serviço atribuídas e registro de trabalho.',            icon: <Wrench size={16} /> },
  RECEPCIONISTA: { desc: 'Abertura de OS, agenda, clientes e veículos. Sem acesso financeiro.',       icon: <Users  size={16} /> },
}

type Tab = 'usuarios' | 'cargos' | 'permissoes'
const TABS: { key: Tab; label: string }[] = [
  { key: 'usuarios',   label: 'Usuários'   },
  { key: 'cargos',     label: 'Cargos'     },
  { key: 'permissoes', label: 'Permissões' },
]

const SI = 'h-8 w-full rounded border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)] transition-all'

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-[12px] font-semibold shadow-lg pointer-events-none animate-fade-in"
      style={{ backgroundColor: type === 'success' ? 'var(--success)' : 'var(--danger)' }}
    >
      {type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      {msg}
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditForm {
  name: string; email: string; phone: string
  role: SystemUserRole; specialty: string
}

function EditModal({ user, onSave, onClose }: {
  user: SystemUser
  onSave: (updated: SystemUser) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<EditForm>({
    name:      user.name,
    email:     user.email      ?? '',
    phone:     user.phone      ?? '',
    role:      user.role,
    specialty: user.specialty  ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({})

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function field(k: keyof EditForm, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
  }

  function handleSave() {
    const e: Partial<Record<keyof EditForm, string>> = {}
    if (!form.name.trim())  e.name  = 'Nome obrigatório'
    if (!form.email.trim()) e.email = 'E-mail obrigatório'
    setErrors(e)
    if (Object.keys(e).length) return

    const initials = form.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    onSave({
      ...user,
      name:      form.name.trim(),
      email:     form.email.trim(),
      phone:     form.phone.trim(),
      role:      form.role,
      specialty: form.specialty.trim() || undefined,
      initials,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[440px] bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)]">
          <p className="text-[14px] font-bold text-[var(--text-primary)]">Editar usuário</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors">
            <X size={15} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4 overflow-y-auto">

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Nome completo *
            </label>
            <input
              value={form.name}
              onChange={e => field('name', e.target.value)}
              placeholder="Ex.: Carlos Mendes"
              className={cn(SI, errors.name && 'border-[var(--danger)] focus:border-[var(--danger)]')}
            />
            {errors.name && <p className="text-[10px] text-[var(--danger)] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              E-mail *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => field('email', e.target.value)}
              placeholder="carlos@garagepro.com.br"
              className={cn(SI, errors.email && 'border-[var(--danger)] focus:border-[var(--danger)]')}
            />
            {errors.email && <p className="text-[10px] text-[var(--danger)] mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Telefone
            </label>
            <input
              value={form.phone}
              onChange={e => field('phone', e.target.value)}
              placeholder="(11) 99999-0001"
              className={SI}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Cargo
            </label>
            <select
              value={form.role}
              onChange={e => field('role', e.target.value as SystemUserRole)}
              className={SI}
            >
              {(Object.entries(ROLE_CFG) as [SystemUserRole, typeof ROLE_CFG[SystemUserRole]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {form.role === 'MECANICO' && (
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                Especialidade
              </label>
              <input
                value={form.specialty}
                onChange={e => field('specialty', e.target.value)}
                placeholder="Ex.: Motor e Câmbio"
                className={SI}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--brand)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
          >
            <Save size={12} /> Salvar alterações
          </button>
          <button
            onClick={onClose}
            className="h-8 px-4 rounded text-[12px] font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add User Modal ────────────────────────────────────────────────────────────

function AddUserModal({ onSave, onClose }: {
  onSave: (user: SystemUser) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<EditForm>({
    name: '', email: '', phone: '', role: 'MECANICO', specialty: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({})

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function field(k: keyof EditForm, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
  }

  function handleSave() {
    const e: Partial<Record<keyof EditForm, string>> = {}
    if (!form.name.trim())  e.name  = 'Nome obrigatório'
    if (!form.email.trim()) e.email = 'E-mail obrigatório'
    setErrors(e)
    if (Object.keys(e).length) return

    const initials = form.name.trim().split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    onSave({
      id:        `u${Date.now()}`,
      name:      form.name.trim(),
      initials,
      email:     form.email.trim(),
      phone:     form.phone.trim(),
      role:      form.role,
      status:    'ATIVO',
      specialty: form.specialty.trim() || undefined,
      joinDate:  new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[440px] bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)]">
          <p className="text-[14px] font-bold text-[var(--text-primary)]">Novo usuário</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors">
            <X size={15} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Nome completo *</label>
            <input value={form.name} onChange={e => field('name', e.target.value)} placeholder="Ex.: Carlos Mendes"
              className={cn(SI, errors.name && 'border-[var(--danger)] focus:border-[var(--danger)]')} />
            {errors.name && <p className="text-[10px] text-[var(--danger)] mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">E-mail *</label>
            <input type="email" value={form.email} onChange={e => field('email', e.target.value)} placeholder="carlos@garagepro.com.br"
              className={cn(SI, errors.email && 'border-[var(--danger)] focus:border-[var(--danger)]')} />
            {errors.email && <p className="text-[10px] text-[var(--danger)] mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Telefone</label>
            <input value={form.phone} onChange={e => field('phone', e.target.value)} placeholder="(11) 99999-0001" className={SI} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Cargo</label>
            <select value={form.role} onChange={e => field('role', e.target.value as SystemUserRole)} className={SI}>
              {(Object.entries(ROLE_CFG) as [SystemUserRole, typeof ROLE_CFG[SystemUserRole]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          {form.role === 'MECANICO' && (
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Especialidade</label>
              <input value={form.specialty} onChange={e => field('specialty', e.target.value)} placeholder="Ex.: Motor e Câmbio" className={SI} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 h-8 px-4 rounded text-[12px] font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--brand)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
          >
            <Plus size={12} /> Adicionar usuário
          </button>
          <button onClick={onClose}
            className="h-8 px-4 rounded text-[12px] font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User Detail Drawer ────────────────────────────────────────────────────────

function UserDrawer({ user, onClose, onEdit, onToggleStatus, onDelete }: {
  user: SystemUser | null
  onClose: () => void
  onEdit: () => void
  onToggleStatus: (u: SystemUser) => void
  onDelete: (u: SystemUser) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setConfirmDelete(false)
  }, [user])

  useEffect(() => {
    if (!user) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [user, onClose])

  const roleCfg   = user ? ROLE_CFG[user.role]    : null
  const statusCfg = user ? STATUS_CFG[user.status] : null

  return (
    <>
      {user && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />}

      <div className={cn(
        'fixed right-0 top-[44px] bottom-0 z-50 w-[380px] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col transition-transform duration-200 ease-in-out',
        user ? 'translate-x-0' : 'translate-x-full',
      )}>
        {user && roleCfg && statusCfg && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-muted)]">
              <p className="text-[13px] font-bold text-[var(--text-primary)]">Detalhes do usuário</p>
              <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors">
                <X size={15} className="text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Avatar + name */}
              <div className="flex flex-col items-center gap-3 px-6 py-6 border-b border-[var(--border)]">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-extrabold"
                  style={{ backgroundColor: roleCfg.bg, color: roleCfg.color }}
                >
                  {user.initials ?? user.name.charAt(0)}
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-extrabold text-[var(--text-primary)]">{user.name}</p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{user.email ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: roleCfg.color, backgroundColor: roleCfg.bg }}
                  >
                    {roleCfg.label}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: statusCfg.color, backgroundColor: statusCfg.color + '14' }}
                  >
                    {user.status === 'ATIVO' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="px-5 py-4 space-y-4">
                {user.phone && (
                  <InfoRow icon={<Phone size={13} />} label="Telefone" value={user.phone} />
                )}
                {user.email && (
                  <InfoRow icon={<Mail size={13} />} label="E-mail" value={user.email} />
                )}
                {user.joinDate && (
                  <InfoRow icon={<Calendar size={13} />} label="Membro desde" value={user.joinDate} />
                )}
                {user.specialty && (
                  <InfoRow icon={<Wrench size={13} />} label="Especialidade" value={user.specialty} />
                )}
              </div>

              {/* Role description */}
              <div className="mx-5 mb-4 p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Sobre o cargo</p>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  {CARGO_INFO[user.role]?.desc}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-[var(--border)] space-y-2">
              <button
                onClick={onEdit}
                className="w-full h-9 rounded text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--brand)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
              >
                Editar usuário
              </button>
              <button
                onClick={() => onToggleStatus(user)}
                className={cn(
                  'w-full h-9 rounded text-[12px] font-semibold border transition-colors',
                  user.status === 'ATIVO'
                    ? 'border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-subtle)]'
                    : 'border-[var(--success)] text-[var(--success)] hover:bg-[var(--success-subtle)]',
                )}
              >
                {user.status === 'ATIVO' ? 'Desativar usuário' : 'Reativar usuário'}
              </button>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full h-9 rounded text-[12px] font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={12} /> Excluir usuário
                </button>
              ) : (
                <div className="rounded border border-[var(--danger)] bg-[var(--danger-subtle)] p-3 space-y-2">
                  <p className="text-[11px] text-[var(--danger)] font-semibold text-center">
                    Excluir <strong>{user.name}</strong>? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDelete(user)}
                      className="flex-1 h-8 rounded text-[12px] font-semibold text-white bg-[var(--danger)] hover:opacity-90 transition-opacity"
                    >
                      Confirmar exclusão
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 h-8 rounded text-[12px] font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[var(--text-muted)] flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
        <p className="text-[13px] text-[var(--text-primary)] mt-0.5 break-all">{value}</p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function EquipePage() {
  const [users,        setUsers]        = useState<SystemUser[]>([...mockUsers])
  const [tab,          setTab]          = useState<Tab>('usuarios')
  const [search,       setSearch]       = useState('')
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [editOpen,     setEditOpen]     = useState(false)
  const [addOpen,      setAddOpen]      = useState(false)
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleToggleStatus = useCallback((u: SystemUser) => {
    const next = u.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: next as SystemUserStatus } : x))
    setSelectedUser(prev => prev?.id === u.id ? { ...prev, status: next as SystemUserStatus } : prev)
    showToast(`${u.name} foi ${next === 'ATIVO' ? 'reativado' : 'desativado'} com sucesso.`)
  }, [])

  const handleSaveEdit = useCallback((updated: SystemUser) => {
    setUsers(prev => prev.map(x => x.id === updated.id ? updated : x))
    setSelectedUser(updated)
    setEditOpen(false)
    showToast(`Dados de ${updated.name} atualizados com sucesso.`)
  }, [])

  const handleAddUser = useCallback((user: SystemUser) => {
    setUsers(prev => [...prev, user])
    setAddOpen(false)
    showToast(`${user.name} adicionado com sucesso.`)
  }, [])

  const handleDeleteUser = useCallback((user: SystemUser) => {
    setUsers(prev => prev.filter(x => x.id !== user.id))
    setSelectedUser(null)
    showToast(`${user.name} foi excluído.`)
  }, [])

  const stats = useMemo(() => ({
    total:  users.length,
    ativos: users.filter(u => u.status === 'ATIVO').length,
    cargos: [...new Set(users.map(u => u.role))].length,
  }), [users])

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      ROLE_CFG[u.role]?.label.toLowerCase().includes(q),
    )
  }, [search, users])

  const cargosList = useMemo(
    () => Object.entries(ROLE_CFG) as [SystemUserRole, typeof ROLE_CFG[SystemUserRole]][],
    [],
  )

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* Fixed header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">

        {/* Title + CTA */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Equipe</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Gerencie usuários, cargos e permissões de acesso.</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-white text-[11px] font-bold transition-all hover:shadow-md hover:-translate-y-px flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Novo usuário
          </button>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-3">
          {[
            { label: 'Usuários', value: stats.total,  color: '#6B7280' },
            { label: 'Ativos',   value: stats.ativos, color: '#16A34A' },
            { label: 'Cargos',   value: stats.cargos, color: '#7C3AED' },
          ].map((k, i) => (
            <div key={k.label} className="flex items-center gap-3">
              {i > 0 && <span className="w-px h-3.5 bg-[var(--border)] flex-shrink-0" />}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: k.color }} />
                <span className="font-bold tabular-nums" style={{ color: k.color }}>{k.value}</span>
                <span className="text-[var(--text-muted)]">{k.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4">

        {/* Tab panel */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4">
            <div className="flex" role="tablist">
              {TABS.map(t => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'relative h-10 px-3 text-[12px] font-medium transition-colors duration-[140ms]',
                    tab === t.key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                  )}
                >
                  {t.label}
                  {tab === t.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ backgroundColor: 'var(--brand)' }} />
                  )}
                </button>
              ))}
            </div>

            {tab === 'usuarios' && (
              <div className="relative hidden sm:flex items-center">
                <Search size={12} className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nome, e-mail ou cargo..."
                  className="h-7 w-44 pl-7 pr-3 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 focus:bg-[var(--surface)] transition-all"
                />
              </div>
            )}
          </div>

          {/* Tab: Usuários */}
          {tab === 'usuarios' && (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2 bg-[var(--surface-muted)] border-b border-[var(--border)]">
                {['Usuário', 'Contato', 'Cargo', 'Status'].map(c => (
                  <span key={c} className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">{c}</span>
                ))}
              </div>
              <div className="divide-y divide-[var(--border)]">
                {filtered.length === 0
                  ? <div className="flex items-center justify-center py-10 text-[13px] text-[var(--text-muted)]">Nenhum usuário encontrado</div>
                  : filtered.map(u => {
                    const rc = ROLE_CFG[u.role]
                    const sc = STATUS_CFG[u.status]
                    const isSelected = selectedUser?.id === u.id
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUser(isSelected ? null : u)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 transition-colors group text-left border-l-2',
                          isSelected
                            ? 'bg-[var(--surface-hover)]'
                            : 'hover:bg-[var(--surface-hover)] border-transparent',
                        )}
                        style={isSelected ? { borderLeftColor: 'var(--brand)' } : undefined}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ backgroundColor: rc.bg, color: rc.color }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{u.name}</p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">{u.email ?? '—'}</p>
                          </div>
                          <span className="hidden sm:flex items-center gap-1 text-[12px] text-[var(--text-secondary)] w-36">
                            {u.phone
                              ? <><Phone size={10} className="text-[var(--text-muted)]" />{u.phone}</>
                              : u.email
                              ? <><Mail size={10} className="text-[var(--text-muted)]" /><span className="truncate max-w-[120px]">{u.email}</span></>
                              : '—'}
                          </span>
                          <span
                            className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm w-28 justify-center"
                            style={{ color: rc.color, backgroundColor: rc.bg }}
                          >
                            {rc.label}
                          </span>
                          <span
                            className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-sm w-16 justify-center"
                            style={{ color: sc.color, backgroundColor: sc.color + '14' }}
                          >
                            {sc.label}
                          </span>
                        </div>
                        {u.status === 'INATIVO' ? (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border flex-shrink-0"
                            style={{ color: 'var(--warning)', backgroundColor: 'var(--warning-subtle)', borderColor: 'var(--warning-border)' }}>
                            Reativar
                          </span>
                        ) : u.role === 'MECANICO' ? (
                          <Link to="/servicos"
                            onClick={e => e.stopPropagation()}
                            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border flex-shrink-0 hover:opacity-80 transition-opacity"
                            style={{ color: 'var(--brand)', backgroundColor: 'rgba(212,96,26,0.07)', borderColor: 'rgba(212,96,26,0.25)' }}>
                            Ver OS
                          </Link>
                        ) : (
                          <ChevronRight size={13} className="text-[var(--text-disabled)] group-hover:text-[var(--text-muted)] flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
              </div>
            </>
          )}

          {/* Tab: Cargos */}
          {tab === 'cargos' && (
            <div className="divide-y divide-[var(--border)]">
              {cargosList.map(([role, cfg]) => {
                const count = users.filter(u => u.role === role).length
                const info  = CARGO_INFO[role]
                return (
                  <div key={role} className="flex items-center gap-4 px-4 py-3">
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {info.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{cfg.label}</p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-snug">{info.desc}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--text-secondary)] flex-shrink-0">
                      {count} {count === 1 ? 'usuário' : 'usuários'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tab: Permissões */}
          {tab === 'permissoes' && (
            <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
              <Shield size={28} className="text-[var(--text-disabled)]" />
              <p className="text-[13px] font-semibold text-[var(--text-secondary)]">Controle de permissões</p>
              <p className="text-[12px] text-[var(--text-muted)] max-w-[280px]">
                Defina o que cada cargo pode acessar. Configure no módulo completo de usuários.
              </p>
              <Link
                to="/usuarios"
                className="mt-1 text-[12px] font-semibold flex items-center gap-1 hover:underline"
                style={{ color: 'var(--brand)' }}
              >
                Abrir módulo de usuários <ChevronRight size={12} />
              </Link>
            </div>
          )}

          {/* Footer */}
          {tab !== 'permissoes' && (
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                {tab === 'usuarios' && `${filtered.length} usuários`}
                {tab === 'cargos'   && `${cargosList.length} cargos`}
              </span>
            </div>
          )}
        </div>

      </div>

      <UserDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onEdit={() => setEditOpen(true)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteUser}
      />

      {editOpen && selectedUser && (
        <EditModal
          user={selectedUser}
          onSave={handleSaveEdit}
          onClose={() => setEditOpen(false)}
        />
      )}

      {addOpen && (
        <AddUserModal
          onSave={handleAddUser}
          onClose={() => setAddOpen(false)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
