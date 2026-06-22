import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Gauge, CalendarDays,
  ClipboardList, BookUser,
  Package, Wallet, BarChart3,
  Users, Settings, HelpCircle, LogOut,
  ChevronLeft, ChevronRight, Wrench, X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Active-path mapping ───────────────────────────────────────────────────────

const ACTIVE_PATHS: Record<string, string[]> = {
  '/inicio':        ['/inicio', '/dashboard'],
  '/patio':         ['/patio'],
  '/agenda':        ['/agenda'],
  '/servicos':      ['/servicos', '/ordens-servico'],
  '/cadastros':     ['/cadastros', '/clientes', '/veiculos'],
  '/estoque':       ['/estoque', '/pecas', '/compras', '/fornecedores'],
  '/financeiro':    ['/financeiro', '/faturamento'],
  '/relatorios':    ['/relatorios'],
  '/equipe':        ['/equipe', '/usuarios'],
  '/configuracoes': ['/configuracoes'],
  '/ajuda':         ['/ajuda'],
}

function useIsActive(itemPath: string, pathname: string): boolean {
  const associated = ACTIVE_PATHS[itemPath] ?? [itemPath]
  return associated.some((p) => {
    if (p === '/inicio' && (pathname === '/' || pathname === '/inicio')) return true
    return pathname === p || pathname.startsWith(p + '/')
  })
}

// ── Navigation structure ──────────────────────────────────────────────────────

