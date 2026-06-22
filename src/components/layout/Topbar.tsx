import { Bell, Plus, Search, Settings, ChevronRight, Sun, Moon, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

const BREADCRUMB_MAP: Record<string, string> = {
  '': 'Início', 'inicio': 'Início', 'dashboard': 'Dashboard',
  'patio': 'Pátio', 'agenda': 'Agenda',
  'servicos': 'Serviços', 'ordens-servico': 'Ordens de Serviço',
  'cadastros': 'Cadastros', 'clientes': 'Clientes', 'veiculos': 'Veículos',
  'estoque': 'Estoque', 'pecas': 'Peças', 'fornecedores': 'Fornecedores',
  'compras': 'Compras', 'importar': 'Importar',
  'financeiro': 'Financeiro', 'faturamento': 'Faturamento', 'detalhe': 'Detalhe',
  'relatorios': 'Relatórios',
  'equipe': 'Equipe', 'usuarios': 'Usuários',
  'configuracoes': 'Configurações',
  'ajuda': 'Ajuda',
}

function useBreadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  if (parts.length === 0) return [{ label: 'Início', path: '/inicio' }]
  return parts.map((part, i) => {
    const path  = '/' + parts.slice(0, i + 1).join('/')
    const isId  = /^(os\d|[0-9a-f]{8})/.test(part)
    const label = isId ? `#${part.toUpperCase()}` : (BREADCRUMB_MAP[part] ?? part)
    return { label, path }
  })
}

interface TopbarProps {
  sidebarWidth?: number
  theme?: 'light' | 'dark'
  onThemeToggle?: () => void
  onMenuOpen?: () => void
}

export function Topbar({ sidebarWidth = 220, theme = 'light', onThemeToggle, onMenuOpen }: TopbarProps) {
  const breadcrumbs = useBreadcrumbs()
  const isDark      = theme === 'dark'
  const pageTitle   = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'GaragePro'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex items-center justify-between h-[44px] px-3 md:px-4',
        'bg-[var(--topbar)] border-b border-[var(--border)]',
        'transition-all duration-[220ms]',
      )}
      style={{ left: sidebarWidth }}
    >
      {/* ── Left ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0 flex-1">

        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="md:hidden w-8 h-8 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] transition-colors flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={17} />
        </button>

        {/* Breadcrumb — hidden on mobile, show page title instead */}
        <nav className="flex items-center gap-1 text-[12px] leading-none min-w-0" aria-label="Breadcrumb">
          {breadcrumbs.length > 1 ? (
            <>
              {/* Mobile: only page title */}
              <span className="md:hidden font-semibold text-[var(--text-primary)] truncate">{pageTitle}</span>
              {/* Desktop: full breadcrumb */}
              <span className="hidden md:flex items-center gap-1">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={10} className="text-[var(--text-disabled)] flex-shrink-0" />}
                    {i === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-[var(--text-primary)]">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.path} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </span>
            </>
          ) : (
            <span className="font-semibold text-[var(--text-primary)]">{pageTitle}</span>
          )}
        </nav>

        {/* Global search — hidden on mobile */}
        <div className="relative hidden md:flex items-center group ml-1">
          <Search size={13} className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none group-focus-within:text-[var(--brand)] transition-colors duration-[150ms]" />
          <input
            type="text"
            placeholder="Buscar placa, cliente ou OS..."
            className={cn(
              'h-7 w-52 lg:w-64 rounded border border-[var(--border)] bg-[var(--surface-muted)]',
              'text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50',
              'focus:bg-[var(--surface)] focus:w-72',
              'pl-7 pr-3 transition-all duration-[200ms]',
            )}
            aria-label="Busca global"
          />
        </div>
      </div>

      {/* ── Right ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">

        {/* Notifications */}
        <TopbarBtn aria-label="Notificações" title="Notificações">
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
        </TopbarBtn>

        {/* Theme toggle */}
        <TopbarBtn onClick={onThemeToggle} aria-label="Alternar tema" title={isDark ? 'Modo claro' : 'Modo escuro'}>
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </TopbarBtn>

        {/* Settings — hidden on mobile */}
        <TopbarBtn aria-label="Configurações" title="Configurações" className="hidden md:flex">
          <Settings size={14} />
        </TopbarBtn>

        <div className="w-px h-4 bg-[var(--border)] mx-1" />

        {/* User avatar */}
        <button
          className="flex items-center gap-1.5 h-7 pl-1 pr-2 rounded transition-colors duration-[140ms] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
          aria-label="Perfil"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--brand-muted)', color: 'var(--brand)' }}
          >
            A
          </div>
          <span className="text-[12px] font-medium text-[var(--text-secondary)] hidden lg:block">Admin</span>
        </button>

        <div className="w-px h-4 bg-[var(--border)] mx-1 hidden md:block" />

        {/* Nova OS — hidden on mobile */}
        <Link to="/servicos" className="hidden md:block">
          <button
            className="flex items-center gap-1.5 h-7 px-3 rounded font-semibold text-[12px] text-white transition-all duration-[140ms] shadow-xs"
            style={{ backgroundColor: 'var(--brand)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-dark)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand)')}
          >
            <Plus size={13} strokeWidth={2.5} />
            Nova OS
          </button>
        </Link>
      </div>
    </header>
  )
}

function TopbarBtn({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'relative w-7 h-7 rounded flex items-center justify-center',
        'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
        'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]',
        'transition-colors duration-[140ms]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
