import { FolderOpen, FileText, ClipboardList, Receipt, Package, BarChart3, Printer, Download, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '../../components/ui/Toast'

interface DocCategory {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
  documents: { label: string; description: string; link?: string }[]
}

const CATEGORIES: DocCategory[] = [
  {
    id: 'atendimento',
    label: 'Atendimento',
    description: 'Documentos gerados na entrada e saída do veículo',
    icon: <ClipboardList size={16} />,
    color: 'var(--info)',
    documents: [
      { label: 'Ficha do cliente',        description: 'Dados cadastrais e histórico do cliente' },
      { label: 'Ficha do veículo',         description: 'Dados técnicos e histórico de manutenção', link: '/veiculos' },
      { label: 'Termo de entrada',         description: 'Registro de recebimento do veículo com fotos e avarias' },
      { label: 'Checklist de entrada',     description: 'Lista de itens verificados na entrada' },
      { label: 'Checklist de saída',       description: 'Lista de itens verificados antes da entrega' },
      { label: 'Comprovante de entrega',   description: 'Confirmação de entrega ao cliente' },
    ],
  },
  {
    id: 'orcamentos-os',
    label: 'Orçamentos e OS',
    description: 'Documentos técnicos e comerciais das ordens de serviço',
    icon: <FileText size={16} />,
    color: 'var(--brand)',
    documents: [
      { label: 'Orçamento',                description: 'Proposta comercial enviada ao cliente', link: '/orcamentos' },
      { label: 'Orçamento complementar',   description: 'Serviços ou peças adicionais ao orçamento original' },
      { label: 'Ordem de Serviço (OS)',     description: 'Documento principal do serviço', link: '/servicos' },
      { label: 'Ficha de diagnóstico',     description: 'Diagnóstico técnico detalhado' },
      { label: 'Ficha do mecânico',        description: 'Relatório de execução por mecânico' },
      { label: 'Termo de aprovação',       description: 'Confirmação de aprovação pelo cliente' },
      { label: 'Termo de entrega',         description: 'Assinatura de recebimento do veículo' },
      { label: 'Termo de garantia',        description: 'Condições e prazos de garantia', link: '/garantias' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Comprovantes, recibos e documentos financeiros',
    icon: <Receipt size={16} />,
    color: 'var(--success)',
    documents: [
      { label: 'Recibo de pagamento',      description: 'Comprovante de quitação', link: '/financeiro' },
      { label: 'Pré-recibo',              description: 'Recibo provisório antes da quitação total' },
      { label: 'Extrato financeiro',       description: 'Histórico de débitos e créditos do cliente' },
      { label: 'Carta de cobrança',       description: 'Notificação formal de cobrança', link: '/cobrancas' },
      { label: 'Fechamento de caixa',     description: 'Relatório diário de movimentação', link: '/caixa' },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque e Compras',
    description: 'Documentos de controle de estoque e compras',
    icon: <Package size={16} />,
    color: 'var(--warning)',
    documents: [
      { label: 'Pedido de compra',         description: 'Solicitação de compra para fornecedor', link: '/compras' },
      { label: 'Separação de peças',       description: 'Lista de peças reservadas para OS', link: '/estoque' },
      { label: 'Conferência de estoque',   description: 'Inventário e ajuste de estoque' },
      { label: 'Etiqueta de produto',     description: 'Etiqueta com código e preço' },
    ],
  },
  {
    id: 'gestao',
    label: 'Relatórios Gerenciais',
    description: 'Relatórios e análises para gestão da oficina',
    icon: <BarChart3 size={16} />,
    color: '#7C3AED',
    documents: [
      { label: 'Relatório de faturamento',  description: 'Faturamento por período', link: '/relatorios' },
      { label: 'Produtividade da equipe',  description: 'Desempenho por mecânico', link: '/equipe' },
      { label: 'OS em aberto',             description: 'Listagem de ordens em andamento', link: '/servicos' },
      { label: 'Inadimplência',            description: 'Clientes com pagamentos em atraso', link: '/cobrancas' },
      { label: 'Estoque crítico',          description: 'Itens abaixo do mínimo', link: '/estoque' },
    ],
  },
]

export function DocumentosPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-[var(--background)]">

      {/* ── Fixed header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <h1 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Documentos</h1>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Central de geração, impressão e envio de documentos da oficina</p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]" style={{ borderLeftWidth: 3, borderLeftColor: cat.color }}>
              <span style={{ color: cat.color }}>{cat.icon}</span>
              <div>
                <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">{cat.label}</h2>
                <p className="text-[11px] text-[var(--text-muted)]">{cat.description}</p>
              </div>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {cat.documents.map((doc, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{doc.label}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{doc.description}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toast.info('Impressão disponível após integração com OS')}
                      className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                      title="Imprimir"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => toast.info('Download disponível após integração com OS')}
                      className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                      title="Baixar PDF"
                    >
                      <Download size={13} />
                    </button>
                    {doc.link && (
                      <Link to={doc.link}
                        className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-muted)] transition-colors"
                        title="Ir para o módulo"
                      >
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="mt-5 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
        <FolderOpen size={15} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">Integração com modelos personalizados</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Os documentos utilizam os dados cadastrados no sistema e o logo/informações da empresa configurados em{' '}
            <Link to="/configuracoes" className="text-[var(--brand)] hover:underline">Configurações</Link>.
            Para personalizar modelos, acesse as configurações de documentos.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
