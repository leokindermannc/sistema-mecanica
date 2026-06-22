import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage }              from '../features/auth/LoginPage'
// ── Hub pages (sidebar navigation targets) ───────────────────────────────────
import { InicioPage }             from '../features/inicio/InicioPage'
import { ServicosPage }           from '../features/servicos/ServicosPage'
import { CadastrosPage }          from '../features/cadastros/CadastrosPage'
import { EstoqueHubPage }         from '../features/estoque/EstoqueHubPage'
import { FinanceiroHubPage }      from '../features/financeiro/FinanceiroHubPage'
import { EquipePage }             from '../features/equipe/EquipePage'
import { CustomerDetailPage }     from '../features/cadastros/CustomerDetailPage'
// ── Existing feature pages (preserved — all direct URLs still work) ───────────
import { DashboardPage }          from '../features/dashboard/DashboardPage'
import { ServiceOrdersPage }      from '../features/service-orders/ServiceOrdersPage'
import { ServiceOrderDetailPage } from '../features/service-orders/ServiceOrderDetailPage'
import { CustomersPage }          from '../features/customers/CustomersPage'
import { VehiclesPage }           from '../features/vehicles/VehiclesPage'
import { InventoryPage }          from '../features/inventory/InventoryPage'
import { PartsPage }              from '../features/parts/PartsPage'
import { SuppliersPage }          from '../features/suppliers/SuppliersPage'
import { PurchasesPage }          from '../features/purchases/PurchasesPage'
import { ImportPage }             from '../features/import/ImportPage'
import { SchedulePage }           from '../features/schedule/SchedulePage'
import { FinancePage }            from '../features/finance/FinancePage'
import { BillingPage }            from '../features/billing/BillingPage'
import { ReportsPage }            from '../features/reports/ReportsPage'
import { AjudaPage }             from '../features/ajuda/AjudaPage'
import { PatioPage }              from '../features/patio/PatioPage'
import { UsersPage }              from '../features/users/UsersPage'
import { SettingsPage }           from '../features/settings/SettingsPage'
import { useAuth }                from '../contexts/AuthContext'

function RequireAuth() {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          // Default → Início (new main entry point)
          { index: true, element: <Navigate to="/inicio" replace /> },

          // ── Hub routes (what the sidebar links to) ────────────────
          { path: 'inicio',     element: <InicioPage /> },
          { path: 'servicos',   element: <ServicosPage /> },
          { path: 'cadastros',              element: <CadastrosPage /> },
          { path: 'cadastros/clientes/:id', element: <CustomerDetailPage /> },
          { path: 'estoque',    element: <EstoqueHubPage /> },
          { path: 'financeiro', element: <FinanceiroHubPage /> },
          { path: 'equipe',     element: <EquipePage /> },

          // ── Preserved module routes (direct URL access intact) ────
          { path: 'patio',              element: <PatioPage /> },
          { path: 'agenda',             element: <SchedulePage /> },
          { path: 'dashboard',          element: <DashboardPage /> },
          { path: 'ordens-servico',     element: <ServiceOrdersPage /> },
          { path: 'ordens-servico/:id', element: <ServiceOrderDetailPage /> },
          { path: 'clientes',           element: <CustomersPage /> },
          { path: 'veiculos',           element: <VehiclesPage /> },
          { path: 'pecas',              element: <PartsPage /> },
          { path: 'fornecedores',       element: <SuppliersPage /> },
          { path: 'compras',            element: <PurchasesPage /> },
          { path: 'estoque/importar',   element: <ImportPage /> },
          { path: 'estoque/pecas',      element: <InventoryPage /> },
          { path: 'faturamento',        element: <BillingPage /> },
          { path: 'financeiro/detalhe', element: <FinancePage /> },
          { path: 'relatorios',         element: <ReportsPage /> },
          { path: 'usuarios',           element: <UsersPage /> },
          { path: 'configuracoes',      element: <SettingsPage /> },
          { path: 'ajuda',              element: <AjudaPage /> },
        ],
      },
    ],
  },
])
