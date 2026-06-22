import type { ServiceOrderStatus, ServiceOrderType, ServiceOrderPriority } from '../types'

export interface StatusConfig {
  label: string
  labelShort: string
  cssText: string    // CSS variable reference for text color
  cssBg: string      // CSS variable reference for background
  cssBorder: string  // CSS variable reference for border
  dot: string        // Static dot color (used as fallback)
  iconName: string   // Lucide icon name
  description: string // Used in tooltips and accessibility
}

export const OS_STATUS_MAP: Record<ServiceOrderStatus, StatusConfig> = {
  AGENDADO: {
    label:       'Agendado',
    labelShort:  'Agend.',
    cssText:     'var(--os-agendado-text)',
    cssBg:       'var(--os-agendado-bg)',
    cssBorder:   'var(--os-agendado-border)',
    dot:         '#6890B8',
    iconName:    'CalendarClock',
    description: 'OS criada, aguardando chegada do veículo',
  },
  EM_ANALISE: {
    label:       'Em Análise',
    labelShort:  'Análise',
    cssText:     'var(--os-analise-text)',
    cssBg:       'var(--os-analise-bg)',
    cssBorder:   'var(--os-analise-border)',
    dot:         '#4888D8',
    iconName:    'ScanSearch',
    description: 'Veículo em diagnóstico técnico',
  },
  AGUARDANDO_APROVACAO: {
    label:       'Aguard. Aprovação',
    labelShort:  'Ag. Apr.',
    cssText:     'var(--os-aprovacao-text)',
    cssBg:       'var(--os-aprovacao-bg)',
    cssBorder:   'var(--os-aprovacao-border)',
    dot:         '#C88020',
    iconName:    'Clock',
    description: 'Orçamento enviado, aguardando resposta do cliente',
  },
  EM_ANDAMENTO: {
    label:       'Em Andamento',
    labelShort:  'Em exec.',
    cssText:     'var(--os-andamento-text)',
    cssBg:       'var(--os-andamento-bg)',
    cssBorder:   'var(--os-andamento-border)',
    dot:         '#1AA89C',
    iconName:    'Wrench',
    description: 'Serviço aprovado e em execução na oficina',
  },
  CONCLUIDO: {
    label:       'Concluído',
    labelShort:  'Concl.',
    cssText:     'var(--os-concluido-text)',
    cssBg:       'var(--os-concluido-bg)',
    cssBorder:   'var(--os-concluido-border)',
    dot:         '#28A850',
    iconName:    'CheckCircle2',
    description: 'Serviço finalizado, veículo aguardando retirada',
  },
  ENTREGUE: {
    label:       'Entregue',
    labelShort:  'Entregue',
    cssText:     'var(--os-entregue-text)',
    cssBg:       'var(--os-entregue-bg)',
    cssBorder:   'var(--os-entregue-border)',
    dot:         '#888E98',
    iconName:    'PackageCheck',
    description: 'Veículo entregue ao cliente',
  },
  CANCELADO: {
    label:       'Cancelado',
    labelShort:  'Cancelado',
    cssText:     'var(--os-cancelado-text)',
    cssBg:       'var(--os-cancelado-bg)',
    cssBorder:   'var(--os-cancelado-border)',
    dot:         '#D05050',
    iconName:    'XCircle',
    description: 'OS cancelada',
  },
}

export interface TypeConfig {
  label: string
  cssText: string
  cssBg: string
  cssBorder: string
  iconName: string
}

export const OS_TYPE_MAP: Record<ServiceOrderType, TypeConfig> = {
  DIAGNOSTICO: {
    label: 'Diagnóstico',  cssText: 'var(--os-analise-text)',   cssBg: 'var(--os-analise-bg)',   cssBorder: 'var(--os-analise-border)',   iconName: 'ScanSearch',
  },
  REVISAO: {
    label: 'Revisão',      cssText: 'var(--os-revisao-text)',   cssBg: 'var(--os-revisao-bg)',   cssBorder: 'var(--os-revisao-border)',   iconName: 'RefreshCw',
  },
  TROCA_PECA: {
    label: 'Troca de Peça',cssText: 'var(--os-troca-text)',     cssBg: 'var(--os-troca-bg)',     cssBorder: 'var(--os-troca-border)',     iconName: 'Package',
  },
  GARANTIA: {
    label: 'Garantia',     cssText: 'var(--os-garantia-text)',  cssBg: 'var(--os-garantia-bg)',  cssBorder: 'var(--os-garantia-border)',  iconName: 'Shield',
  },
  RETORNO: {
    label: 'Retorno',      cssText: 'var(--os-entregue-text)',  cssBg: 'var(--os-entregue-bg)',  cssBorder: 'var(--os-entregue-border)',  iconName: 'RotateCcw',
  },
  ORCAMENTO: {
    label: 'Orçamento',    cssText: 'var(--os-orcamento-text)', cssBg: 'var(--os-orcamento-bg)', cssBorder: 'var(--os-orcamento-border)', iconName: 'FileText',
  },
}

export interface PriorityConfig {
  label: string
  color: string
  bgColor: string
  iconName: string
}

export const PRIORITY_MAP: Record<ServiceOrderPriority, PriorityConfig> = {
  BAIXA:   { label: 'Baixa',   color: '#1A6B35', bgColor: 'rgba(26,107,53,0.10)',  iconName: 'ArrowDown'    },
  MEDIA:   { label: 'Média',   color: '#8A5200', bgColor: 'rgba(138,82,0,0.10)',   iconName: 'Minus'        },
  ALTA:    { label: 'Alta',    color: '#D4601A', bgColor: 'rgba(212,96,26,0.10)',  iconName: 'ArrowUp'      },
  URGENTE: { label: 'Urgente', color: '#A82828', bgColor: 'rgba(168,40,40,0.10)', iconName: 'AlertTriangle' },
}

// Kanban columns definition (drives both the board layout and column order)
export const KANBAN_COLUMNS: Array<{ id: ServiceOrderStatus; label: string; allowedTransitions: ServiceOrderStatus[] }> = [
  { id: 'AGENDADO',            label: 'Recepção',           allowedTransitions: ['EM_ANALISE', 'CANCELADO'] },
  { id: 'EM_ANALISE',          label: 'Diagnóstico',        allowedTransitions: ['AGUARDANDO_APROVACAO', 'EM_ANDAMENTO', 'CANCELADO'] },
  { id: 'AGUARDANDO_APROVACAO',label: 'Aguard. Aprovação',  allowedTransitions: ['EM_ANDAMENTO', 'CANCELADO'] },
  { id: 'EM_ANDAMENTO',        label: 'Em Execução',        allowedTransitions: ['CONCLUIDO', 'AGUARDANDO_APROVACAO'] },
  { id: 'CONCLUIDO',           label: 'Finalização',        allowedTransitions: ['ENTREGUE'] },
  { id: 'ENTREGUE',            label: 'Entregue',           allowedTransitions: [] },
]
