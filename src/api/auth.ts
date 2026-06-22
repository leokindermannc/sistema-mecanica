import { apiFetch } from './client'
import { setToken, clearToken, setStoredUser, getStoredUser } from './token'
export type { StoredUser } from './token'
export { getStoredUser }

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  name: string
  email: string
  role: string
  companyId: number
  companyName: string
}

const MOCK_CREDENTIALS = { email: 'admin@garagepro.com', password: 'admin123' }

export async function login(req: LoginRequest): Promise<AuthResponse> {
  if (import.meta.env.DEV) {
    if (req.email === MOCK_CREDENTIALS.email && req.password === MOCK_CREDENTIALS.password) {
      const data: AuthResponse = {
        token: 'mock-token-dev',
        name: 'Admin',
        email: req.email,
        role: 'ADMINISTRADOR',
        companyId: 1,
        companyName: 'GaragePro',
      }
      setToken(data.token)
      setStoredUser({ name: data.name, email: data.email, role: data.role, companyId: data.companyId, companyName: data.companyName })
      return data
    }
    throw new Error('Credenciais inválidas. Em modo dev use: admin@garagepro.com / admin123')
  }

  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(req),
    skipAuthRedirect: true,
  })
  setToken(data.token)
  setStoredUser({
    name: data.name,
    email: data.email,
    role: data.role,
    companyId: data.companyId,
    companyName: data.companyName,
  })
  return data
}

export function logout(): void {
  clearToken()
}
