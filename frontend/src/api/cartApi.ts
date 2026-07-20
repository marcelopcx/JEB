import { createHttpClient, type HttpClient } from './httpClient'
import type { AddCartItemRequest, Cart, HttpExchange, Product } from './types'

export interface CartApi {
  listProducts(): Promise<Product[]>
  getProduct(productId: number): Promise<Product>
  getCart(userId: string): Promise<Cart>
  addItem(userId: string, request: AddCartItemRequest): Promise<Cart>
  removeItem(userId: string, productId: number): Promise<Cart>
  clearCart(userId: string): Promise<Cart>
}

export function createCartApi(client: HttpClient): CartApi {
  return {
    listProducts: () => client.request<Product[]>('GET', '/api/products'),
    getProduct: (productId) => client.request<Product>('GET', `/api/products/${productId}`),
    getCart: (userId) => client.request<Cart>('GET', `/api/cart/${encodeURIComponent(userId)}`),
    addItem: (userId, request) =>
      client.request<Cart>('POST', `/api/cart/${encodeURIComponent(userId)}/items`, request),
    removeItem: (userId, productId) =>
      client.request<Cart>(
        'DELETE',
        `/api/cart/${encodeURIComponent(userId)}/items/${productId}`,
      ),
    clearCart: (userId) =>
      client.request<Cart>('DELETE', `/api/cart/${encodeURIComponent(userId)}`),
  }
}

export function createBrowserCartApi(onExchange: (exchange: HttpExchange) => void): CartApi {
  return createCartApi(createHttpClient({ onExchange }))
}
