import type { Exercise, HintResult, RunResult } from './types'

const defaultBaseUrl = 'http://127.0.0.1:3000'

export function resolveApiBaseUrl(configured: string = defaultBaseUrl): string {
  const trimmed = configured.trim()
  return trimmed ? trimmed.replace(/\/+$/, '') : defaultBaseUrl
}

const baseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined)

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Could not reach the local Code Coach service. Is it running?')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String(payload.error)
        : `The local service returned an error (${response.status}).`
    throw new ApiError(message, response.status)
  }
  return payload as T
}

export function listExercises(): Promise<Exercise[]> {
  return request<Exercise[]>('/api/v1/exercises')
}

export function runExercise(id: string, code: string): Promise<RunResult> {
  return request<RunResult>(`/api/v1/exercises/${encodeURIComponent(id)}/run`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function requestHint(id: string, code: string): Promise<HintResult> {
  return request<HintResult>(`/api/v1/exercises/${encodeURIComponent(id)}/hint`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}
