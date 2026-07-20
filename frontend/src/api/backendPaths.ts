import type {
  BackendOperation,
  BackendPathExplanation,
  HttpMethod,
} from './types'

const explanations: Record<BackendOperation, BackendPathExplanation> = {
  listProducts: {
    operation: 'listProducts',
    label: 'Explained backend path',
    steps: ['ProductResource', 'ProductService', 'ProductRepository', 'PostgreSQL'],
    note: 'Static explanation, not runtime telemetry.',
  },
  getProduct: {
    operation: 'getProduct',
    label: 'Explained backend path',
    steps: ['ProductResource', 'ProductService', 'ProductRepository', 'PostgreSQL'],
    note: 'Static explanation, not runtime telemetry.',
  },
  getCart: {
    operation: 'getCart',
    label: 'Explained backend path',
    steps: ['CartResource', 'CartService', 'CartCache'],
    note: 'Static explanation, not runtime telemetry.',
  },
  addItem: {
    operation: 'addItem',
    label: 'Explained backend path',
    steps: ['CartResource', 'CartService', 'ProductRepository', 'PostgreSQL', 'CartCache'],
    note: 'Static explanation, not runtime telemetry.',
  },
  removeItem: {
    operation: 'removeItem',
    label: 'Explained backend path',
    steps: ['CartResource', 'CartService', 'ProductRepository', 'PostgreSQL', 'CartCache'],
    note: 'Static explanation, not runtime telemetry.',
  },
  clearCart: {
    operation: 'clearCart',
    label: 'Explained backend path',
    steps: ['CartResource', 'CartService', 'CartCache'],
    note: 'Static explanation, not runtime telemetry.',
  },
}

export function explanationFor(
  method: HttpMethod,
  path: string,
): BackendPathExplanation | null {
  if (method === 'GET' && path === '/api/products') return explanations.listProducts
  if (method === 'GET' && /^\/api\/products\/\d+$/.test(path)) return explanations.getProduct
  if (method === 'POST' && /^\/api\/cart\/[^/]+\/items$/.test(path)) return explanations.addItem
  if (method === 'DELETE' && /^\/api\/cart\/[^/]+\/items\/\d+$/.test(path)) {
    return explanations.removeItem
  }
  if (method === 'GET' && /^\/api\/cart\/[^/]+$/.test(path)) return explanations.getCart
  if (method === 'DELETE' && /^\/api\/cart\/[^/]+$/.test(path)) return explanations.clearCart
  return null
}
