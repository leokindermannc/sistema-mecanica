import { getToken, clearToken } from './token'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

interface ApiFetchInit extends RequestInit {
  /** Pass true on the login call to avoid redirect loop on wrong credentials */
  skipAuthRedirect?: boolean
}

function authHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handle401(skip?: boolean): void {
  if (!skip) {
    clearToken()
    window.location.replace('/login')
  }
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({})) as Record<string, unknown>
  return (body['error'] as string | undefined)
    ?? (body['message'] as string | undefined)
    ?? `Erro ${res.status}`
}

export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const { skipAuthRedirect, ...fetchInit } = init ?? {}

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchInit,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(fetchInit.headers ?? {}),
    },
  }).catch(() => {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.')
  })

  if (res.status === 401) {
    handle401(skipAuthRedirect)
    throw new Error(await parseError(res))
  }

  if (!res.ok) throw new Error(await parseError(res))

  return res.json() as Promise<T>
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  }).catch(() => {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.')
  })

  if (res.status === 401) {
    handle401()
    throw new Error(await parseError(res))
  }

  if (!res.ok) throw new Error(await parseError(res))

  return res.json() as Promise<T>
}
