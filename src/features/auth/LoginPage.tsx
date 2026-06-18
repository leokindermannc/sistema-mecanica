import { useState } from 'react'
import { Eye, EyeOff, Wrench, ArrowRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [remember, setRemember]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setError('')
    setLoading(true)
    try {
      const auth = await login({ email, password })
      setUser({ name: auth.name, email: auth.email, role: auth.role, companyId: auth.companyId, companyName: auth.companyName })
      navigate('/patio', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ── Background ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[#0A0F1E]" />
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 20% 110%, rgba(249,115,22,0.18) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 80% -10%, rgba(99,102,241,0.14) 0%, transparent 55%)',
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(15,23,42,0.6) 0%, transparent 100%)',
          ].join(', '),
        }}
      />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-[420px] mx-4 rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(32px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        <div className="px-9 py-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
              }}
            >
              <Wrench size={26} className="text-white" strokeWidth={2.2} />
            </div>
            <h1 className="text-[26px] font-black text-white tracking-tight leading-tight text-center">
              Bem-vindo de{' '}
              <span style={{ color: '#F97316' }}>volta!</span>
            </h1>
            <p className="text-[13px] text-white/50 mt-2 text-center leading-snug">
              Acesse o GaragePro para gerenciar<br />sua oficina com inteligência.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl px-4 text-[13px] text-white placeholder:text-white/25 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
                  e.currentTarget.style.background   = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(249,115,22,0.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.currentTarget.style.background   = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.boxShadow    = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 pr-11 text-[13px] text-white placeholder:text-white/25 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
                    e.currentTarget.style.background   = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(249,115,22,0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    e.currentTarget.style.background   = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.boxShadow    = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  onClick={() => setRemember(!remember)}
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
                  style={{
                    background: remember ? '#F97316' : 'rgba(255,255,255,0.08)',
                    border: remember ? '1px solid #F97316' : '1px solid rgba(255,255,255,0.15)',
                    boxShadow: remember ? '0 0 0 2px rgba(249,115,22,0.2)' : 'none',
                  }}
                >
                  {remember && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[12px] text-white/50 group-hover:text-white/70 transition-colors">
                  Lembrar-me
                </span>
              </label>
              <button
                type="button"
                className="text-[12px] text-white/50 hover:text-[#F97316] transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[11px] text-red-400 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-60"
              style={{
                background: loading
                  ? 'rgba(249,115,22,0.6)'
                  : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(249,115,22,0.5)'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.35)'
              }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Entrando...</>
              ) : (
                <>Entrar <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-white/30 mt-7">
            Sem acesso?{' '}
            <button className="text-white/55 hover:text-[#F97316] transition-colors font-semibold">
              Solicite ao administrador
            </button>
          </p>
        </div>

        {/* Bottom gradient line */}
        <div
          className="h-[2px] w-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.6) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Version tag */}
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/20 select-none">
        GaragePro ERP · v0.1
      </p>
    </div>
  )
}
