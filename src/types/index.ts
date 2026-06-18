// ─── Enums ────────────────────────────────────────────────────────────────────

export type ServiceOrderStatus =
  | 'AGENDADO'
  | 'EM_ANALISE'
  | 'AGUARDANDO_APROVACAO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'ENTREGUE'
  | 'CANCELADO'

export type ServiceOrderPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'

export type ServiceOrderType =
  | 'DIAGNOSTICO'
  | 'REVISAO'
  | 'TROCA_PECA'
  | 'GARANTIA'
  | 'RETORNO'
  | 'ORCAMENTO'

export type CustomerType = 'PF' | 'PJ'
export type CustomerStatus = 'ATIVO' | 'INATIVO'

export type FuelType = 'GASOLINA' | 'ETANOL' | 'FLEX' | 'DIESEL' | 'ELETRICO' | 'HIBRIDO'

export type VehicleStatus = 'ATIVO' | 'EM_MANUTENCAO' | 'SEM_OS'

export type StockStatus = 'NORMAL' | 'BAIXO' | 'SEM_ESTOQUE'

export type PartStatus = 'NORMAL' | 'BAIXO' | 'SEM_ESTOQUE' | 'INATIVO'

export type StockMovementType =
  | 'ENTRADA_COMPRA'
  | 'SAIDA_OS'
  | 'ESTORNO_OS'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'DEVOLUCAO_FORNECEDOR'

export type SupplierStatus = 'ATIVO' | 'INATIVO'

export type FinancialStatus = 'ABERTA' | 'PAGA' | 'VENCIDA' | 'CANCELADA'

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Mechanic {
  id: string
  name: string
  avatarUrl?: string
  initials: string
  specialty?: string
}

export interface Customer {
  id: string
  type: CustomerType
  name: string
  document: string
  phone: string
  whatsapp?: string
  email?: string
  city?: string
  state?: string
  vehiclesCount: number
  openOrdersCount: number
  lastServiceDate?: string
  status: CustomerStatus
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color?: string
  fuel: FuelType
  currentKm?: number
  customerId: string
  customerName: string
  chassi?: string
  engine?: string
  lastServiceDate?: string
  openServiceOrders: number
  status: VehicleStatus
  nextRevisionKm?: number
}

export interface Part {
  id: string
  internalCode: string
  description: string
  manufacturerCode?: string
  currentStock: number
  minimumStock: number
  averageCost: number
  salePrice: number
  unit: string
  category: string
  barcode?: string
  location?: string
  ncm?: string
  supplierId?: string
  supplierName?: string
  status: PartStatus
  lastMovementDate?: string
  createdAt: string
}

export interface StockMovement {
  id: string
  partId: string
  partDescription: string
  type: StockMovementType
  quantity: number
  unitCost?: number
  relatedServiceOrderNumber?: string
  supplierName?: string
  userName: string
  reason?: string
  createdAt: string
}

export interface Supplier {
  id: string
  corporateName: string
  tradeName?: string
  document: string
  email?: string
  phone?: string
  deliveryDays?: number
  partsCount: number
  lastPurchaseDate?: string
  status: SupplierStatus
}

