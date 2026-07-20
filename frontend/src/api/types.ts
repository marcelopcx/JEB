export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
}

export interface CartItem {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Cart {
  userId: string
  items: CartItem[]
  total: number
}

export interface AddCartItemRequest {
  productId: number
  quantity: number
}

export type HttpMethod = 'GET' | 'POST' | 'DELETE'
export type HttpOutcome = 'success' | 'http-error' | 'network-error'
export type HttpErrorKind = 'http' | 'network'

export interface HttpExchange {
  id: string
  method: HttpMethod
  path: string
  startedAt: string
  durationMs: number
  requestBody?: unknown
  status: number | null
  responseBody: unknown
  outcome: HttpOutcome
}

export type BackendOperation =
  | 'listProducts'
  | 'getProduct'
  | 'getCart'
  | 'addItem'
  | 'removeItem'
  | 'clearCart'

export interface BackendPathExplanation {
  operation: BackendOperation
  label: 'Ruta explicada del backend'
  steps: string[]
  note: 'Explicación estática, no telemetría en tiempo real.'
}
