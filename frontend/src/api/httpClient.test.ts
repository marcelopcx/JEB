import { describe, expect, it, vi } from 'vitest'
import { HttpRequestError } from './errors'
import { createHttpClient } from './httpClient'
import type { HttpExchange } from './types'

function clientFor(fetchFn: typeof fetch, captured: HttpExchange[]) {
  const times = [10, 27]

  return createHttpClient({
    fetchFn,
    onExchange: (exchange) => captured.push(exchange),
    monotonicNow: () => times.shift() ?? 27,
    startedAt: () => '2026-07-19T20:00:00.000Z',
    createId: () => 'exchange-1',
  })
}

describe('httpClient', () => {
  it('returns JSON and captures method, path, duration, request, and response', async () => {
    const captured: HttpExchange[] = []
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ userId: 'demo-eliab', items: [], total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const client = clientFor(fetchFn, captured)

    const result = await client.request<{ total: number }>('POST', '/api/cart/demo-eliab/items', {
      productId: 1,
      quantity: 2,
    })

    expect(result.total).toBe(0)
    expect(fetchFn).toHaveBeenCalledWith('/api/cart/demo-eliab/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 1, quantity: 2 }),
    })
    expect(captured).toEqual([
      {
        id: 'exchange-1',
        method: 'POST',
        path: '/api/cart/demo-eliab/items',
        startedAt: '2026-07-19T20:00:00.000Z',
        durationMs: 17,
        requestBody: { productId: 1, quantity: 2 },
        status: 200,
        responseBody: { userId: 'demo-eliab', items: [], total: 0 },
        outcome: 'success',
      },
    ])
  })

  it('shows a backend JSON error message for a rejected response', async () => {
    const captured: HttpExchange[] = []
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Producto no encontrado: 999' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(clientFor(fetchFn, captured).request('GET', '/api/products/999')).rejects.toMatchObject({
      kind: 'http',
      message: 'Producto no encontrado: 999',
    } satisfies Partial<HttpRequestError>)
    expect(captured[0]).toMatchObject({
      status: 404,
      responseBody: { error: 'Producto no encontrado: 999' },
      outcome: 'http-error',
    })
  })

  it('preserves raw text when a rejected response is not JSON', async () => {
    const captured: HttpExchange[] = []
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('WildFly unavailable', { status: 503, statusText: 'Service Unavailable' }),
    )

    await expect(clientFor(fetchFn, captured).request('GET', '/api/products')).rejects.toMatchObject({
      kind: 'http',
      message: 'WildFly unavailable',
    })
    expect(captured[0]).toMatchObject({
      status: 503,
      responseBody: 'WildFly unavailable',
      outcome: 'http-error',
    })
  })

  it('distinguishes an unreachable backend from an HTTP rejection', async () => {
    const captured: HttpExchange[] = []
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(clientFor(fetchFn, captured).request('GET', '/api/products')).rejects.toMatchObject({
      kind: 'network',
      message: 'No se puede acceder al backend: error de red.',
    })
    expect(captured[0]).toMatchObject({
      status: null,
      responseBody: 'No se pudo completar la solicitud de red.',
      outcome: 'network-error',
    })
  })

  it('recognizes an empty Vite proxy 502 as unreachable while preserving its status', async () => {
    const captured: HttpExchange[] = []
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('', { status: 502, statusText: 'Bad Gateway' }),
    )

    await expect(clientFor(fetchFn, captured).request('GET', '/api/products')).rejects.toMatchObject({
      kind: 'network',
      message: 'No se puede acceder al backend: HTTP 502',
    })
    expect(captured[0]).toMatchObject({
      status: 502,
      responseBody: null,
      outcome: 'network-error',
    })
  })
})