export interface ServiceOrderPart {
  partId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ServiceOrderService {
  id: string
  description: string
  mechanicId: string
  hours: number
  hourlyRate: number
  total: number
}

export interface StatusHistoryEntry {
  status: ServiceOrderStatus
  changedAt: string
  changedBy: string
  note?: string
}

export interface ServiceOrder {
  id: string
  number: string
  status: ServiceOrderStatus
  priority: ServiceOrderPriority
  type: ServiceOrderType
  customerId: string
  customerName: string
  vehicleId: string
  vehicle: string
  plate: string
  mechanicId: string
  mechanic: Mechanic
  estimatedValue: number
  finalValue?: number
  entryDate: string
  estimatedDelivery?: string
  deliveredAt?: string
  description: string
  diagnosis?: string
  symptoms?: string
  partsCount: number
  commentsCount: number
  attachmentsCount: number
  parts: ServiceOrderPart[]
  services: ServiceOrderService[]
  statusHistory: StatusHistoryEntry[]
  financialStatus?: FinancialStatus
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetric {
  id: string
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}

export interface ScheduleEntry {
  id: string
  customerName: string
  vehicle: string
  plate: string
  time: string
  type: ServiceOrderType
  mechanicId?: string
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: ServiceOrderStatus
  label: string
  color: string
  orders: ServiceOrder[]
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export type PurchaseStatus = 'RASCUNHO' | 'AGUARDANDO_RECEBIMENTO' | 'RECEBIDA' | 'CANCELADA'

export interface PurchaseItem {
  id: string
  partId?: string
  internalCode: string
  description: string
  quantity: number
  unitCost: number
  total: number
  isNew: boolean
}

export interface Purchase {
  id: string
  number: string
  supplierId: string
  supplierName: string
  date: string
  items: PurchaseItem[]
  totalItems: number
  totalValue: number
  status: PurchaseStatus
  xmlAttached: boolean
  responsibleUser: string
  notes?: string
  receivedAt?: string
  createdAt: string
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'REALIZADO'
  | 'NAO_COMPARECEU'
  | 'CANCELADO'

export type AppointmentType = 'REVISAO' | 'REPARO' | 'ORCAMENTO' | 'RETORNO_GARANTIA'

export interface ScheduleAppointment {
  id: string
  customerId: string
  customerName: string
  vehicleId: string
  vehicle: string
  plate: string
  date: string
  time: string
  duration: number
  type: AppointmentType
  status: AppointmentStatus
  mechanicId?: string
  mechanicName?: string
  description?: string
  serviceOrderId?: string
  customerPhone?: string
}

// ─── Financial ────────────────────────────────────────────────────────────────

export type FinancialType = 'RECEBER' | 'PAGAR'

export interface FinancialAccount {
  id: string
  type: FinancialType
  description: string
  entity: string
  entityId?: string
  dueDate: string
  value: number
  paidDate?: string
  paidValue?: number
  status: FinancialStatus
  paymentMethod?: string
  originType?: 'OS' | 'COMPRA' | 'MANUAL'
  originId?: string
  category?: string
  createdAt: string
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'ABERTA' | 'PAGA_PARCIAL' | 'PAGA' | 'CANCELADA'

// ─── Imports ──────────────────────────────────────────────────────────────────

export type ImportStatus = 'PROCESSADA' | 'COM_PENDENCIAS' | 'CANCELADA'

export type ImportType = 'XML_NFE' | 'PLANILHA'

export type ImportItemStatus =
  | 'NOVA_PECA'
  | 'JA_CADASTRADA'
  | 'POSSIVEL_DUPLICIDADE'
  | 'DADOS_INCOMPLETOS'
  | 'IGNORADO'
  | 'PRONTO_PARA_IMPORTAR'
  | 'DUPLICADO'

export interface ImportedInvoiceItem {
  id: string
  supplierCode: string
  description: string
  ncm: string
  cfop: string
  unit: string
  quantity: number
  unitCost: number
  totalCost: number
  suggestedSalePrice: number
  marginPercent: number
  status: ImportItemStatus
  possibleMatchPartId?: string
  possibleMatchDescription?: string
}

export interface ImportedInvoice {
  id: string
  invoiceNumber: string
  series: string
  accessKey: string
  supplierName: string
  supplierDocument: string
  issueDate: string
  totalValue: number
  items: ImportedInvoiceItem[]
}

export interface ImportedSpreadsheetItem {
  id: string
  description: string
  internalCode?: string
  manufacturerCode?: string
  currentStock?: number
  averageCost?: number
  salePrice?: number
  supplierName?: string
  ncm?: string
  status: ImportItemStatus
  reason?: string
}

export interface ImportHistory {
  id: string
  type: ImportType
  fileName: string
  importedAt: string
  itemsFound: number
  created: number
  updated: number
  ignored: number
  status: ImportStatus
}

// ─── System Users ─────────────────────────────────────────────────────────────

export type SystemUserRole   = 'ADMINISTRADOR' | 'GERENTE' | 'MECANICO' | 'RECEPCIONISTA'
export type SystemUserStatus = 'ATIVO' | 'INATIVO'

export interface SystemUser {
  id: string
  name: string
  initials: string
  role: SystemUserRole
  status: SystemUserStatus
  email: string
  phone: string
  specialty?: string
  joinDate: string
}

export type FiscalStatus = 'NAO_EMITIDO' | 'PENDENTE' | 'AUTORIZADO' | 'REJEITADO'

export interface Invoice {
  id: string
  number: string
  serviceOrderId: string
  serviceOrderNumber: string
  customerId: string
  customerName: string
  vehicle: string
  plate: string
  partsValue: number
  servicesValue: number
  totalValue: number
  status: InvoiceStatus
  fiscalStatus: FiscalStatus
  paymentMethod?: string
  issuedAt: string
  dueDate?: string
  paidAt?: string
  paidValue?: number
  notes?: string
}