interface NavItem { label: string; path: string; icon: React.ReactNode; badge?: number }
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Início',  path: '/inicio', icon: <Home size={15} /> },
      { label: 'Pátio',  path: '/patio',  icon: <Gauge size={15} /> },
      { label: 'Agenda', path: '/agenda', icon: <CalendarDays size={15} /> },
    ],
  },
  {
    label: 'Oficina',
    items: [
      { label: 'Serviços',  path: '/servicos',  icon: <ClipboardList size={15} />, badge: 8 },
      { label: 'Cadastros', path: '/cadastros', icon: <BookUser size={15} /> },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Estoque',    path: '/estoque',    icon: <Package size={15} /> },
      { label: 'Financeiro', path: '/financeiro', icon: <Wallet size={15} /> },
      { label: 'Relatórios', path: '/relatorios', icon: <BarChart3 size={15} /> },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Equipe',        path: '/equipe',        icon: <Users size={15} /> },
      { label: 'Configurações', path: '/configuracoes', icon: <Settings size={15} /> },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { pathname } = useLocation()

  // On mobile always render fully expanded
  const isExpanded = mobileOpen || !collapsed

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-50 flex flex-col select-none',
        'bg-[var(--sidebar)] border-r border-[var(--border)]',
        'transition-all duration-[220ms] ease-in-out',
        // Desktop width
        collapsed ? 'md:w-[52px]' : 'md:w-[220px]',
        // Mobile: always 260px wide, translates on open/close
        'w-[260px]',
        mobileOpen
          ? 'translate-x-0 shadow-2xl'
          : '-translate-x-full md:translate-x-0 md:shadow-none',
      )}
    >
      {/* ── Logo ────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center h-[44px] border-b border-[var(--border)] flex-shrink-0 relative',
          !isExpanded && !mobileOpen ? 'justify-center' : 'px-3 gap-2.5',
        )}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 shadow-xs"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          <Wrench size={13} className="text-white" strokeWidth={2.5} />
        </div>

        {isExpanded && (
          <span className="text-[13px] font-extrabold text-[var(--text-primary)] tracking-tight leading-none flex-1 min-w-0">
            Garage<span style={{ color: 'var(--brand)' }}>Pro</span>
          </span>
        )}

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-black/[0.04] transition-colors flex-shrink-0"
            aria-label="Fechar menu"
          >
            <X size={14} />
          </button>
        )}

        {/* Desktop collapse toggle */}
        {!mobileOpen && (
          <>
            {!collapsed ? (
              <button
                onClick={onToggle}
                className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors flex-shrink-0 hidden md:flex"
                aria-label="Recolher menu"
              >
                <ChevronLeft size={13} />
              </button>
            ) : (
              <button
                onClick={onToggle}
                className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-[var(--border)] bg-[var(--sidebar)] shadow-sm items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors z-10 hidden md:flex"
                aria-label="Expandir menu"
              >
                <ChevronRight size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-2"
        aria-label="Navegação principal"
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-3' : ''}>
            {isExpanded ? (
              <p className="px-4 mb-1 text-[9px] font-bold text-[var(--text-disabled)] tracking-[0.12em] uppercase">
                {group.label}
              </p>
            ) : gi > 0 ? (
              <div className="mx-3 my-2 h-px bg-[var(--border)]" />
            ) : null}

            <ul className={cn('space-y-[1px]', !isExpanded ? 'px-1.5' : 'px-2')}>
              {group.items.map((item) => {
                const active = useIsActive(item.path, pathname)
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      aria-label={item.label}
                      title={!isExpanded ? item.label : undefined}
                      className={cn(
                        'relative flex items-center rounded transition-all duration-[140ms]',
                        'text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40',
                        !isExpanded
                          ? 'justify-center h-8 w-8 mx-auto'
                          : 'gap-2.5 h-[32px] px-2.5',
                        active
                          ? 'font-semibold'
                          : 'font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.035] dark:hover:bg-white/[0.04]',
                      )}
                      style={active ? {
                        color:           'var(--brand)',
                        backgroundColor: 'var(--brand-muted)',
                        borderRadius:    '10px',
                      } : undefined}
                    >
                      {active && isExpanded && (
                        <span
                          className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full"
                          style={{ backgroundColor: 'var(--brand)' }}
                        />
                      )}

                      <span className={cn('flex-shrink-0 flex items-center', active ? 'opacity-100' : 'opacity-55')}>
                        {item.icon}
                      </span>

                      {isExpanded && (
                        <span className="flex-1 truncate leading-none">{item.label}</span>
                      )}

                      {isExpanded && item.badge != null && item.badge > 0 && (
                        <span
                          className="text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none"
                          style={{
                            backgroundColor: active ? 'var(--brand)' : 'var(--brand-muted)',
                            color:           active ? 'white'        : 'var(--brand)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}

                      {!isExpanded && item.badge != null && item.badge > 0 && (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: 'var(--brand)' }}
                        />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[var(--border)] py-2">
        <ul className={cn('space-y-[1px]', !isExpanded ? 'px-1.5' : 'px-2')}>
          <li>
            <NavLink
              to="/ajuda"
              aria-label="Ajuda"
              title={!isExpanded ? 'Ajuda' : undefined}
              className={({ isActive }) => cn(
                'flex items-center rounded transition-colors duration-[140ms] font-medium text-[13px]',
                !isExpanded ? 'justify-center h-8 w-8 mx-auto' : 'gap-2.5 h-[32px] px-2.5',
                isActive
                  ? 'font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.035] dark:hover:bg-white/[0.04]',
              )}
              style={({ isActive }) => isActive
                ? { color: 'var(--brand)', backgroundColor: 'var(--brand-muted)', borderRadius: '10px' }
                : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className={cn('flex-shrink-0 flex items-center', isActive ? 'opacity-100' : 'opacity-55')}>
                    <HelpCircle size={14} />
                  </span>
                  {isExpanded && <span>Ajuda</span>}
                </>
              )}
            </NavLink>
          </li>
          <li>
            <button
              className={cn(
                'w-full flex items-center rounded transition-colors duration-[140ms] font-medium text-[13px]',
                !isExpanded ? 'justify-center h-8 w-8 mx-auto' : 'gap-2.5 h-[32px] px-2.5',
                'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)]',
              )}
              title={!isExpanded ? 'Sair' : undefined}
              aria-label="Sair"
            >
              <span className="flex-shrink-0 flex items-center opacity-55">
                <LogOut size={14} />
              </span>
              {isExpanded && <span>Sair</span>}
            </button>
          </li>
        </ul>

        {/* User chip */}
        {isExpanded && (
          <div className="flex items-center gap-2.5 mx-2 mt-2 pt-2 border-t border-[var(--border)] px-0.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
              style={{ backgroundColor: 'var(--brand-muted)', color: 'var(--brand)' }}
            >
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight truncate">Admin</p>
              <p className="text-[10px] text-[var(--text-muted)] leading-tight">Gerente</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
