import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useTheme } from '../../hooks/useTheme'

export const SIDEBAR_W           = 220
export const SIDEBAR_W_COLLAPSED = 52
export const TOPBAR_H            = 44

export function AppShell() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [isMobile,    setIsMobile]    = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const { theme, toggle } = useTheme()
  const { pathname }      = useLocation()

  // Track viewport width
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebarWidth = isMobile ? 0 : (collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W)

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Topbar
        sidebarWidth={sidebarWidth}
        theme={theme}
        onThemeToggle={toggle}
        onMenuOpen={() => setMobileOpen(true)}
      />

      <main
        className="min-h-screen transition-all duration-[220ms]"
        style={{ paddingLeft: sidebarWidth, paddingTop: TOPBAR_H }}
      >
        <Outlet />
      </main>
    </div>
  )
}
