import { useState, useMemo } from 'react'
import {
  Plus, Search, X, Mail, Phone,
  MoreVertical, LayoutGrid, List,
  UserCog, Wrench, ClipboardList, Headphones,
  Shield,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { mockUsers } from '../../mocks/users'
import type { SystemUser, SystemUserRole, SystemUserStatus } from '../../types'

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_CFG: Record<SystemUserRole, {
  label: string
  color: string
  bg: string
  darkBg: string
  Icon: React.ElementType
}> = {
  ADMINISTRADOR: {
    label: 'Administrador',
    color: '#EA580C', bg: '#FFF7ED', darkBg: 'rgba(234,88,12,0.12)',
    Icon: Shield,
  },
  GERENTE: {
    label: 'Gerente',
    color: '#7C3AED', bg: '#F5F3FF', darkBg: 'rgba(124,58,237,0.12)',
    Icon: ClipboardList,
  },
  MECANICO: {
    label: 'Mecânico',
    color: '#1D4ED8', bg: '#EFF6FF', darkBg: 'rgba(29,78,216,0.12)',
    Icon: Wrench,
  },
  RECEPCIONISTA: {
    label: 'Recepcionista',
    color: '#0F766E', bg: '#F0FDFA', darkBg: 'rgba(15,118,110,0.12)',
    Icon: Headphones,
  },
}

const STATUS_CFG: Record<SystemUserStatus, { label: string; color: string; dot: string }> = {
  ATIVO:   { label: 'Ativo',   color: '#16A34A', dot: '#22C55E' },
  INATIVO: { label: 'Inativo', color: '#6B7280', dot: '#9CA3AF' },
}

const ROLE_FILTERS: Array<{ value: SystemUserRole | 'TODOS'; label: string }> = [
  { value: 'TODOS',         label: 'Todas as funções' },
  { value: 'ADMINISTRADOR', label: 'Administrador'    },
  { value: 'GERENTE',       label: 'Gerente'          },
  { value: 'MECANICO',      label: 'Mecânico'         },
  { value: 'RECEPCIONISTA', label: 'Recepcionista'    },
]

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ─── User Card ────────────────────────────────────────────────────────────────

function UserCard({ user }: { user: SystemUser }) {
  const role   = ROLE_CFG[user.role]
  const status = STATUS_CFG[user.status]
  const RoleIcon = role.Icon

  return (
    <div className="bg-t-card rounded-2xl border border-t-border overflow-hidden hover:shadow-card hover:border-gray-200 dark:hover:border-white/20 transition-all group">

      {/* Top accent strip */}
      <div className="h-[3px] w-full" style={{ backgroundColor: role.color }} />

      <div className="px-5 pt-4 pb-5 space-y-4">

        {/* Header: avatar + menu */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-center gap-2 flex-1">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-black tracking-wide shadow-sm"
              style={{ backgroundColor: role.bg, color: role.color }}
            >
              {user.initials}
            </div>
            {/* Name + Role */}
            <div className="text-center">
              <p className="text-[13px] font-bold text-t-text leading-tight">{user.name}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <RoleIcon size={9} style={{ color: role.color }} />
                <p className="text-[10px] text-t-muted">{role.label}</p>
              </div>
            </div>
            {/* Status */}
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                color: status.color,
                borderColor: `${status.color}30`,
                backgroundColor: `${status.color}10`,
              }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: status.dot }} />
              {status.label}
            </span>
          </div>

          <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-surface flex-shrink-0 -mr-1">
            <MoreVertical size={13} />
          </button>
        </div>

        {/* Contact */}
        <div
          className="rounded-xl px-3 py-2.5 space-y-1.5"
          style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Mail size={10} className="text-t-muted flex-shrink-0" />
            <span className="text-[10px] text-t-secondary truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={10} className="text-t-muted flex-shrink-0" />
            <span className="text-[10px] text-t-secondary">{user.phone}</span>
          </div>
        </div>

        {/* Meta: specialty + joinDate */}
        <div className="rounded-xl border border-t-border divide-y divide-t-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[9px] text-t-muted uppercase tracking-wider font-semibold">Especialidade</span>
            <span className="text-[10px] font-bold text-t-text">{user.specialty ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[9px] text-t-muted uppercase tracking-wider font-semibold">Entrada</span>
            <span className="text-[10px] font-bold text-t-text">{fmtDate(user.joinDate)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── User Row (Lista) ─────────────────────────────────────────────────────────

function UserRow({ user }: { user: SystemUser }) {
  const role   = ROLE_CFG[user.role]
  const status = STATUS_CFG[user.status]
  const RoleIcon = role.Icon

  return (
    <tr className="hover:bg-t-card-hover transition-colors cursor-default group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
            style={{ backgroundColor: role.bg, color: role.color }}
          >
            {user.initials}
          </div>
          <div>
            <p className="text-[12px] font-semibold text-t-text">{user.name}</p>
            <p className="text-[10px] text-t-muted">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <RoleIcon size={10} style={{ color: role.color }} />
          <span className="text-[11px] text-t-secondary font-medium">{role.label}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border"
          style={{ color: status.color, borderColor: `${status.color}30`, backgroundColor: `${status.color}10` }}
        >
          <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: status.dot }} />
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-[11px] text-t-secondary">{user.phone}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-[11px] text-t-secondary">{user.specialty ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-[11px] text-t-muted tabular-nums">{fmtDate(user.joinDate)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center text-t-muted hover:text-t-text hover:bg-t-surface ml-auto">
          <MoreVertical size={12} />
        </button>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [users]          = useState<SystemUser[]>(mockUsers)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState<SystemUserRole | 'TODOS'>('TODOS')
  const [viewMode, setViewMode]     = useState<'grid' | 'lista'>('grid')

  const filtered = useMemo(() => users.filter((u) => {
    if (roleFilter !== 'TODOS' && u.role !== roleFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  }), [users, search, roleFilter])

  const total  = users.length
  const ativos = users.filter((u) => u.status === 'ATIVO').length

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-t-border bg-t-topbar">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[15px] font-bold text-t-text leading-tight tracking-tight">Usuários</h1>
            <p className="text-[10px] text-t-muted mt-0.5">
              <span className="font-semibold text-t-text">{total}</span> usuários ·{' '}
              <span className="font-semibold text-green-700 dark:text-green-500">{ativos}</span> ativos
            </p>
          </div>
          <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-[11px] font-semibold transition-colors shadow-sm flex-shrink-0">
            <Plus size={12} strokeWidth={2.5} />
            Novo usuário
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex items-center">
            <Search size={11} className="absolute left-2.5 text-t-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-48 bg-t-surface border border-t-border rounded-lg text-[11px] text-t-text placeholder:text-t-muted pl-7 pr-6 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 text-t-muted hover:text-t-secondary">
                <X size={10} />
              </button>
            )}
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as SystemUserRole | 'TODOS')}
            className="h-7 px-2.5 pr-6 bg-t-surface border border-t-border rounded-lg text-[11px] text-t-secondary focus:outline-none focus:ring-1 focus:ring-accent/40 cursor-pointer appearance-none"
          >
            {ROLE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-t-surface border border-t-border rounded-lg p-[3px] gap-[2px] ml-auto">
            {([
              { key: 'grid'  as const, Icon: LayoutGrid },
              { key: 'lista' as const, Icon: List },
            ]).map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center transition-all',
                  viewMode === key
                    ? 'bg-white dark:bg-white/10 text-t-text shadow-sm'
                    : 'text-t-muted hover:text-t-secondary',
                )}
              >
                <Icon size={11} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-t-surface border border-t-border flex items-center justify-center mb-3">
              <UserCog size={20} className="text-t-muted opacity-40" />
            </div>
            <p className="text-[13px] font-semibold text-t-secondary">Nenhum usuário encontrado</p>
            <p className="text-[11px] text-t-muted mt-0.5">Ajuste os filtros ou a busca</p>
          </div>
        )}

        {viewMode === 'grid' && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((u) => <UserCard key={u.id} user={u} />)}
          </div>
        )}

        {viewMode === 'lista' && filtered.length > 0 && (
          <div className="rounded-xl border border-t-border bg-t-card overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-t-border bg-t-surface">
                  {['Usuário', 'Função', 'Status', 'Telefone', 'Especialidade', 'Entrada', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] font-bold text-t-muted uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-t-border">
                {filtered.map((u) => <UserRow key={u.id} user={u} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
