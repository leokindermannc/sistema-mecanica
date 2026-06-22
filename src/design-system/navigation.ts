// GaragePro Navigation Structure
// Single source of truth for sidebar and mobile nav items.

export interface NavItem {
  label: string
  path: string
  iconName: string
  badge?: number
  description: string
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      {
        label: 'Pátio',
        path: '/patio',
        iconName: 'Gauge',
        description: 'Veículos na oficina agora',
      },
      {
        label: 'Dashboard',
        path: '/dashboard',
        iconName: 'LayoutDashboard',
        description: 'Visão geral e métricas do dia',
      },
      {
        label: 'Ordens de Serviço',
        path: '/ordens-servico',
        iconName: 'ClipboardList',
        badge: 8,
        description: 'Criar e gerenciar OS',
      },
      {
        label: 'Agenda',
        path: '/agenda',
        iconName: 'CalendarDays',
        description: 'Agendamentos e horários',
      },
      {
        label: 'Clientes',
        path: '/clientes',
        iconName: 'Users',
        description: 'Cadastro de clientes',
      },
      {
        label: 'Veículos',
        path: '/veiculos',
        iconName: 'Car',
        description: 'Frota e histórico por veículo',
      },
    ],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      {
        label: 'Estoque',
        path: '/estoque',
        iconName: 'Package',
        description: 'Controle de peças em estoque',
      },
      {
        label: 'Peças',
        path: '/pecas',
        iconName: 'Cpu',
        description: 'Catálogo e fichas de peças',
      },
      {
        label: 'Fornecedores',
        path: '/fornecedores',
        iconName: 'Truck',
        description: 'Cadastro de fornecedores',
      },
      {
        label: 'Compras',
        path: '/compras',
        iconName: 'ShoppingCart',
        description: 'Ordens de compra',
      },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [
      {
        label: 'Financeiro',
        path: '/financeiro',
        iconName: 'Wallet',
        description: 'Contas a pagar e receber',
      },
      {
        label: 'Faturamento',
        path: '/faturamento',
        iconName: 'Receipt',
        description: 'Notas fiscais e faturamento',
      },
      {
        label: 'Relatórios',
        path: '/relatorios',
        iconName: 'BarChart3',
        description: 'Relatórios e análises',
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      {
        label: 'Usuários',
        path: '/usuarios',
        iconName: 'UserCog',
        description: 'Gestão de usuários e permissões',
      },
      {
        label: 'Configurações',
        path: '/configuracoes',
        iconName: 'Settings',
        description: 'Configurações do sistema',
      },
    ],
  },
]

export const SYSTEM_ACTIONS = [
  { label: 'Ajuda', iconName: 'HelpCircle', description: 'Central de ajuda' },
  { label: 'Sair',  iconName: 'LogOut',     description: 'Encerrar sessão', danger: true },
] as const
