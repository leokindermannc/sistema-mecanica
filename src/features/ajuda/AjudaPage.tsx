import { useState, useMemo } from 'react'
import {
  Search, HelpCircle, BookOpen, ChevronDown, ChevronRight,
  Gauge, CalendarDays, ClipboardList, BookUser, Package,
  Wallet, BarChart3, Users, Settings, Mail, MessageCircle,
  Home, Wrench, CheckCircle2, AlertTriangle, Lightbulb, FileText,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Article {
  title: string
  desc: string
  tags: string[]
}

interface ModuleDef {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  articles: Article[]
}

const MODULES: ModuleDef[] = [
  {
    key: 'inicio',
    label: 'Início / Dashboard',
    icon: <Home size={18} />,
    color: '#D4601A',
    bg: 'rgba(212,96,26,0.10)',
    articles: [
      { title: 'Visão geral do painel inicial', desc: 'Entenda os indicadores e atalhos disponíveis na tela de início.', tags: ['dashboard', 'painel', 'indicadores', 'atalhos'] },
      { title: 'Personalizar cards do dashboard', desc: 'Como reorganizar e escolher quais métricas exibir na tela inicial.', tags: ['personalizar', 'cards', 'métricas'] },
      { title: 'Interpretar os gráficos de receita', desc: 'Explicação sobre os gráficos de faturamento mensal e comparativo.', tags: ['gráfico', 'receita', 'faturamento'] },
    ],
  },
  {
    key: 'patio',
    label: 'Pátio',
    icon: <Gauge size={18} />,
    color: '#1A4E8C',
    bg: 'rgba(26,78,140,0.10)',
    articles: [
      { title: 'Registrar entrada de veículo', desc: 'Como lançar um veículo no pátio ao chegar na oficina, informando placa, serviço e mecânico responsável.', tags: ['entrada', 'veículo', 'pátio', 'registrar'] },
      { title: 'Alterar status de um veículo', desc: 'Mude o status de Aguardando, Em Serviço, Aguardando Peça ou Pronto para Retirada.', tags: ['status', 'veículo', 'alterar'] },
      { title: 'Remover veículo do pátio', desc: 'Como encerrar a permanência de um veículo após a retirada pelo cliente.', tags: ['remover', 'saída', 'retirada'] },
      { title: 'Visualizar histórico de entradas', desc: 'Como filtrar e consultar os registros anteriores de passagem pelo pátio.', tags: ['histórico', 'consultar', 'filtro'] },
    ],
  },
  {
    key: 'agenda',
    label: 'Agenda',
    icon: <CalendarDays size={18} />,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    articles: [
      { title: 'Criar um novo agendamento', desc: 'Passo a passo para agendar um serviço vinculando cliente, veículo, mecânico e data/hora.', tags: ['agendamento', 'criar', 'marcar'] },
      { title: 'Editar ou cancelar agendamento', desc: 'Como alterar data, horário ou responsável de um agendamento existente.', tags: ['editar', 'cancelar', 'reagendar'] },
      { title: 'Visualizar agenda por mecânico', desc: 'Filtre a agenda para ver apenas os compromissos de um mecânico específico.', tags: ['filtro', 'mecânico', 'visualizar'] },
      { title: 'Converter agendamento em OS', desc: 'Como transformar um agendamento confirmado em uma Ordem de Serviço diretamente.', tags: ['OS', 'converter', 'ordem de serviço'] },
    ],
  },
  {
    key: 'servicos',
    label: 'Ordens de Serviço',
    icon: <ClipboardList size={18} />,
    color: '#1A6B35',
    bg: 'rgba(26,107,53,0.10)',
    articles: [
      { title: 'Abrir uma nova Ordem de Serviço', desc: 'Como criar uma OS vinculando cliente, veículo, serviços e mecânico responsável.', tags: ['OS', 'abrir', 'criar', 'ordem de serviço'] },
      { title: 'Adicionar serviços e peças a uma OS', desc: 'Inclua mão de obra, peças do estoque e valores em uma OS já criada.', tags: ['peças', 'serviços', 'adicionar', 'OS'] },
      { title: 'Alterar o status de uma OS', desc: 'Avance a OS pelos estágios: Aberta → Em Andamento → Aguardando Peça → Concluída.', tags: ['status', 'OS', 'andamento', 'concluída'] },
      { title: 'Imprimir ou enviar OS para o cliente', desc: 'Como gerar o PDF da OS e compartilhar com o cliente por WhatsApp ou e-mail.', tags: ['imprimir', 'PDF', 'enviar', 'cliente', 'WhatsApp'] },
      { title: 'Histórico de OS por veículo', desc: 'Consulte todas as ordens de serviço anteriores de um veículo específico.', tags: ['histórico', 'veículo', 'consultar'] },
    ],
  },
  {
    key: 'cadastros',
    label: 'Cadastros',
    icon: <BookUser size={18} />,
    color: '#0E7490',
    bg: 'rgba(14,116,144,0.10)',
    articles: [
      { title: 'Cadastrar um novo cliente', desc: 'Como registrar um cliente com nome, CPF/CNPJ, telefone, e-mail e endereço.', tags: ['cliente', 'cadastrar', 'novo'] },
      { title: 'Adicionar um veículo ao cliente', desc: 'Vincule placa, modelo, marca, ano e cor a um cliente já cadastrado.', tags: ['veículo', 'placa', 'vincular', 'cliente'] },
      { title: 'Editar dados de cliente ou veículo', desc: 'Como atualizar informações de contato, endereço ou dados do veículo.', tags: ['editar', 'atualizar', 'cliente', 'veículo'] },
      { title: 'Pesquisar clientes e veículos', desc: 'Use a busca por nome, CPF, placa ou modelo para localizar rapidamente.', tags: ['busca', 'pesquisar', 'placa', 'CPF'] },
    ],
  },
  {
    key: 'estoque',
    label: 'Estoque',
    icon: <Package size={18} />,
    color: '#9D4E15',
    bg: 'rgba(157,78,21,0.10)',
    articles: [
      { title: 'Cadastrar uma peça no estoque', desc: 'Registre uma peça com código, nome, categoria, fornecedor, preço e quantidade.', tags: ['peça', 'cadastrar', 'estoque', 'código'] },
      { title: 'Registrar entrada de mercadorias', desc: 'Como lançar uma compra de fornecedor e dar entrada no estoque.', tags: ['entrada', 'compra', 'fornecedor', 'estoque'] },
      { title: 'Alertas de estoque mínimo', desc: 'Como definir a quantidade mínima de uma peça para receber alertas.', tags: ['alerta', 'mínimo', 'estoque', 'aviso'] },
      { title: 'Importar peças por planilha', desc: 'Importe um arquivo CSV ou Excel para cadastrar múltiplas peças de uma vez.', tags: ['importar', 'planilha', 'CSV', 'Excel', 'peças'] },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    icon: <Wallet size={18} />,
    color: '#1A6B35',
    bg: 'rgba(26,107,53,0.10)',
    articles: [
      { title: 'Registrar um recebimento', desc: 'Como marcar um valor como recebido e selecionar a forma de pagamento.', tags: ['recebimento', 'pagar', 'registrar', 'pagamento'] },
      { title: 'Lançar uma despesa', desc: 'Registre uma despesa da oficina (aluguel, materiais, fornecedores etc.).', tags: ['despesa', 'lançar', 'custo', 'financeiro'] },
      { title: 'Emitir uma fatura para o cliente', desc: 'Como gerar uma fatura vinculada a uma OS ou avulsa.', tags: ['fatura', 'emitir', 'cliente', 'cobrar'] },
      { title: 'Visualizar saldo e fluxo de caixa', desc: 'Entenda o painel de caixa: entradas, saídas e saldo previsto.', tags: ['caixa', 'saldo', 'fluxo', 'entradas', 'saídas'] },
      { title: 'Relatório de faturamento mensal', desc: 'Como acessar e exportar o relatório de faturamento por período.', tags: ['relatório', 'faturamento', 'mensal', 'exportar'] },
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    icon: <BarChart3 size={18} />,
    color: '#D4601A',
    bg: 'rgba(212,96,26,0.10)',
    articles: [
      { title: 'Filtrar relatório por período', desc: 'Como selecionar datas inicial e final ou usar períodos predefinidos (7d, 30d, etc.).', tags: ['filtro', 'período', 'data', 'relatório'] },
      { title: 'Relatório de desempenho da equipe', desc: 'Veja os OS concluídas, tempo médio e receita por mecânico.', tags: ['equipe', 'mecânico', 'desempenho', 'OS'] },
      { title: 'Análise de serviços mais realizados', desc: 'Identifique quais serviços geram mais receita e são mais frequentes.', tags: ['serviços', 'análise', 'receita', 'frequência'] },
      { title: 'Exportar relatório em PDF ou Excel', desc: 'Como baixar os dados do relatório nos formatos disponíveis.', tags: ['exportar', 'PDF', 'Excel', 'baixar'] },
    ],
  },
  {
    key: 'equipe',
    label: 'Equipe',
    icon: <Users size={18} />,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    articles: [
      { title: 'Adicionar um novo usuário', desc: 'Como criar um login para um novo colaborador definindo cargo e permissões.', tags: ['usuário', 'colaborador', 'adicionar', 'login'] },
      { title: 'Alterar cargo de um usuário', desc: 'Mude o cargo de Mecânico, Recepcionista, Gerente ou Administrador.', tags: ['cargo', 'alterar', 'permissão', 'usuário'] },
      { title: 'Desativar ou reativar um usuário', desc: 'Como desativar temporariamente o acesso de um colaborador sem excluí-lo.', tags: ['desativar', 'reativar', 'usuário', 'acesso'] },
      { title: 'Diferença entre cargos e permissões', desc: 'Entenda o que cada cargo pode acessar no sistema.', tags: ['cargo', 'permissão', 'acesso', 'diferença'] },
    ],
  },
  {
    key: 'configuracoes',
    label: 'Configurações',
    icon: <Settings size={18} />,
    color: '#374151',
    bg: 'rgba(55,65,81,0.10)',
    articles: [
      { title: 'Configurar dados da oficina', desc: 'Atualize nome, CNPJ, endereço, telefone e logo da sua oficina.', tags: ['oficina', 'dados', 'CNPJ', 'logo', 'configurar'] },
      { title: 'Alterar tema (claro / escuro)', desc: 'Como alternar entre o tema claro e o tema escuro do sistema.', tags: ['tema', 'claro', 'escuro', 'aparência'] },
      { title: 'Configurar formas de pagamento aceitas', desc: 'Defina quais métodos de pagamento sua oficina aceita (cartão, Pix, dinheiro etc.).', tags: ['pagamento', 'Pix', 'cartão', 'dinheiro', 'forma'] },
      { title: 'Backup e exportação de dados', desc: 'Como fazer backup das informações e exportar os dados do sistema.', tags: ['backup', 'exportar', 'dados', 'segurança'] },
    ],
  },
]

interface FaqItem {
  q: string
  a: string
  tags: string[]
}

const FAQS: FaqItem[] = [
  {
    q: 'Como faço login no sistema?',
    a: 'Use o e-mail e senha cadastrados pelo administrador da oficina. Na tela de login, informe suas credenciais e clique em "Entrar". Caso tenha esquecido a senha, entre em contato com o administrador.',
    tags: ['login', 'senha', 'entrar', 'acesso'],
  },
  {
    q: 'Como abrir uma Ordem de Serviço?',
    a: 'Acesse "Serviços" no menu lateral → clique em "Nova OS" → selecione o cliente, o veículo, adicione os serviços desejados e o mecânico responsável → clique em "Criar OS".',
    tags: ['OS', 'ordem de serviço', 'abrir', 'criar'],
  },
  {
    q: 'Como cadastrar um cliente novo?',
    a: 'Vá em "Cadastros" → aba "Clientes" → clique em "Novo cliente" → preencha nome, CPF/CNPJ, telefone e endereço. Após salvar, você pode vincular veículos a esse cliente.',
    tags: ['cliente', 'cadastrar', 'novo', 'CPF'],
  },
  {
    q: 'Um veículo não aparece na lista. O que fazer?',
    a: 'Verifique se o cliente dono do veículo está cadastrado. O veículo precisa estar vinculado a um cliente em "Cadastros → Clientes → detalhe do cliente". Tente também buscar pela placa diretamente.',
    tags: ['veículo', 'não aparece', 'placa', 'busca'],
  },
  {
    q: 'Como registrar uma peça usada em uma OS?',
    a: 'Dentro de uma OS aberta, clique em "Adicionar peça" → busque pelo nome ou código da peça → informe a quantidade → clique em "Adicionar". A peça será descontada do estoque automaticamente.',
    tags: ['peça', 'OS', 'estoque', 'adicionar', 'usar'],
  },
  {
    q: 'Como saber quais peças estão com estoque baixo?',
    a: 'No módulo "Estoque" há uma aba de alertas que lista todas as peças abaixo da quantidade mínima configurada. Você também pode ver esses alertas no painel Início.',
    tags: ['estoque', 'baixo', 'alerta', 'mínimo', 'peça'],
  },
  {
    q: 'Como registrar um pagamento recebido?',
    a: 'Acesse "Financeiro" → aba "Receber" → localize o lançamento → clique nele e selecione "Marcar como pago" → informe a data e forma de pagamento. O saldo de caixa será atualizado automaticamente.',
    tags: ['pagamento', 'receber', 'registrar', 'pago', 'caixa'],
  },
  {
    q: 'Como alterar minha senha?',
    a: 'Acesse "Configurações" → aba "Conta" → clique em "Alterar senha" → informe a senha atual e a nova senha desejada. A alteração entra em vigor no próximo login.',
    tags: ['senha', 'alterar', 'conta', 'configurações'],
  },
  {
    q: 'Como adicionar um mecânico ao sistema?',
    a: 'Vá em "Equipe" → clique em "Novo usuário" → preencha nome, e-mail e selecione o cargo "Mecânico" → defina a especialidade se desejar → clique em "Adicionar usuário".',
    tags: ['mecânico', 'adicionar', 'usuário', 'equipe'],
  },
  {
    q: 'O que fazer se o sistema estiver lento?',
    a: 'Limpe o cache do navegador (Ctrl+Shift+Del) e recarregue a página (F5). Se o problema persistir, verifique sua conexão com a internet e tente acessar por outro navegador.',
    tags: ['lento', 'cache', 'navegador', 'lentidão', 'problema'],
  },
  {
    q: 'Como exportar os dados do sistema?',
    a: 'Acesse "Configurações" → aba "Dados" → clique em "Exportar dados". Você pode baixar um arquivo com clientes, veículos, OS, financeiro e estoque nos formatos JSON ou Excel.',
    tags: ['exportar', 'dados', 'backup', 'download'],
  },
  {
    q: 'Um usuário foi desligado. Como desativar o acesso dele?',
    a: 'Acesse "Equipe" → clique no usuário → no painel lateral clique em "Desativar usuário". O acesso é bloqueado imediatamente, mas os dados gerados por ele são preservados.',
    tags: ['desativar', 'usuário', 'bloquear', 'acesso', 'desligado'],
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function FaqRow({ item, defaultOpen = false }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-[var(--surface-hover)] transition-colors group"
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug flex-1">{item.q}</span>
        <ChevronDown
          size={15}
          className={cn('flex-shrink-0 mt-0.5 text-[var(--text-muted)] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  )
}

function ModuleCard({ mod, query }: { mod: ModuleDef; query: string }) {
  const [open, setOpen] = useState(false)

  const matchedArticles = useMemo(() => {
    if (!query) return mod.articles
    const q = query.toLowerCase()
    return mod.articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q)),
    )
  }, [mod.articles, query])

  if (query && matchedArticles.length === 0) return null

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
      >
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: mod.bg, color: mod.color }}
        >
          {mod.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[var(--text-primary)]">{mod.label}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{matchedArticles.length} {matchedArticles.length === 1 ? 'artigo' : 'artigos'}</p>
        </div>
        <ChevronDown
          size={14}
          className={cn('flex-shrink-0 text-[var(--text-muted)] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {(open || !!query) && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {matchedArticles.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-default">
              <FileText size={13} className="flex-shrink-0 mt-0.5 text-[var(--text-muted)]" />
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{a.title}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Section = 'todos' | 'artigos' | 'faq'

const TIPS = [
  { icon: <Lightbulb size={14} />, text: 'Use Ctrl+K para abrir a busca rápida de qualquer lugar do sistema.' },
  { icon: <CheckCircle2 size={14} />, text: 'OS concluídas geram automaticamente um lançamento no Financeiro.' },
  { icon: <AlertTriangle size={14} />, text: 'Configure a quantidade mínima no Estoque para receber alertas de reposição.' },
  { icon: <Wrench size={14} />, text: 'Atribua sempre um mecânico responsável ao criar uma OS para melhor rastreabilidade.' },
]

export function AjudaPage() {
  const [query,   setQuery]   = useState('')
  const [section, setSection] = useState<Section>('todos')
  const [showAll, setShowAll] = useState(false)

  const filteredFaqs = useMemo(() => {
    if (!query) return FAQS
    const q = query.toLowerCase()
    return FAQS.filter(f =>
      f.q.toLowerCase().includes(q) ||
      f.a.toLowerCase().includes(q) ||
      f.tags.some(t => t.includes(q)),
    )
  }, [query])

  const filteredModules = useMemo(() => {
    if (!query) return MODULES
    const q = query.toLowerCase()
    return MODULES.filter(m =>
      m.label.toLowerCase().includes(q) ||
      m.articles.some(a =>
        a.title.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q)),
      ),
    )
  }, [query])

  const totalArticles = MODULES.reduce((s, m) => s + m.articles.length, 0)
  const hasResults = filteredFaqs.length > 0 || filteredModules.some(m =>
    !query || m.articles.some(a =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()),
    ),
  )

  const visibleFaqs = showAll ? filteredFaqs : filteredFaqs.slice(0, 6)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[860px] mx-auto px-6 py-8 space-y-8">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div
          className="rounded-xl px-8 py-10 flex flex-col items-center text-center gap-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }}
          />
          <div className="relative z-10 space-y-3 w-full max-w-[540px]">
            <div className="flex items-center justify-center gap-2 text-white/80 text-[12px] font-semibold uppercase tracking-widest">
              <HelpCircle size={14} /> Central de Ajuda
            </div>
            <h1 className="text-[28px] font-extrabold text-white leading-tight tracking-tight">
              Como podemos te ajudar?
            </h1>
            <p className="text-[13px] text-white/75 leading-relaxed">
              Busque artigos, tutoriais e respostas para as dúvidas mais comuns sobre o GaragePro.
            </p>

            {/* Search */}
            <div className="relative mt-2">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setShowAll(false) }}
                placeholder="Buscar artigos, tutoriais, perguntas..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-white text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-white/30 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* ── Stats bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-6 text-[12px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} className="text-[var(--brand)]" />
            <strong className="text-[var(--text-primary)]">{totalArticles}</strong> artigos
          </span>
          <span className="text-[var(--border)]">·</span>
          <span className="flex items-center gap-1.5">
            <HelpCircle size={12} className="text-[var(--brand)]" />
            <strong className="text-[var(--text-primary)]">{FAQS.length}</strong> perguntas frequentes
          </span>
          <span className="text-[var(--border)]">·</span>
          <span className="flex items-center gap-1.5">
            <Package size={12} className="text-[var(--brand)]" />
            <strong className="text-[var(--text-primary)]">{MODULES.length}</strong> módulos
          </span>
          {query && (
            <>
              <span className="text-[var(--border)]">·</span>
              <button
                onClick={() => setQuery('')}
                className="text-[var(--brand)] font-medium hover:underline"
              >
                Limpar busca
              </button>
            </>
          )}
        </div>

        {/* ── No results ────────────────────────────────────────── */}
        {query && !hasResults && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Search size={32} className="text-[var(--text-disabled)]" />
            <p className="text-[14px] font-semibold text-[var(--text-secondary)]">Nenhum resultado para "{query}"</p>
            <p className="text-[12px] text-[var(--text-muted)]">Tente usar outros termos ou navegue pelas categorias abaixo.</p>
            <button onClick={() => setQuery('')} className="text-[12px] font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
              Limpar busca
            </button>
          </div>
        )}

        {/* ── Section tabs ──────────────────────────────────────── */}
        {!query && (
          <div className="flex items-center gap-1 border-b border-[var(--border)]">
            {([
              ['todos',   'Tudo'],
              ['artigos', 'Artigos por módulo'],
              ['faq',     'Perguntas frequentes'],
            ] as [Section, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={cn(
                  'relative h-9 px-3 text-[12px] font-medium transition-colors',
                  section === key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                )}
              >
                {label}
                {section === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full" style={{ backgroundColor: 'var(--brand)' }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Dicas rápidas ─────────────────────────────────────── */}
        {(section === 'todos' || query) && (
          <div>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Dicas rápidas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TIPS.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                >
                  <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand)' }}>{tip.icon}</span>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Artigos por módulo ────────────────────────────────── */}
        {(section === 'todos' || section === 'artigos' || query) && (
          <div>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {query ? 'Artigos encontrados' : 'Artigos por módulo'}
            </p>
            <div className="space-y-2">
              {(query ? filteredModules : MODULES).map(mod => (
                <ModuleCard key={mod.key} mod={mod} query={query} />
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ───────────────────────────────────────────────── */}
        {(section === 'todos' || section === 'faq' || query) && filteredFaqs.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              {query ? 'Perguntas relacionadas' : 'Perguntas frequentes'}
            </p>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {visibleFaqs.map((f, i) => (
                <FaqRow key={i} item={f} defaultOpen={i === 0 && !!query} />
              ))}
            </div>
            {filteredFaqs.length > 6 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-3 w-full py-2.5 rounded-lg border border-[var(--border)] text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5"
              >
                Ver mais {filteredFaqs.length - 6} perguntas <ChevronDown size={13} />
              </button>
            )}
          </div>
        )}

        {/* ── Suporte ───────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Ainda precisa de ajuda?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ContactCard
              icon={<MessageCircle size={20} />}
              color="var(--success)"
              bg="var(--success-subtle)"
              label="WhatsApp"
              desc="Atendimento rápido via WhatsApp, seg–sex das 8h às 18h."
              action="Abrir conversa"
            />
            <ContactCard
              icon={<Mail size={20} />}
              color="var(--brand)"
              bg="rgba(212,96,26,0.10)"
              label="E-mail"
              desc="Envie sua dúvida detalhada para suporte@garagepro.com.br."
              action="Enviar e-mail"
            />
            <ContactCard
              icon={<BookOpen size={20} />}
              color="#7C3AED"
              bg="rgba(124,58,237,0.10)"
              label="Documentação"
              desc="Acesse a documentação técnica completa do sistema."
              action="Ver documentação"
            />
          </div>
        </div>

      </div>
    </div>
  )
}

function ContactCard({ icon, color, bg, label, desc, action }: {
  icon: React.ReactNode; color: string; bg: string
  label: string; desc: string; action: string
}) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all">
      <span className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg, color }}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button
        className="flex items-center gap-1 text-[12px] font-semibold transition-colors hover:opacity-80"
        style={{ color }}
      >
        {action} <ChevronRight size={12} />
      </button>
    </div>
  )
}
