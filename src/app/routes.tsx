import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../features/auth/LoginPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { ServiceOrdersPage } from '../features/service-orders/ServiceOrdersPage'
import { ServiceOrderDetailPage } from '../features/service-orders/ServiceOrderDetailPage'
import { CustomersPage } from '../features/customers/CustomersPage'
import { VehiclesPage } from '../features/vehicles/VehiclesPage'
import { InventoryPage } from '../features/inventory/InventoryPage'
import { PartsPage } from '../features/parts/PartsPage'
import { SuppliersPage } from '../features/suppliers/SuppliersPage'
import { PurchasesPage } from '../features/purchases/PurchasesPage'
import { ImportPage } from '../features/import/ImportPage'
import { SchedulePage } from '../features/schedule/SchedulePage'
import { FinancePage } from '../features/finance/FinancePage'
import { BillingPage } from '../features/billing/BillingPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { PatioPage } from '../features/patio/PatioPage'
import { UsersPage } from '../features/users/UsersPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { useAuth } from '../contexts/AuthContext'

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
          { index: true, element: <Navigate to="/patio" replace /> },
          { path: 'patio',               element: <PatioPage /> },
          { path: 'dashboard',           element: <DashboardPage /> },
          { path: 'ordens-servico',      element: <ServiceOrdersPage /> },
          { path: 'ordens-servico/:id',  element: <ServiceOrderDetailPage /> },
          { path: 'clientes',            element: <CustomersPage /> },
          { path: 'veiculos',            element: <VehiclesPage /> },
          { path: 'agenda',              element: <SchedulePage /> },
          { path: 'estoque',             element: <InventoryPage /> },
          { path: 'pecas',               element: <PartsPage /> },
          { path: 'fornecedores',        element: <SuppliersPage /> },
          { path: 'compras',             element: <PurchasesPage /> },
          { path: 'estoque/importar',    element: <ImportPage /> },
          { path: 'financeiro',          element: <FinancePage /> },
          { path: 'faturamento',         element: <BillingPage /> },
          { path: 'relatorios',          element: <ReportsPage /> },
          { path: 'usuarios',            element: <UsersPage /> },
          { path: 'configuracoes',       element: <SettingsPage /> },
        ],
      },
    ],
  },
])
