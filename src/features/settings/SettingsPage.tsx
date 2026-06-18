import { useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Building2, User, Bell, Palette, Shield, Puzzle,
  ChevronRight, Save, Eye, EyeOff, Check,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | 'geral'
  | 'conta'
  | 'notificacoes'
  | 'aparencia'
  | 'seguranca'
  | 'integracoes'

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV: Array<{ key: Section; label: string; subtitle: string; Icon: React.ElementType }> = [
  { key: 'geral',        label: 'Geral',         subtitle: 'Dados da oficina',           Icon: Building2 },
  { key: 'conta',        label: 'Minha Conta',   subtitle: 'Informações pessoais',        Icon: User      },
  { key: 'notificacoes', label: 'Notificações',  subtitle: 'Preferências de alertas',     Icon: Bell      },
  { key: 'aparencia',    label: 'Aparência',     subtitle: 'Tema e idioma',               Icon: Palette   },
  { key: 'seguranca',    label: 'Segurança',     subtitle: 'Senha e acesso',              Icon: Shield    },
  { key: 'integracoes',  label: 'Integrações',   subtitle: 'WhatsApp e serviços externos',Icon: Puzzle    },
]

// ─── Shared input components ──────────────────────────────────────────────────

function FormInput({
  label, value, onChange, type = 'text', placeholder = '', readOnly = false,
}: {
  label: string; value: string; placeholder?: string; type?: string; readOnly?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-t-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange}
        className={cn(
          'w-full h-9 rounded-xl border border-t-border text-[12px] text-t-text placeholder:text-t-muted px-3',
          'focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all',
          readOnly ? 'bg-t-surface cursor-default' : 'bg-t-card',
        )}
      />
    </div>
  )
}

function FormTextarea({
  label, value, onChange, rows = 3, placeholder = '',
}: {
  label: string; value: string; rows?: number; placeholder?: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-t-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-xl border border-t-border text-[12px] text-t-text placeholder:text-t-muted px-3 py-2 bg-t-card resize-none focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all"
      />
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-t-border last:border-0">
      <div>
        <p className="text-[12px] font-semibold text-t-text">{label}</p>
        {description && <p className="text-[10px] text-t-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200',
          checked ? 'bg-[#F97316]' : 'bg-t-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

function SaveButton({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-4 border-t border-t-border mt-6">
      <button
        onClick={onSave}
        className={cn(
          'flex items-center gap-1.5 h-8 px-4 rounded-xl text-[11px] font-bold transition-all',
          saved
            ? 'bg-green-600 text-white'
            : 'bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white shadow-sm',
        )}
      >
        {saved ? <><Check size={12} />Salvo!</> : <><Save size={11} />Salvar alterações</>}
      </button>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function GeralSection() {
  const [form, setForm] = useState({
    name: 'GaragePro Oficina', cnpj: '12.345.678/0001-99',
    phone: '(11) 3333-4444', email: 'contato@garagepro.com.br',
    address: 'Rua das Oficinas, 123', city: 'São Paulo', state: 'SP', zip: '01000-000',
    openTime: '08:00', closeTime: '18:00', notes: '',
  })
  const [saved, setSaved] = useState(false)
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[14px] font-bold text-t-text">Dados da Oficina</h2>
        <p className="text-[11px] text-t-muted mt-0.5">Informações públicas e de contato da sua empresa.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3">
          <FormInput label="Nome da oficina" value={form.name} onChange={set('name')} />
        </div>
        <FormInput label="CNPJ" value={form.cnpj} onChange={set('cnpj')} />
        <FormInput label="Telefone" value={form.phone} onChange={set('phone')} type="tel" />
        <FormInput label="E-mail de contato" value={form.email} onChange={set('email')} type="email" />
      </div>

      <div className="pt-1">
        <p className="text-[10px] font-bold text-t-muted uppercase tracking-wider mb-3">Endereço</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3">
            <FormInput label="Logradouro" value={form.address} onChange={set('address')} />
          </div>
          <FormInput label="Cidade" value={form.city} onChange={set('city')} />
          <FormInput label="Estado" value={form.state} onChange={set('state')} />
          <FormInput label="CEP" value={form.zip} onChange={set('zip')} />
        </div>
      </div>

      <div className="pt-1">
        <p className="text-[10px] font-bold text-t-muted uppercase tracking-wider mb-3">Horário de funcionamento</p>
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Abertura" value={form.openTime} onChange={set('openTime')} type="time" />
          <FormInput label="Fechamento" value={form.closeTime} onChange={set('closeTime')} type="time" />
        </div>
      </div>

      <FormTextarea label="Observações internas" value={form.notes} onChange={set('notes')}
        placeholder="Informações adicionais sobre a oficina..." rows={2} />

      <SaveButton saved={saved} onSave={handleSave} />
    </div>
  )
}

function ContaSection() {
  const [form, setForm] = useState({
    firstName: 'Leonardo', lastName: 'Campos',
    email: 'leonardo@garagepro.com.br', phone: '(11) 99999-0001', role: 'Administrador',
  })
  const [saved, setSaved] = useState(false)
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[14px] font-bold text-t-text">Minha Conta</h2>
        <p className="text-[11px] text-t-muted mt-0.5">Suas informações pessoais de acesso ao sistema.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormInput label="Nome" value={form.firstName} onChange={set('firstName')} />
        <FormInput label="Sobrenome" value={form.lastName} onChange={set('lastName')} />
        <FormInput label="Função" value={form.role} readOnly />
        <div className="col-span-2">
          <FormInput label="E-mail" value={form.email} onChange={set('email')} type="email" />
        </div>
        <FormInput label="Telefone" value={form.phone} onChange={set('phone')} type="tel" />
      </div>
      <SaveButton saved={saved} onSave={handleSave} />
    </div>
  )
}

function NotificacoesSection() {
  const [prefs, setPrefs] = useState({
    novaOs: true, aprovacao: true, concluido: true,
    atrasado: true, estoqueBaixo: false, resumoDiario: false,
  })
  const [saved, setSaved] = useState(false)
  const toggle = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }))
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[14px] font-bold text-t-text">Notificações</h2>
        <p className="text-[11px] text-t-muted mt-0.5">Escolha quando você deseja ser notificado.</p>
      </div>
      <div className="rounded-xl border border-t-border bg-t-card px-4 divide-y divide-t-border overflow-hidden">
        <Toggle label="Nova OS criada"           description="Ao registrar uma nova ordem de serviço"       checked={prefs.novaOs}       onChange={toggle('novaOs')} />
        <Toggle label="Aguardando aprovação"     description="Cliente precisa aprovar o orçamento enviado"  checked={prefs.aprovacao}    onChange={toggle('aprovacao')} />
        <Toggle label="Serviço concluído"        description="Mecânico marcou a OS como pronta"             checked={prefs.concluido}    onChange={toggle('concluido')} />
        <Toggle label="OS atrasada"              description="Prazo estimado de entrega ultrapassado"       checked={prefs.atrasado}     onChange={toggle('atrasado')} />
        <Toggle label="Estoque baixo"            description="Peça atingiu o nível mínimo de estoque"      checked={prefs.estoqueBaixo} onChange={toggle('estoqueBaixo')} />
        <Toggle label="Resumo diário"            description="Relatório automático ao final do dia"         checked={prefs.resumoDiario} onChange={toggle('resumoDiario')} />
      </div>
      <SaveButton saved={saved} onSave={handleSave} />
    </div>
  )
}

