import { describe, expect, it } from 'vitest'
import { explanationFor } from './backendPaths'
import type { HttpMethod } from './types'

describe('explanationFor', () => {
  it.each<[HttpMethod, string, string[]]>([
    ['GET', '/api/products', ['ProductResource', 'ProductService', 'ProductRepository', 'PostgreSQL']],
    ['GET', '/api/products/1', ['ProductResource', 'ProductService', 'ProductRepository', 'PostgreSQL']],
    ['GET', '/api/cart/demo-eliab', ['CartResource', 'CartService', 'CartCache']],
    [
      'POST',
      '/api/cart/demo-eliab/items',
      ['CartResource', 'CartService', 'ProductRepository', 'PostgreSQL', 'CartCache'],
    ],
    [
      'DELETE',
      '/api/cart/demo-eliab/items/1',
      ['CartResource', 'CartService', 'ProductRepository', 'PostgreSQL', 'CartCache'],
    ],
    ['DELETE', '/api/cart/demo-eliab', ['CartResource', 'CartService', 'CartCache']],
  ])('maps %s %s without calling it telemetry', (method, path, steps) => {
    expect(explanationFor(method, path)).toMatchObject({
      label: 'Ruta explicada del backend',
      steps,
      note: 'Explicación estática, no telemetría en tiempo real.',
    })
  })
})
