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

export async function login(req: LoginRequest): Promise<AuthResponse> {
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
