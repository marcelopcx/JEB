import type {
  BackendOperation,
  BackendPathExplanation,
  HttpMethod,
} from './types'

const explanations: Record<BackendOperation, BackendPathExplanation> = {
  listProducts: {
    operation: 'listProducts',
    label: 'Ruta explicada del backend',
    steps: ['ProductResource', 'ProductService', 'ProductRepository', 'PostgreSQL'],
    note: 'Explicación estática, no telemetría en tiempo real.',
  },
  getProduct: {
    operation: 'getProduct',
    label: 'Ruta explicada del backend',
    steps: ['ProductResource', 'ProductService', 'ProductRepository', 'PostgreSQL'],
    note: 'Explicación estática, no telemetría en tiempo real.',
  },
  getCart: {
    operation: 'getCart',
    label: 'Ruta explicada del backend',
    steps: ['CartResource', 'CartService', 'CartCache'],
    note: 'Explicación estática, no telemetría en tiempo real.',
  },
  addItem: {
    operation: 'addItem',
    label: 'Ruta explicada del backend',
    steps: ['CartResource', 'CartService', 'ProductRepository', 'PostgreSQL', 'CartCache'],
    note: 'Explicación estática, no telemetría en tiempo real.',
  },
  removeItem: {
    operation: 'removeItem',
    label: 'Ruta explicada del backend',
    steps: ['CartResource', 'CartService', 'ProductRepository', 'PostgreSQL', 'CartCache'],
    note: 'Explicación estática, no telemetría en tiempo real.',
  },
  clearCart: {
    operation: 'clearCart',
    label: 'Ruta explicada del backend',
    steps: ['CartResource', 'CartService', 'CartCache'],
    note: 'Explicación estática, no telemetría en tiempo real.',
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
