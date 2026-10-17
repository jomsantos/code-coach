import { afterEach, describe, expect, it, vi } from 'vitest'
import { listExercises, requestHint, resolveApiBaseUrl, runExercise } from './api'

const sample = {
  id: 'hello-world',
  title: 'Say hello',
  objective: 'Practice a function.',
  instructions: 'Return a greeting.',
  topic: 'Functions',
  difficulty: 'Beginner',
  starterCode: 'pub fn greeting() { "" }',
  example: 'greeting() // "Hello, Gleam!"',
}

afterEach(() => vi.unstubAllGlobals())

function jsonResponse(payload: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => payload } as Response
}

function invalidJsonResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => {
      throw new SyntaxError('invalid JSON')
    },
  } as unknown as Response
}

describe('local API client', () => {
  it('uses the local default when no API base URL is configured', () => {
    expect(resolveApiBaseUrl()).toBe('http://127.0.0.1:3000')
    expect(resolveApiBaseUrl('   ')).toBe('http://127.0.0.1:3000')
  })

  it('trims whitespace and trailing slashes from a configured API URL', () => {
    expect(resolveApiBaseUrl(' https://localhost:4444/// ')).toBe('https://localhost:4444')
  })

  it('loads exercises from the versioned local API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([sample]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(listExercises()).resolves.toEqual([sample])
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/api/v1/exercises', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('posts code and returns the run result', async () => {
    const result = { passed: true, summary: 'All checks passed', output: 'check passed' }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(result))
    vi.stubGlobal('fetch', fetchMock)

    await expect(runExercise('hello-world', 'fn answer() {}')).resolves.toEqual(result)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/v1/exercises/hello-world/run',
      {
        method: 'POST',
        body: JSON.stringify({ code: 'fn answer() {}' }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
  })

  it('encodes identifiers and returns exercise-specific hints', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ hint: 'Try returning a string.' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(requestHint('hello world', 'some code')).resolves.toEqual({
      hint: 'Try returning a string.',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/v1/exercises/hello%20world/hint',
      {
        method: 'POST',
        body: JSON.stringify({ code: 'some code' }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
  })

  it('surfaces service error messages and status codes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'Enter some code.' }, 400)),
    )

    await expect(listExercises()).rejects.toMatchObject({
      message: 'Enter some code.',
      status: 400,
    })
  })

  it('returns a useful message when the local service cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(listExercises()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Could not reach the local Code Coach service. Is it running?',
    })
  })

  it('handles non-JSON HTTP errors with a status-based fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(invalidJsonResponse(503)))

    await expect(listExercises()).rejects.toMatchObject({
      message: 'The local service returned an error (503).',
      status: 503,
    })
  })

  it('handles unexpected primitive error payloads with the status-based fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('service unavailable', 503)))

    await expect(listExercises()).rejects.toMatchObject({
      message: 'The local service returned an error (503).',
      status: 503,
    })
  })
})
