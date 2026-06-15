import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Calendar, Users, Car,
  Package, Cpu, Truck, ShoppingCart,
  Wallet, Receipt, BarChart3,
  UserCog, Settings, HelpCircle, LogOut,
  Wrench, PanelLeftClose, PanelLeftOpen, Gauge,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'PRINCIPAL',
    items: [
      { label: 'Pátio',             path: '/patio',           icon: <Gauge size={14} /> },
      { label: 'Dashboard',         path: '/dashboard',       icon: <LayoutDashboard size={14} /> },
      { label: 'Ordens de Serviço', path: '/ordens-servico',  icon: <ClipboardList size={14} />, badge: 8 },
      { label: 'Agenda',            path: '/agenda',          icon: <Calendar size={14} /> },
      { label: 'Clientes',          path: '/clientes',        icon: <Users size={14} /> },
      { label: 'Veículos',          path: '/veiculos',        icon: <Car size={14} /> },
    ],
  },
  {
    label: 'OPERAÇÃO',
    items: [
      { label: 'Estoque',      path: '/estoque',      icon: <Package size={14} /> },
      { label: 'Peças',        path: '/pecas',        icon: <Cpu size={14} /> },
      { label: 'Fornecedores', path: '/fornecedores', icon: <Truck size={14} /> },
      { label: 'Compras',      path: '/compras',      icon: <ShoppingCart size={14} /> },
    ],
  },
  {
    label: 'FINANCEIRO',
    items: [
      { label: 'Financeiro',  path: '/financeiro', icon: <Wallet size={14} /> },
      { label: 'Faturamento', path: '/faturamento', icon: <Receipt size={14} /> },
      { label: 'Relatórios',  path: '/relatorios',  icon: <BarChart3 size={14} /> },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Usuários',      path: '/usuarios',      icon: <UserCog size={14} /> },
      { label: 'Configurações', path: '/configuracoes', icon: <Settings size={14} /> },
    ],
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-20 flex flex-col select-none',
        'bg-t-sidebar border-r border-t-border transition-all duration-200',
        collapsed ? 'w-[52px]' : 'w-[220px]',
      )}
    >
      {/* ── Logo ──────────────────────────────────────── */}
      <div className={cn(
        'flex items-center h-[44px] px-3 border-b border-t-border flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
            <Wrench size={12} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span className="text-[13px] font-bold text-t-text tracking-tight leading-none">
              GaragePro
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded flex items-center justify-center text-t-muted hover:text-t-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
          >
            <PanelLeftClose size={13} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-[14px] w-6 h-6 rounded-full border border-t-border bg-t-sidebar shadow-card flex items-center justify-center text-t-muted hover:text-t-secondary transition-colors z-10"
          >
            <PanelLeftOpen size={11} />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold text-t-muted tracking-[0.08em] uppercase">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="mx-3 my-2 h-px bg-t-border" />
            )}
            <ul className="px-1.5 space-y-px">
              {group.items.map((item) => {
                const isActive =
                  item.path === '/dashboard'
                    ? location.pathname === '/dashboard' || location.pathname === '/'
                    : location.pathname.startsWith(item.path)

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'relative flex items-center rounded-md transition-all duration-100',
                        'text-[12px] font-medium',
                        collapsed ? 'justify-center h-8 w-8 mx-auto' : 'gap-2 h-[30px] px-2',
                        isActive
                          ? 'bg-orange-50 text-orange-700 dark:bg-white/[0.08] dark:text-t-text'
                          : 'text-t-secondary hover:bg-black/[0.03] hover:text-t-text dark:hover:bg-white/[0.04] dark:hover:text-t-text',
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && !collapsed && (
                        <span className="absolute left-0 inset-y-1.5 w-[2px] rounded-full bg-accent" />
                      )}
                      <span className={cn(
                        'flex-shrink-0',
                        isActive ? 'text-orange-700 dark:text-accent' : 'text-t-muted',
                        isActive && !collapsed ? 'ml-1' : '',
                      )}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="flex-1 truncate leading-none">{item.label}</span>
                      )}
                      {!collapsed && item.badge && item.badge > 0 && (
                        <span className="text-[9px] font-bold bg-accent/[0.12] text-accent rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-t-border px-1.5 py-2 space-y-px">
        {[
          { label: 'Ajuda', icon: <HelpCircle size={14} />, danger: false },
          { label: 'Sair',  icon: <LogOut size={14} />,     danger: true  },
        ].map(({ label, icon, danger }) => (
          <button
            key={label}
            className={cn(
              'w-full flex items-center rounded-md transition-colors duration-100',
              collapsed ? 'justify-center h-8 w-8 mx-auto' : 'gap-2 h-[30px] px-2',
              'text-[12px] font-medium',
              danger
                ? 'text-t-muted hover:text-danger hover:bg-red-50 dark:hover:bg-danger/[0.08]'
                : 'text-t-secondary hover:text-t-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
            )}
          >
            <span className="flex-shrink-0 text-t-muted">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </button>
        ))}

        {/* User chip */}
        {!collapsed && (
          <div className="flex items-center gap-2 pt-2 mt-1 border-t border-t-border px-1">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-accent leading-none">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-t-text leading-tight">Admin</p>
              <p className="text-[10px] text-t-muted leading-tight">Gerente</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