function AparenciaSection() {
  const [theme, setTheme]   = useState<'light' | 'dark' | 'system'>('system')
  const [lang, setLang]     = useState('pt-BR')
  const [saved, setSaved]   = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const THEMES: Array<{ key: 'light' | 'dark' | 'system'; label: string; preview: string }> = [
    { key: 'light',  label: 'Claro',    preview: 'bg-white border-gray-200' },
    { key: 'dark',   label: 'Escuro',   preview: 'bg-[#0F172A] border-slate-700' },
    { key: 'system', label: 'Sistema',  preview: 'bg-gradient-to-br from-white to-[#0F172A] border-gray-300' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[14px] font-bold text-t-text">Aparência</h2>
        <p className="text-[11px] text-t-muted mt-0.5">Personalize como o sistema é exibido para você.</p>
      </div>

      <div>
        <p className="text-[10px] font-bold text-t-muted uppercase tracking-wider mb-3">Tema</p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ key, label, preview }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                theme === key
                  ? 'border-[#F97316] bg-orange-50 dark:bg-orange-900/10'
                  : 'border-t-border hover:border-gray-300 dark:hover:border-white/20',
              )}
            >
              <div className={cn('w-full h-12 rounded-lg border', preview)} />
              <span className="text-[11px] font-semibold text-t-secondary">{label}</span>
              {theme === key && (
                <span className="text-[9px] font-bold text-[#F97316]">Ativo</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-t-muted uppercase tracking-wider mb-1.5">Idioma</p>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="h-9 px-3 w-full bg-t-card border border-t-border rounded-xl text-[12px] text-t-text focus:outline-none focus:ring-1 focus:ring-accent/40 cursor-pointer"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es">Español</option>
        </select>
      </div>

      <SaveButton saved={saved} onSave={handleSave} />
    </div>
  )
}

