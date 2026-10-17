import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from './App.vue'

const exercises = [
  {
    id: 'hello-world',
    title: 'Say hello',
    objective: 'Build a small function.',
    instructions: 'Return a greeting.',
    topic: 'Functions',
    difficulty: 'Beginner',
    starterCode: 'pub fn greeting() -> String {\n  ""\n}',
    example: 'greeting() // "Hello, Gleam!"',
  },
  {
    id: 'add-two',
    title: 'Add two numbers',
    objective: 'Practice integer arithmetic.',
    instructions: 'Return the sum of both values.',
    topic: 'Integers',
    difficulty: 'Beginner',
    starterCode: 'pub fn add_two(a: Int, b: Int) -> Int {\n  0\n}',
    example: 'add_two(20, 22) // 42',
  },
]

function mockResponse(payload: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => payload } as Response
}

function installApiMock(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('learner workspace', () => {
  it('loads exercises, selects another exercise, and resets its code', async () => {
    const fetchMock = installApiMock((url) =>
      mockResponse(url.endsWith('/exercises') ? exercises : {}),
    )
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.text()).toContain('Say hello')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Add two numbers'))!
      .trigger('click')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toContain('add_two')

    await wrapper.get('textarea').setValue('broken code')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Reset starter'))!
      .trigger('click')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toContain('  0')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('shows successful and failing simulated runs from the service', async () => {
    let call = 0
    installApiMock((url) => {
      if (url.endsWith('/exercises')) return mockResponse(exercises)
      call += 1
      return mockResponse({
        passed: call === 1,
        summary: call === 1 ? 'All checks passed' : 'One check still needs work',
        output: 'Example check',
      })
    })
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run checks'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('All checks passed')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run checks'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('One check still needs work')
    wrapper.unmount()
  })

  it('keeps the loading state visible while a run is pending', async () => {
    let finishRun: ((response: Response) => void) | undefined
    installApiMock((url) => {
      if (url.endsWith('/exercises')) return mockResponse(exercises)
      return new Promise((resolve) => {
        finishRun = resolve
      })
    })
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run checks'))!
      .trigger('click')
    expect(wrapper.text()).toContain('Checking…')
    expect(wrapper.find('.run-button').attributes('disabled')).toBeDefined()

    finishRun!(mockResponse({ passed: true, summary: 'All checks passed', output: 'passed' }))
    await flushPromises()
    expect(wrapper.text()).toContain('All checks passed')
    wrapper.unmount()
  })

  it('displays a context hint and allows retry after an error', async () => {
    let hintCalls = 0
    installApiMock((url) => {
      if (url.endsWith('/exercises')) return mockResponse(exercises)
      hintCalls += 1
      return hintCalls === 1
        ? mockResponse({ error: 'The coach is temporarily unavailable.' }, 503)
        : mockResponse({ hint: 'Try returning a string value.' })
    })
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Give me a hint'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('temporarily unavailable')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Try again'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Try returning a string value.')
    expect(wrapper.text()).not.toContain('temporarily unavailable')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Add two numbers'))!
      .trigger('click')
    expect(wrapper.text()).not.toContain('Try returning a string value.')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toContain('add_two')
    wrapper.unmount()
  })

  it('offers a retry when the service is unavailable during startup', async () => {
    let attempts = 0
    installApiMock(() => {
      attempts += 1
      return attempts === 1 ? mockResponse({ error: 'offline' }, 503) : mockResponse(exercises)
    })
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.text()).toContain('offline')

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Try again'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Say hello')
    wrapper.unmount()
  })
})
