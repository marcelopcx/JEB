import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCartApi } from './cartApi'
import type { HttpClient } from './httpClient'

describe('cartApi', () => {
  const request = vi.fn(async () => undefined) as unknown as HttpClient['request']
  const api = createCartApi({ request })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists products', async () => {
    await api.listProducts()
    expect(request).toHaveBeenCalledWith('GET', '/api/products')
  })

  it('gets one product', async () => {
    await api.getProduct(7)
    expect(request).toHaveBeenCalledWith('GET', '/api/products/7')
  })

  it('gets a user cart with an encoded user ID', async () => {
    await api.getCart('demo user')
    expect(request).toHaveBeenCalledWith('GET', '/api/cart/demo%20user')
  })

  it('adds an item with the backend request shape', async () => {
    await api.addItem('demo-eliab', { productId: 1, quantity: 2 })
    expect(request).toHaveBeenCalledWith('POST', '/api/cart/demo-eliab/items', {
      productId: 1,
      quantity: 2,
    })
  })

  it('removes an item', async () => {
    await api.removeItem('demo-eliab', 3)
    expect(request).toHaveBeenCalledWith('DELETE', '/api/cart/demo-eliab/items/3')
  })

  it('clears a cart', async () => {
    await api.clearCart('demo-eliab')
    expect(request).toHaveBeenCalledWith('DELETE', '/api/cart/demo-eliab')
  })
})