function PwdInput({
  label, value, show, onChange, onToggle,
}: {
  label: string; value: string; show: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onToggle: () => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-t-muted uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full h-9 rounded-xl border border-t-border bg-t-card text-[12px] text-t-text px-3 pr-9 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-t-muted hover:text-t-secondary transition-colors"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  )
}

function SegurancaSection() {
  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext,    setShowNext]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saved, setSaved] = useState(false)

  const isValid = current && next && next === confirm && next.length >= 8
  const handleSave = () => {
    if (!isValid) return
    setSaved(true)
    setCurrent(''); setNext(''); setConfirm('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[14px] font-bold text-t-text">Segurança</h2>
        <p className="text-[11px] text-t-muted mt-0.5">Gerencie sua senha de acesso ao sistema.</p>
      </div>

      <div className="rounded-xl border border-t-border bg-t-card p-4 space-y-4 max-w-[640px]">
        <p className="text-[11px] font-semibold text-t-secondary">Alterar senha</p>
        <div className="grid grid-cols-2 gap-4">
          <PwdInput label="Senha atual" value={current} show={showCurrent}
            onChange={(e) => setCurrent(e.target.value)} onToggle={() => setShowCurrent(!showCurrent)} />
          <div />
          <PwdInput label="Nova senha" value={next} show={showNext}
            onChange={(e) => setNext(e.target.value)} onToggle={() => setShowNext(!showNext)} />
          <PwdInput label="Confirmar nova senha" value={confirm} show={showConfirm}
            onChange={(e) => setConfirm(e.target.value)} onToggle={() => setShowConfirm(!showConfirm)} />
        </div>
        {next && confirm && next !== confirm && (
          <p className="text-[10px] text-red-500">As senhas não coincidem.</p>
        )}
        {next && next.length < 8 && (
          <p className="text-[10px] text-amber-600">A senha deve ter pelo menos 8 caracteres.</p>
        )}
      </div>

      <SaveButton saved={saved} onSave={handleSave} />
    </div>
  )
}

function IntegracoesSection() {
  const [waToken, setWaToken] = useState('')
  const [waPhone, setWaPhone] = useState('')
  const [saved, setSaved]     = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[14px] font-bold text-t-text">Integrações</h2>
        <p className="text-[11px] text-t-muted mt-0.5">Conecte o GaragePro com serviços externos.</p>
      </div>

      {/* WhatsApp */}
      <div className="rounded-xl border border-t-border bg-t-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-t-border bg-t-surface">
          <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-600">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.874L0 24l6.305-1.51A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.031-1.381l-.361-.214-3.741.896.93-3.635-.235-.374A9.81 9.81 0 012.182 12C2.182 6.571 6.571 2.182 12 2.182S21.818 6.571 21.818 12 17.429 21.818 12 21.818z" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-bold text-t-text">WhatsApp Business API</p>
            <p className="text-[10px] text-t-muted">Envio automático de mensagens aos clientes</p>
          </div>
          <span className={cn(
            'ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border',
            waToken
              ? 'text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/30'
              : 'text-t-muted border-t-border bg-t-surface',
          )}>
            {waToken ? 'Conectado' : 'Não configurado'}
          </span>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-t-muted uppercase tracking-wider mb-1.5">
              Token de acesso
            </label>
            <input
              type="password"
              value={waToken}
              onChange={(e) => setWaToken(e.target.value)}
              placeholder="EAAxxxxxxxx..."
              className="w-full h-9 rounded-xl border border-t-border bg-t-surface text-[12px] text-t-text placeholder:text-t-muted px-3 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-t-muted uppercase tracking-wider mb-1.5">
              Número do telefone (com DDI)
            </label>
            <input
              type="text"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="+55 11 99999-0000"
              className="w-full h-9 rounded-xl border border-t-border bg-t-surface text-[12px] text-t-text placeholder:text-t-muted px-3 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Placeholder for future integrations */}
      <div className="rounded-xl border border-dashed border-t-border p-5 text-center">
        <p className="text-[11px] text-t-muted">Mais integrações em breve</p>
        <p className="text-[10px] text-t-muted/60 mt-0.5">E-mail marketing, NF-e, sistemas de pagamento...</p>
      </div>

      <SaveButton saved={saved} onSave={handleSave} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<Section, React.ElementType> = {
  geral:        GeralSection,
  conta:        ContaSection,
  notificacoes: NotificacoesSection,
  aparencia:    AparenciaSection,
  seguranca:    SegurancaSection,
  integracoes:  IntegracoesSection,
}

export function SettingsPage() {
  const [active, setActive] = useState<Section>('geral')
  const ActiveSection = SECTION_COMPONENTS[active]

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] overflow-hidden bg-t-bg">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-t-border bg-t-topbar">
        <h1 className="text-[15px] font-bold text-t-text leading-tight tracking-tight">Configurações</h1>
        <p className="text-[10px] text-t-muted mt-0.5">Personalize o GaragePro para a sua oficina.</p>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left nav */}
        <div className="w-[220px] flex-shrink-0 border-r border-t-border bg-t-topbar overflow-y-auto py-3">
          {NAV.map(({ key, label, subtitle, Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-all group',
                active === key
                  ? 'bg-orange-50 dark:bg-orange-900/10 border-r-2 border-[#F97316]'
                  : 'hover:bg-t-surface border-r-2 border-transparent',
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                active === key
                  ? 'bg-[#F97316]/10 text-[#F97316]'
                  : 'bg-t-surface text-t-muted group-hover:text-t-secondary',
              )}>
                <Icon size={13} />
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'text-[11px] font-semibold leading-tight truncate',
                  active === key ? 'text-[#F97316]' : 'text-t-text',
                )}>{label}</p>
                <p className="text-[9px] text-t-muted leading-tight truncate">{subtitle}</p>
              </div>
              <ChevronRight size={10} className={cn(
                'flex-shrink-0 ml-auto transition-colors',
                active === key ? 'text-[#F97316]' : 'text-t-muted',
              )} />
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-4xl px-10 py-6">
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  )
}
