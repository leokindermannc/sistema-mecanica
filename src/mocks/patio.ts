export type PatioStatus =
  | 'ENTROU_HOJE'
  | 'EM_DIAGNOSTICO'
  | 'AGUARDANDO_ORCAMENTO'
  | 'AGUARDANDO_APROVACAO'
  | 'AGUARDANDO_PECA'
  | 'EM_SERVICO'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'ATRASADO'

export type TimelineStage =
  | 'recebido'
  | 'diagnostico'
  | 'orcamento'
  | 'aprovado'
  | 'em_servico'
  | 'pronto'
  | 'entregue'

export interface PatioVehicle {
  id: string
  plate: string
  model: string
  brand: string
  year: number
  mileage?: number
  customer: {
    name: string
    phone: string
  }
  service: string
  diagnosis?: string
  status: PatioStatus
  nextAction: string
  mechanic?: string
  estimatedValue?: number
  entryTime: string
  entryDate: string
  currentStage: TimelineStage
  history?: {
    lastVisit: string
    lastService: string
    lastMileage: number
    nextRecommendation?: string
  }
}

export interface StatusConfig {
  label: string
  color: string
  bg: string
  accent: string
}

export const STATUS_CONFIG: Record<PatioStatus, StatusConfig> = {
  ENTROU_HOJE:          { label: 'Entrou hoje',    color: '#4B5563', bg: '#F3F4F6', accent: '#9CA3AF' },
  EM_DIAGNOSTICO:       { label: 'Em diagnóstico', color: '#1D4ED8', bg: '#EFF6FF', accent: '#60A5FA' },
  AGUARDANDO_ORCAMENTO: { label: 'Ag. Orçamento',  color: '#92400E', bg: '#FFFBEB', accent: '#F59E0B' },
  AGUARDANDO_APROVACAO: { label: 'Ag. Aprovação',  color: '#C2410C', bg: '#FFF7ED', accent: '#F97316' },
  AGUARDANDO_PECA:      { label: 'Ag. Peça',       color: '#5B21B6', bg: '#F5F3FF', accent: '#8B5CF6' },
  EM_SERVICO:           { label: 'Em serviço',     color: '#1E40AF', bg: '#EFF6FF', accent: '#3B82F6' },
  PRONTO:               { label: 'Pronto',         color: '#14532D', bg: '#F0FDF4', accent: '#22C55E' },
  ENTREGUE:             { label: 'Entregue',       color: '#374151', bg: '#F9FAFB', accent: '#D1D5DB' },
  ATRASADO:             { label: 'Atrasado',       color: '#B91C1C', bg: '#FEF2F2', accent: '#EF4444' },
}

export const TIMELINE_STAGES: Array<{ key: TimelineStage; label: string }> = [
  { key: 'recebido',    label: 'Recebido' },
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'orcamento',   label: 'Orçamento' },
  { key: 'aprovado',    label: 'Aprovado' },
  { key: 'em_servico',  label: 'Em Serviço' },
  { key: 'pronto',      label: 'Pronto' },
  { key: 'entregue',    label: 'Entregue' },
]

