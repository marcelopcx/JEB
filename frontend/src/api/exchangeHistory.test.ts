import { describe, expect, it } from 'vitest'
import { prependExchange } from './exchangeHistory'
import type { HttpExchange } from './types'

function exchange(id: string): HttpExchange {
  return {
    id,
    method: 'GET',
    path: `/api/products/${id}`,
    startedAt: '2026-07-19T20:00:00.000Z',
    durationMs: 5,
    status: 200,
    responseBody: { id },
    outcome: 'success',
  }
}

describe('prependExchange', () => {
  it('places the newest exchange first', () => {
    expect(prependExchange([exchange('old')], exchange('new')).map(({ id }) => id)).toEqual([
      'new',
      'old',
    ])
  })

  it('keeps only the newest 20 exchanges', () => {
    const existing = Array.from({ length: 20 }, (_, index) => exchange(String(index)))

    const result = prependExchange(existing, exchange('new'))

    expect(result).toHaveLength(20)
    expect(result[0].id).toBe('new')
    expect(result.at(-1)?.id).toBe('18')
  })
})