export const mockPatioVehicles: PatioVehicle[] = [
  {
    id: 'pv1',
    plate: 'ABC-1D23',
    brand: 'Honda',
    model: 'Civic 2018',
    year: 2018,
    mileage: 94300,
    customer: { name: 'João Silva', phone: '11999990001' },
    service: 'Troca de óleo + revisão',
    status: 'AGUARDANDO_ORCAMENTO',
    nextAction: 'Enviar orçamento',
    mechanic: 'Carlos',
    estimatedValue: 480,
    entryTime: '09:30',
    entryDate: '2026-06-12',
    currentStage: 'orcamento',
    history: {
      lastVisit: '10/12/2025',
      lastService: 'Troca de óleo + filtro',
      lastMileage: 84500,
      nextRecommendation: 'Revisão de freios em 5.000 km',
    },
  },
  {
    id: 'pv2',
    plate: 'BRA-2E19',
    brand: 'Chevrolet',
    model: 'Onix 2020',
    year: 2020,
    mileage: 52100,
    customer: { name: 'Maria Souza', phone: '11999990002' },
    service: 'Barulho na suspensão',
    status: 'EM_DIAGNOSTICO',
    nextAction: 'Finalizar diagnóstico',
    mechanic: 'Diego',
    entryTime: '10:20',
    entryDate: '2026-06-12',
    currentStage: 'diagnostico',
  },
  {
    id: 'pv3',
    plate: 'JJJ-4K21',
    brand: 'Toyota',
    model: 'Corolla 2019',
    year: 2019,
    mileage: 112000,
    customer: { name: 'Pedro Martins', phone: '11999990003' },
    service: 'Revisão completa',
    status: 'EM_SERVICO',
    nextAction: 'Concluir serviço',
    mechanic: 'Rafael',
    estimatedValue: 1250,
    entryTime: '08:45',
    entryDate: '2026-06-12',
    currentStage: 'em_servico',
    history: {
      lastVisit: '20/06/2025',
      lastService: 'Revisão 100.000 km',
      lastMileage: 99800,
      nextRecommendation: 'Troca de correia dentada em 10.000 km',
    },
  },
  {
    id: 'pv4',
    plate: 'TOR-7A21',
    brand: 'Fiat',
    model: 'Toro 2021',
    year: 2021,
    mileage: 38900,
    customer: { name: 'Ana Paula', phone: '11999990004' },
    service: 'Freio dianteiro',
    status: 'PRONTO',
    nextAction: 'Avisar cliente',
    mechanic: 'Carlos',
    estimatedValue: 890,
    entryTime: '11:10',
    entryDate: '2026-06-12',
    currentStage: 'pronto',
  },
  {
    id: 'pv5',
    plate: 'GOL-5B16',
    brand: 'Volkswagen',
    model: 'Gol 2016',
    year: 2016,
    mileage: 178400,
    customer: { name: 'Lucas Almeida', phone: '11999990005' },
    service: 'Vazamento de óleo',
    status: 'AGUARDANDO_PECA',
    nextAction: 'Comprar peça',
    mechanic: 'Diego',
    estimatedValue: 360,
    entryTime: '14:00',
    entryDate: '2026-06-12',
    currentStage: 'aprovado',
  },
  {
    id: 'pv6',
    plate: 'DEF-4E56',
    brand: 'Toyota',
    model: 'Corolla 2020',
    year: 2020,
    mileage: 67200,
    customer: { name: 'Maria Silva', phone: '11999990006' },
    service: 'Motor superaquecendo',
    diagnosis: 'Bomba d\'água com vazamento. Verificar necessidade de retífica.',
    status: 'AGUARDANDO_APROVACAO',
    nextAction: 'Aguardar aprovação',
    mechanic: 'Carlos',
    estimatedValue: 3200,
    entryTime: '08:00',
    entryDate: '2026-06-11',
    currentStage: 'orcamento',
  },
  {
    id: 'pv7',
    plate: 'VWX-2K34',
    brand: 'Renault',
    model: 'Kwid 2020',
    year: 2020,
    mileage: 45100,
    customer: { name: 'Distribuidora XYZ', phone: '11999990007' },
    service: 'Troca de correia dentada',
    diagnosis: 'Correia dentada desgastada. Tensor frouxo.',
    status: 'ATRASADO',
    nextAction: 'Avisar cliente',
    mechanic: 'Thiago',
    estimatedValue: 890,
    entryTime: '07:30',
    entryDate: '2026-06-10',
    currentStage: 'aprovado',
    history: {
      lastVisit: '15/01/2026',
      lastService: 'Troca de óleo',
      lastMileage: 40200,
    },
  },
  {
    id: 'pv8',
    plate: 'MNO-3H45',
    brand: 'Chevrolet',
    model: 'Onix 2021',
    year: 2021,
    mileage: 28700,
    customer: { name: 'Ana Rodrigues', phone: '11999990008' },
    service: 'Orçamento de lataria',
    status: 'ENTROU_HOJE',
    nextAction: 'Iniciar diagnóstico',
    entryTime: '13:30',
    entryDate: '2026-06-12',
    currentStage: 'recebido',
  },
]
