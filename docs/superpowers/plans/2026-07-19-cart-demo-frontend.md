# JEB Cart Demo Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-screen React frontend that exercises all six JEB API endpoints and clearly separates captured HTTP evidence from a static explanation of the Jakarta EE backend path.

**Architecture:** A Vite development server hosts the React application and proxies browser requests under `/api` to `http://localhost:8080/JEB-1.0-SNAPSHOT`. A typed HTTP client captures every exchange, `cartApi` owns endpoint construction, and `CartDemo` coordinates independently retained catalog/cart state, action-level loading, errors, and a 20-entry in-memory history. Presentational components never infer backend state, recompute totals, or describe the static backend map as runtime telemetry.

**Tech Stack:** React, TypeScript, Vite 8, browser Fetch API, Vitest 4, jsdom, React Testing Library, PostgreSQL 16, WildFly 40, Jakarta EE backend on JDK 17.

---

## Scope Guardrails

- Create the frontend only under `frontend/`; do not modify Java sources, `pom.xml`, PostgreSQL configuration, Bruno collections, `.idea/`, `.atl/`, or `.codegraph/`.
- Keep checkout, payments, orders, login, authentication, stock enforcement, and partial quantity replacement out of the UI.
- Include `stock` in the `Product` transport type because the backend sends it, but do not display stock or imply that adding to the cart decrements or validates it.
- Treat `Cart.total` and `CartItem.subtotal` as backend-owned values. Render them; never derive them from price and quantity.
- Never update cart contents optimistically. Replace local cart state only after a successful cart response.
- Keep the last valid catalog and cart visible while a refresh/mutation is pending and after a later request fails.
- Keep the request history in memory only, newest first, capped at 20 exchanges.
- Label endpoint-to-Jakarta-EE mappings exactly as `Explained backend path` and state `Static explanation, not runtime telemetry.`

## File Structure

| Path | Change | Responsibility |
| --- | --- | --- |
| `frontend/.gitignore` | Create via Vite | Ignore node modules, build output, and local artifacts |
| `frontend/package.json` | Create via Vite, modify scripts/dependencies | Frontend commands and locked toolchain entry points |
| `frontend/package-lock.json` | Create | Reproducible npm dependency resolution |
| `frontend/index.html` | Create via Vite | Browser document and mount point |
| `frontend/tsconfig.json` | Create via Vite | TypeScript project references |
| `frontend/tsconfig.app.json` | Create via Vite | Browser TypeScript settings |
| `frontend/tsconfig.node.json` | Create via Vite | Vite/Vitest config TypeScript settings |
| `frontend/eslint.config.js` | Create via Vite | Frontend lint configuration |
| `frontend/vite.config.ts` | Create, replace template | React plugin and WildFly development proxy |
| `frontend/vitest.config.ts` | Create | jsdom test environment and setup file |
| `frontend/src/test/setup.ts` | Create | Testing Library DOM matchers |
| `frontend/src/api/types.ts` | Create | Product, cart, HTTP exchange, operation, and error contracts |
| `frontend/src/api/errors.ts` | Create | Normalized HTTP/network error class |
| `frontend/src/api/exchangeHistory.ts` | Create | Newest-first 20-exchange retention rule |
| `frontend/src/api/exchangeHistory.test.ts` | Create | History ordering and cap tests |
| `frontend/src/api/httpClient.ts` | Create | Fetch, timing, body parsing, exchange capture, normalized failures |
| `frontend/src/api/httpClient.test.ts` | Create | JSON success, JSON error, text error, and network failure tests |
| `frontend/src/api/cartApi.ts` | Create | Typed API for all six backend endpoints |
| `frontend/src/api/cartApi.test.ts` | Create | Exact method, path, and body contract tests |
| `frontend/src/api/backendPaths.ts` | Create | Static explanatory map for each operation |
| `frontend/src/api/backendPaths.test.ts` | Create | Dynamic-route matching and explanation-label tests |
| `frontend/src/components/ConnectionStatus.tsx` | Create | Connected/loading/unavailable text status |
| `frontend/src/components/UserSelector.tsx` | Create | Editable, validated active user ID |
| `frontend/src/components/ProductCatalog.tsx` | Create | Catalog, local positive-integer quantity input, inspect/add intents |
| `frontend/src/components/CartPanel.tsx` | Create | Backend cart values, remove intent, and clear intent |
| `frontend/src/components/BackendPath.tsx` | Create | Visibly static endpoint explanation |
| `frontend/src/components/RequestInspector.tsx` | Create | Latest exchange and 20-entry request history |
| `frontend/src/components/Presentation.test.tsx` | Create | Presentational loading, validation, empty/populated, and inspector tests |
| `frontend/src/CartDemo.tsx` | Create | Initial loads, user switching, mutations, retained state, loading, errors, history |
| `frontend/src/CartDemo.test.tsx` | Create | Component-level orchestration and non-optimistic behavior tests |
| `frontend/src/App.tsx` | Replace Vite starter | Application shell |
| `frontend/src/main.tsx` | Replace Vite starter | React root |
| `frontend/src/styles.css` | Create | Responsive technical-dashboard presentation |
| `frontend/src/App.css` | Delete | Remove unused Vite starter styling |
| `frontend/src/index.css` | Delete | Remove unused Vite starter styling |
| `frontend/src/assets/react.svg` | Delete | Remove unused Vite starter asset |
| `frontend/public/vite.svg` | Delete | Remove unused Vite starter asset |
| `frontend/README.md` | Replace Vite starter | Scoped runbook, verification, smoke, and limits |

### Task 1: Scaffold React, Vite, TypeScript, and the test harness

**Files:**
- Create: `frontend/` from the official React TypeScript Vite template
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: Verify the runtime prerequisite without changing the repository**

Run from the repository root:

```bash
node --version
npm --version
```

Expected: Node reports `v20.19.0` or newer, or `v22.12.0` or newer; npm prints a version and exits with status 0. If Node is older, switch the active Node runtime before continuing.

- [ ] **Step 2: Generate the React TypeScript scaffold**

Run:

```bash
npm create vite@8.0.10 frontend -- --template react-ts
```

Expected: create-vite reports that it scaffolded `/home/eliabparra/Dev/JEB/frontend` and prints the `npm install` and `npm run dev` next steps. No backend file changes.

- [ ] **Step 3: Install and lock the scaffold dependencies**

Run:

```bash
npm install --prefix frontend
```

Expected: npm creates `frontend/package-lock.json`, installs the generated React/Vite dependencies, and exits with status 0.

- [ ] **Step 4: Install the test-only dependencies**

Run:

```bash
npm install --prefix frontend --save-dev vitest@4.1.6 jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

Expected: npm updates only `frontend/package.json` and `frontend/package-lock.json`; the command exits with status 0.

- [ ] **Step 5: Add deterministic test scripts**

Run:

```bash
npm pkg set --prefix frontend scripts.test="vitest run" scripts.test:watch="vitest"
```

Expected: `frontend/package.json` contains `"test": "vitest run"` and `"test:watch": "vitest"` while retaining the Vite `dev`, `build`, `lint`, and `preview` scripts.

- [ ] **Step 6: Replace the Vite config with the React plugin and exact WildFly proxy**

Write `frontend/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080/JEB-1.0-SNAPSHOT',
        changeOrigin: true,
      },
    },
  },
})
```

Expected behavior: a browser request to `/api/products` is forwarded to `http://localhost:8080/JEB-1.0-SNAPSHOT/api/products` without a Java CORS change.

- [ ] **Step 7: Configure Vitest and Testing Library**

Write `frontend/vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
})
```

Write `frontend/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 8: Confirm configuration compiles before feature work**

Run:

```bash
npm run build --prefix frontend
```

Expected: TypeScript and Vite finish successfully and create `frontend/dist/`. This is a scaffold/configuration check, not execution of the later feature tests.

- [ ] **Step 9: Commit the scaffold work unit**

```bash
git add frontend
git commit -m "chore(frontend): scaffold React test environment"
```

Expected: one Conventional Commit containing only the standalone frontend scaffold and test configuration. Runtime harness evidence is `npm run build --prefix frontend`; rollback boundary is the new `frontend/` directory.

### Task 2: Define transport contracts and bounded exchange history

**Files:**
- Create: `frontend/src/api/types.ts`
- Create: `frontend/src/api/exchangeHistory.test.ts`
- Create: `frontend/src/api/exchangeHistory.ts`

- [ ] **Step 1: Define the exact frontend/backend contracts**

Write `frontend/src/api/types.ts`:

```ts
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
  label: 'Explained backend path'
  steps: string[]
  note: 'Static explanation, not runtime telemetry.'
}
```

The numeric fields intentionally match the JSON numbers emitted from Java `Long`, `Integer`, and `BigDecimal`. No domain claim is attached to `Product.stock`.

- [ ] **Step 2: Write the failing history tests**

Write `frontend/src/api/exchangeHistory.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the history test to verify RED**

Run:

```bash
npm test --prefix frontend -- src/api/exchangeHistory.test.ts
```

Expected: FAIL because `./exchangeHistory` does not exist.

- [ ] **Step 4: Implement the minimal immutable retention rule**

Write `frontend/src/api/exchangeHistory.ts`:

```ts
import type { HttpExchange } from './types'

const HISTORY_LIMIT = 20

export function prependExchange(
  history: HttpExchange[],
  exchange: HttpExchange,
): HttpExchange[] {
  return [exchange, ...history].slice(0, HISTORY_LIMIT)
}
```

- [ ] **Step 5: Run the focused test to verify GREEN**

Run:

```bash
npm test --prefix frontend -- src/api/exchangeHistory.test.ts
```

Expected: PASS with 2 tests and no warnings.

- [ ] **Step 6: Commit the contract work unit**

```bash
git add frontend/src/api/types.ts frontend/src/api/exchangeHistory.ts frontend/src/api/exchangeHistory.test.ts
git commit -m "feat(frontend): define API exchange contracts"
```

Expected: tests and the history behavior are in the same commit. Runtime harness is N/A because this unit contains transport contracts and a pure function; rollback boundary is the three listed files.

### Task 3: Capture successful, rejected, text, and network HTTP exchanges

**Files:**
- Create: `frontend/src/api/errors.ts`
- Create: `frontend/src/api/httpClient.test.ts`
- Create: `frontend/src/api/httpClient.ts`

- [ ] **Step 1: Write failing tests for the observable HTTP boundary**

Write `frontend/src/api/httpClient.test.ts`:

```ts
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
      message: 'Backend unreachable: Failed to fetch',
    })
    expect(captured[0]).toMatchObject({
      status: null,
      responseBody: 'Failed to fetch',
      outcome: 'network-error',
    })
  })
})
```

- [ ] **Step 2: Run the HTTP client test to verify RED**

Run:

```bash
npm test --prefix frontend -- src/api/httpClient.test.ts
```

Expected: FAIL because `errors.ts` and `httpClient.ts` do not exist.

- [ ] **Step 3: Implement the normalized error type**

Write `frontend/src/api/errors.ts`:

```ts
import type { HttpErrorKind, HttpExchange } from './types'

export class HttpRequestError extends Error {
  readonly kind: HttpErrorKind
  readonly exchange: HttpExchange

  constructor(kind: HttpErrorKind, message: string, exchange: HttpExchange, cause?: unknown) {
    super(message)
    this.name = 'HttpRequestError'
    this.kind = kind
    this.exchange = exchange
    this.cause = cause
  }
}
```

- [ ] **Step 4: Implement the minimal capture-first HTTP client**

Write `frontend/src/api/httpClient.ts`:

```ts
import { HttpRequestError } from './errors'
import type { HttpExchange, HttpMethod } from './types'

export interface HttpClient {
  request<T>(method: HttpMethod, path: string, requestBody?: unknown): Promise<T>
}

interface HttpClientOptions {
  onExchange: (exchange: HttpExchange) => void
  fetchFn?: typeof fetch
  monotonicNow?: () => number
  startedAt?: () => string
  createId?: () => string
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text.length === 0) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function errorMessage(body: unknown, status: number): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error
  }

  if (typeof body === 'string' && body.length > 0) {
    return body
  }

  return `HTTP ${status}`
}

function causeMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const fetchFn = options.fetchFn ?? fetch.bind(globalThis)
  const monotonicNow = options.monotonicNow ?? (() => performance.now())
  const startedAt = options.startedAt ?? (() => new Date().toISOString())
  const createId = options.createId ?? (() => crypto.randomUUID())

  return {
    async request<T>(method: HttpMethod, path: string, requestBody?: unknown): Promise<T> {
      const start = monotonicNow()
      const baseExchange = {
        id: createId(),
        method,
        path,
        startedAt: startedAt(),
        requestBody,
      }

      try {
        const response = await fetchFn(path, {
          method,
          ...(requestBody === undefined
            ? {}
            : {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
              }),
        })
        const responseBody = await parseBody(response)
        const exchange: HttpExchange = {
          ...baseExchange,
          durationMs: Math.round(monotonicNow() - start),
          status: response.status,
          responseBody,
          outcome: response.ok ? 'success' : 'http-error',
        }

        options.onExchange(exchange)

        if (!response.ok) {
          throw new HttpRequestError('http', errorMessage(responseBody, response.status), exchange)
        }

        return responseBody as T
      } catch (cause) {
        if (cause instanceof HttpRequestError) {
          throw cause
        }

        const message = causeMessage(cause)
        const exchange: HttpExchange = {
          ...baseExchange,
          durationMs: Math.round(monotonicNow() - start),
          status: null,
          responseBody: message,
          outcome: 'network-error',
        }

        options.onExchange(exchange)
        throw new HttpRequestError('network', `Backend unreachable: ${message}`, exchange, cause)
      }
    },
  }
}
```

- [ ] **Step 5: Run the focused tests to verify GREEN**

Run:

```bash
npm test --prefix frontend -- src/api/httpClient.test.ts
```

Expected: PASS with 4 tests. The test output has no unhandled rejection or React warning.

- [ ] **Step 6: Commit the HTTP boundary work unit**

```bash
git add frontend/src/api/errors.ts frontend/src/api/httpClient.ts frontend/src/api/httpClient.test.ts
git commit -m "feat(frontend): capture HTTP exchanges"
```

Expected: capture behavior and all four failure/success proofs remain atomic. Runtime harness is N/A because fetch is exercised through deterministic test doubles; rollback boundary is the three listed API files.

### Task 4: Implement all six typed JEB endpoint calls

**Files:**
- Create: `frontend/src/api/cartApi.test.ts`
- Create: `frontend/src/api/cartApi.ts`

- [ ] **Step 1: Write the failing API contract tests**

Write `frontend/src/api/cartApi.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the API tests to verify RED**

Run:

```bash
npm test --prefix frontend -- src/api/cartApi.test.ts
```

Expected: FAIL because `./cartApi` does not exist.

- [ ] **Step 3: Implement the endpoint adapter and browser factory**

Write `frontend/src/api/cartApi.ts`:

```ts
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
```

- [ ] **Step 4: Run the focused tests to verify GREEN**

Run:

```bash
npm test --prefix frontend -- src/api/cartApi.test.ts
```

Expected: PASS with 6 tests, one for each existing endpoint.

- [ ] **Step 5: Commit the endpoint work unit**

```bash
git add frontend/src/api/cartApi.ts frontend/src/api/cartApi.test.ts
git commit -m "feat(frontend): expose typed cart API"
```

Expected: all six API methods and their exact contract tests are one reviewable unit. Runtime harness is deferred to the integrated smoke because this adapter needs WildFly; rollback boundary is these two files.

### Task 5: Map endpoint paths to explicitly static backend explanations

**Files:**
- Create: `frontend/src/api/backendPaths.test.ts`
- Create: `frontend/src/api/backendPaths.ts`

- [ ] **Step 1: Write failing tests for static operation matching**

Write `frontend/src/api/backendPaths.test.ts`:

```ts
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
      label: 'Explained backend path',
      steps,
      note: 'Static explanation, not runtime telemetry.',
    })
  })
})
```

- [ ] **Step 2: Run the mapping test to verify RED**

Run:

```bash
npm test --prefix frontend -- src/api/backendPaths.test.ts
```

Expected: FAIL because `./backendPaths` does not exist.

- [ ] **Step 3: Implement the explicit six-operation map**

Write `frontend/src/api/backendPaths.ts`:

```ts
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
```

- [ ] **Step 4: Run the focused tests to verify GREEN**

Run:

```bash
npm test --prefix frontend -- src/api/backendPaths.test.ts
```

Expected: PASS with 6 cases and no static path described as a trace.

- [ ] **Step 5: Commit the explanatory-map work unit**

```bash
git add frontend/src/api/backendPaths.ts frontend/src/api/backendPaths.test.ts
git commit -m "feat(frontend): explain backend endpoint paths"
```

Expected: static explanations and route matching ship together. Runtime harness is N/A because the map is deliberately explanatory rather than observed server instrumentation; rollback boundary is these two files.

### Task 6: Build the presentational catalog, cart, header controls, and inspector

**Files:**
- Create: `frontend/src/components/Presentation.test.tsx`
- Create: `frontend/src/components/ConnectionStatus.tsx`
- Create: `frontend/src/components/UserSelector.tsx`
- Create: `frontend/src/components/ProductCatalog.tsx`
- Create: `frontend/src/components/CartPanel.tsx`
- Create: `frontend/src/components/BackendPath.tsx`
- Create: `frontend/src/components/RequestInspector.tsx`

- [ ] **Step 1: Write failing user-visible component tests**

Write `frontend/src/components/Presentation.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CartPanel } from './CartPanel'
import { ProductCatalog } from './ProductCatalog'
import { RequestInspector } from './RequestInspector'
import { UserSelector } from './UserSelector'
import type { Cart, HttpExchange, Product } from '../api/types'

const laptop: Product = {
  id: 1,
  name: 'Laptop',
  description: 'Laptop 15 pulgadas 16GB RAM',
  price: 899.99,
  stock: 10,
}

const cart: Cart = {
  userId: 'demo-eliab',
  items: [
    {
      productId: 1,
      productName: 'Laptop',
      unitPrice: 899.99,
      quantity: 2,
      subtotal: 1799.98,
    },
  ],
  total: 1799.98,
}

const latestExchange: HttpExchange = {
  id: 'latest',
  method: 'POST',
  path: '/api/cart/demo-eliab/items',
  startedAt: '2026-07-19T20:00:00.000Z',
  durationMs: 18,
  requestBody: { productId: 1, quantity: 2 },
  status: 200,
  responseBody: cart,
  outcome: 'success',
}

describe('presentation components', () => {
  it('validates a positive integer before emitting an add intent', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(
      <ProductCatalog
        products={[laptop]}
        loading={false}
        error={null}
        pendingActions={new Set()}
        onAdd={onAdd}
        onInspect={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Quantity for Laptop'))
    await user.type(screen.getByLabelText('Quantity for Laptop'), '0')
    await user.click(screen.getByRole('button', { name: 'Add Laptop' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a positive whole number.')
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.queryByText(/stock/i)).not.toBeInTheDocument()
  })

  it('emits the selected quantity and keeps inspect independently available', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onInspect = vi.fn()
    render(
      <ProductCatalog
        products={[laptop]}
        loading={false}
        error={null}
        pendingActions={new Set(['add:1'])}
        onAdd={onAdd}
        onInspect={onInspect}
      />,
    )

    expect(screen.getByRole('button', { name: 'Add Laptop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Inspect Laptop' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Inspect Laptop' }))
    expect(onInspect).toHaveBeenCalledWith(1)
  })

  it('shows an empty cart without inventing totals', () => {
    render(
      <CartPanel
        cart={{ userId: 'new-user', items: [], total: 0 }}
        loading={false}
        error={null}
        pendingActions={new Set()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByText('This cart is empty.')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('renders backend item subtotal and cart total verbatim', () => {
    render(
      <CartPanel
        cart={cart}
        loading={false}
        error={null}
        pendingActions={new Set()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getAllByText('$1,799.98')).toHaveLength(2)
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument()
  })

  it('rejects an empty user ID before emitting a selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<UserSelector activeUserId="demo-eliab" onSelect={onSelect} disabled={false} />)

    await user.clear(screen.getByLabelText('User ID'))
    await user.click(screen.getByRole('button', { name: 'Load cart' }))

    expect(screen.getByRole('alert')).toHaveTextContent('User ID is required.')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('expands the newest exchange and labels the backend path as static', () => {
    render(<RequestInspector history={[latestExchange]} />)

    expect(screen.getByText('Latest HTTP exchange')).toBeInTheDocument()
    expect(screen.getByText('Explained backend path')).toBeInTheDocument()
    expect(screen.getByText('Static explanation, not runtime telemetry.')).toBeInTheDocument()
    expect(screen.getByText(/"quantity": 2/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the presentation tests to verify RED**

Run:

```bash
npm test --prefix frontend -- src/components/Presentation.test.tsx
```

Expected: FAIL because the component modules do not exist.

- [ ] **Step 3: Implement connection and user controls**

Write `frontend/src/components/ConnectionStatus.tsx`:

```tsx
export type ConnectionState = 'connected' | 'loading' | 'unavailable'

interface ConnectionStatusProps {
  state: ConnectionState
}

const labels: Record<ConnectionState, string> = {
  connected: 'Backend connected',
  loading: 'Contacting backend',
  unavailable: 'Backend unavailable',
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  return (
    <span className={`connection-status connection-status--${state}`} role="status">
      {labels[state]}
    </span>
  )
}
```

Write `frontend/src/components/UserSelector.tsx`:

```tsx
import { useState, type FormEvent } from 'react'

interface UserSelectorProps {
  activeUserId: string
  disabled: boolean
  onSelect: (userId: string) => void
}

export function UserSelector({ activeUserId, disabled, onSelect }: UserSelectorProps) {
  const [draft, setDraft] = useState(activeUserId)
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const userId = draft.trim()

    if (userId.length === 0) {
      setError('User ID is required.')
      return
    }

    setError(null)
    onSelect(userId)
  }

  return (
    <form className="user-selector" onSubmit={submit} noValidate>
      <label htmlFor="user-id">User ID</label>
      <div className="user-selector__controls">
        <input
          id="user-id"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-invalid={error !== null}
        />
        <button type="submit" disabled={disabled}>
          Load cart
        </button>
      </div>
      {error && <span role="alert">{error}</span>}
    </form>
  )
}
```

- [ ] **Step 4: Implement the catalog without stock claims**

Write `frontend/src/components/ProductCatalog.tsx`:

```tsx
import { useState } from 'react'
import type { Product } from '../api/types'

interface ProductCatalogProps {
  products: Product[]
  loading: boolean
  error: string | null
  pendingActions: Set<string>
  onAdd: (productId: number, quantity: number) => void
  onInspect: (productId: number) => void
}

export function ProductCatalog({
  products,
  loading,
  error,
  pendingActions,
  onAdd,
  onInspect,
}: ProductCatalogProps) {
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})

  function submitAdd(product: Product) {
    const quantity = Number(quantities[product.id] ?? '1')

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setValidationErrors((current) => ({
        ...current,
        [product.id]: 'Enter a positive whole number.',
      }))
      return
    }

    setValidationErrors((current) => ({ ...current, [product.id]: '' }))
    onAdd(product.id, quantity)
  }

  return (
    <section className="panel" aria-labelledby="catalog-title">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">PostgreSQL-backed</p>
          <h2 id="catalog-title">Product catalog</h2>
        </div>
        {loading && <span role="status">Loading catalog...</span>}
      </div>
      {error && <p role="alert" className="error-message">{error}</p>}
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <p className="product-card__id">Product #{product.id}</p>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <strong>${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            <label htmlFor={`quantity-${product.id}`}>Quantity for {product.name}</label>
            <input
              id={`quantity-${product.id}`}
              type="number"
              min="1"
              step="1"
              value={quantities[product.id] ?? '1'}
              onChange={(event) =>
                setQuantities((current) => ({ ...current, [product.id]: event.target.value }))
              }
            />
            {validationErrors[product.id] && (
              <span role="alert">{validationErrors[product.id]}</span>
            )}
            <div className="button-row">
              <button
                type="button"
                className="button-secondary"
                disabled={pendingActions.has(`inspect:${product.id}`)}
                onClick={() => onInspect(product.id)}
              >
                Inspect {product.name}
              </button>
              <button
                type="button"
                disabled={pendingActions.has(`add:${product.id}`)}
                onClick={() => submitAdd(product)}
              >
                Add {product.name}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Implement the backend-owned cart rendering**

Write `frontend/src/components/CartPanel.tsx`:

```tsx
import type { Cart } from '../api/types'

interface CartPanelProps {
  cart: Cart | null
  loading: boolean
  error: string | null
  pendingActions: Set<string>
  onRemove: (productId: number) => void
  onClear: () => void
}

function money(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CartPanel({
  cart,
  loading,
  error,
  pendingActions,
  onRemove,
  onClear,
}: CartPanelProps) {
  return (
    <section className="panel" aria-labelledby="cart-title">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Local in-memory cache</p>
          <h2 id="cart-title">Cart {cart ? `for ${cart.userId}` : ''}</h2>
        </div>
        {loading && <span role="status">Loading cart...</span>}
      </div>
      {error && <p role="alert" className="error-message">{error}</p>}
      {!cart && !loading && <p>No valid cart has loaded yet.</p>}
      {cart && (
        <>
          {cart.items.length === 0 ? (
            <p className="empty-state">This cart is empty.</p>
          ) : (
            <ul className="cart-list">
              {cart.items.map((item) => (
                <li key={item.productId}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>Quantity: {item.quantity}</span>
                    <span>Unit price: {money(item.unitPrice)}</span>
                  </div>
                  <div className="cart-list__actions">
                    <strong>{money(item.subtotal)}</strong>
                    <button
                      type="button"
                      className="button-danger"
                      disabled={pendingActions.has(`remove:${item.productId}`)}
                      onClick={() => onRemove(item.productId)}
                    >
                      Remove {item.productName}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="cart-total">
            <span>Backend total</span>
            <strong>{money(cart.total)}</strong>
          </div>
          <button
            type="button"
            className="button-danger"
            disabled={pendingActions.has('clear') || cart.items.length === 0}
            onClick={onClear}
          >
            Clear cart
          </button>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 6: Implement the static path and real exchange inspector**

Write `frontend/src/components/BackendPath.tsx`:

```tsx
import { explanationFor } from '../api/backendPaths'
import type { HttpExchange } from '../api/types'

interface BackendPathProps {
  exchange: HttpExchange | null
}

export function BackendPath({ exchange }: BackendPathProps) {
  const explanation = exchange ? explanationFor(exchange.method, exchange.path) : null

  if (!explanation) {
    return <p>No explained path is available for this exchange.</p>
  }

  return (
    <section className="backend-path" aria-labelledby="backend-path-title">
      <h3 id="backend-path-title">{explanation.label}</h3>
      <ol>
        {explanation.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <p>{explanation.note}</p>
    </section>
  )
}
```

Write `frontend/src/components/RequestInspector.tsx`:

```tsx
import type { HttpExchange } from '../api/types'
import { BackendPath } from './BackendPath'

interface RequestInspectorProps {
  history: HttpExchange[]
}

function body(value: unknown): string {
  if (value === undefined) return 'None'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export function RequestInspector({ history }: RequestInspectorProps) {
  const latest = history[0] ?? null

  return (
    <aside className="panel inspector" aria-labelledby="inspector-title">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Observed at the browser boundary</p>
          <h2 id="inspector-title">Latest HTTP exchange</h2>
        </div>
        <span>{history.length}/20 retained</span>
      </div>
      {!latest && <p>Use the catalog or cart to capture a real request.</p>}
      {latest && <BackendPath exchange={latest} />}
      <div className="request-history">
        {history.map((exchange, index) => (
          <details key={exchange.id} open={index === 0}>
            <summary>
              <span>{exchange.method} {exchange.path}</span>
              <span>{exchange.status ?? 'NETWORK'} · {exchange.durationMs} ms</span>
            </summary>
            <dl>
              <dt>Started</dt>
              <dd>{exchange.startedAt}</dd>
              <dt>Outcome</dt>
              <dd>{exchange.outcome}</dd>
              <dt>Request body</dt>
              <dd><pre>{body(exchange.requestBody)}</pre></dd>
              <dt>Response body</dt>
              <dd><pre>{body(exchange.responseBody)}</pre></dd>
            </dl>
          </details>
        ))}
      </div>
    </aside>
  )
}
```

- [ ] **Step 7: Run the presentation tests to verify GREEN**

Run:

```bash
npm test --prefix frontend -- src/components/Presentation.test.tsx
```

Expected: PASS with 6 tests. No test queries or rendered labels mention stock availability, checkout, login, or quantity replacement.

- [ ] **Step 8: Commit the presentational work unit**

```bash
git add frontend/src/components
git commit -m "feat(frontend): add cart demo panels"
```

Expected: reusable view components and their behavior tests remain together. Runtime harness is deferred until `CartDemo` wires real state; rollback boundary is `frontend/src/components/`.

### Task 7: Coordinate retained state, real actions, and action-level loading

**Files:**
- Create: `frontend/src/CartDemo.test.tsx`
- Create: `frontend/src/CartDemo.tsx`

- [ ] **Step 1: Write failing orchestration tests**

Write `frontend/src/CartDemo.test.tsx`:

```tsx
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CartDemo, type CartApiFactory } from './CartDemo'
import type { CartApi } from './api/cartApi'
import type { Cart, Product } from './api/types'

const products: Product[] = [
  { id: 1, name: 'Laptop', description: 'Laptop 15 pulgadas 16GB RAM', price: 899.99, stock: 10 },
]

const initialCart: Cart = {
  userId: 'demo-eliab',
  items: [
    { productId: 1, productName: 'Laptop', unitPrice: 899.99, quantity: 1, subtotal: 899.99 },
  ],
  total: 899.99,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function apiWith(overrides: Partial<CartApi> = {}): CartApi {
  return {
    listProducts: vi.fn().mockResolvedValue(products),
    getProduct: vi.fn().mockResolvedValue(products[0]),
    getCart: vi.fn().mockResolvedValue(initialCart),
    addItem: vi.fn().mockResolvedValue(initialCart),
    removeItem: vi.fn().mockResolvedValue(initialCart),
    clearCart: vi.fn().mockResolvedValue({ userId: 'demo-eliab', items: [], total: 0 }),
    ...overrides,
  }
}

function factory(api: CartApi): CartApiFactory {
  return () => api
}

describe('CartDemo', () => {
  it('loads the catalog and default cart independently', async () => {
    const api = apiWith()
    render(<CartDemo apiFactory={factory(api)} />)

    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0)
    expect(await screen.findByRole('heading', { name: 'Laptop' })).toBeInTheDocument()
    expect(await screen.findByText('Cart for demo-eliab')).toBeInTheDocument()
    expect(api.listProducts).toHaveBeenCalledOnce()
    expect(api.getCart).toHaveBeenCalledWith('demo-eliab')
  })

  it('keeps the last valid cart visible when changing user fails', async () => {
    const user = userEvent.setup()
    const getCart = vi
      .fn<CartApi['getCart']>()
      .mockResolvedValueOnce(initialCart)
      .mockRejectedValueOnce(new Error('Cart request failed'))
    render(<CartDemo apiFactory={factory(apiWith({ getCart }))} />)
    await screen.findByText('Quantity: 1')

    await user.clear(screen.getByLabelText('User ID'))
    await user.type(screen.getByLabelText('User ID'), 'second-user')
    await user.click(screen.getByRole('button', { name: 'Load cart' }))

    expect(await screen.findByText('Cart request failed')).toBeInTheDocument()
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
  })

  it('does not update the cart optimistically and disables only the add action', async () => {
    const user = userEvent.setup()
    const pendingAdd = deferred<Cart>()
    const addItem = vi.fn<CartApi['addItem']>().mockReturnValue(pendingAdd.promise)
    render(<CartDemo apiFactory={factory(apiWith({ addItem }))} />)
    await screen.findByText('Quantity: 1')

    await user.click(screen.getByRole('button', { name: 'Add Laptop' }))

    expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Laptop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Inspect Laptop' })).toBeEnabled()

    await act(async () => {
      pendingAdd.resolve({
        ...initialCart,
        items: [{ ...initialCart.items[0], quantity: 3, subtotal: 2699.97 }],
        total: 2699.97,
      })
    })

    expect(await screen.findByText('Quantity: 3')).toBeInTheDocument()
  })

  it('uses product-by-ID inspection without changing catalog or cart state', async () => {
    const user = userEvent.setup()
    const getProduct = vi.fn<CartApi['getProduct']>().mockResolvedValue(products[0])
    render(<CartDemo apiFactory={factory(apiWith({ getProduct }))} />)
    await screen.findByText('Quantity: 1')

    await user.click(screen.getByRole('button', { name: 'Inspect Laptop' }))

    await waitFor(() => expect(getProduct).toHaveBeenCalledWith(1))
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
  })

  it('replaces cart state with the remove response', async () => {
    const user = userEvent.setup()
    const emptyCart = { userId: 'demo-eliab', items: [], total: 0 }
    const removeItem = vi.fn<CartApi['removeItem']>().mockResolvedValue(emptyCart)
    render(<CartDemo apiFactory={factory(apiWith({ removeItem }))} />)
    await screen.findByText('Quantity: 1')

    await user.click(screen.getByRole('button', { name: 'Remove Laptop' }))
    expect(await screen.findByText('This cart is empty.')).toBeInTheDocument()
    expect(removeItem).toHaveBeenCalledWith('demo-eliab', 1)
  })

  it('replaces cart state with the clear response', async () => {
    const user = userEvent.setup()
    const emptyCart = { userId: 'demo-eliab', items: [], total: 0 }
    const clearCart = vi.fn<CartApi['clearCart']>().mockResolvedValue(emptyCart)
    render(<CartDemo apiFactory={factory(apiWith({ clearCart }))} />)
    await screen.findByText('Quantity: 1')

    await user.click(screen.getByRole('button', { name: 'Clear cart' }))
    expect(await screen.findByText('This cart is empty.')).toBeInTheDocument()
    expect(clearCart).toHaveBeenCalledWith('demo-eliab')
  })

  it('keeps loaded catalog data visible after a later catalog-independent error', async () => {
    const api = apiWith({ getProduct: vi.fn().mockRejectedValue(new Error('Inspect failed')) })
    const user = userEvent.setup()
    render(<CartDemo apiFactory={factory(api)} />)
    await screen.findByRole('heading', { name: 'Laptop' })

    await user.click(screen.getByRole('button', { name: 'Inspect Laptop' }))

    expect(await screen.findByText('Inspect failed')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Laptop' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the orchestration tests to verify RED**

Run:

```bash
npm test --prefix frontend -- src/CartDemo.test.tsx
```

Expected: FAIL because `CartDemo.tsx` does not exist.

- [ ] **Step 3: Implement the coordinator with no optimistic updates**

Write `frontend/src/CartDemo.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { createBrowserCartApi, type CartApi } from './api/cartApi'
import { HttpRequestError } from './api/errors'
import { prependExchange } from './api/exchangeHistory'
import type { Cart, HttpExchange, Product } from './api/types'
import { CartPanel } from './components/CartPanel'
import { ConnectionStatus, type ConnectionState } from './components/ConnectionStatus'
import { ProductCatalog } from './components/ProductCatalog'
import { RequestInspector } from './components/RequestInspector'
import { UserSelector } from './components/UserSelector'

const DEFAULT_USER_ID = 'demo-eliab'

export type CartApiFactory = (onExchange: (exchange: HttpExchange) => void) => CartApi

interface CartDemoProps {
  apiFactory?: CartApiFactory
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function withoutAction(actions: Set<string>, action: string): Set<string> {
  const next = new Set(actions)
  next.delete(action)
  return next
}

function connectionAfter(error: unknown): ConnectionState {
  return error instanceof HttpRequestError && error.kind === 'network'
    ? 'unavailable'
    : 'connected'
}

export function CartDemo({ apiFactory = createBrowserCartApi }: CartDemoProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [activeUserId, setActiveUserId] = useState(DEFAULT_USER_ID)
  const [history, setHistory] = useState<HttpExchange[]>([])
  const [pendingActions, setPendingActions] = useState<Set<string>>(
    () => new Set(['catalog', 'cart']),
  )
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [cartError, setCartError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('loading')

  function capture(exchange: HttpExchange) {
    setHistory((current) => prependExchange(current, exchange))
    setConnection(exchange.outcome === 'network-error' ? 'unavailable' : 'connected')
  }

  const [api] = useState(() => apiFactory(capture))

  useEffect(() => {
    let active = true

    api.listProducts()
      .then((response) => {
        if (!active) return
        setProducts(response)
        setCatalogError(null)
        setConnection('connected')
      })
      .catch((error: unknown) => {
        if (!active) return
        setCatalogError(messageFrom(error))
        setConnection(connectionAfter(error))
      })
      .finally(() => {
        if (active) setPendingActions((current) => withoutAction(current, 'catalog'))
      })

    api.getCart(DEFAULT_USER_ID)
      .then((response) => {
        if (!active) return
        setCart(response)
        setCartError(null)
        setConnection('connected')
      })
      .catch((error: unknown) => {
        if (!active) return
        setCartError(messageFrom(error))
        setConnection(connectionAfter(error))
      })
      .finally(() => {
        if (active) setPendingActions((current) => withoutAction(current, 'cart'))
      })

    return () => {
      active = false
    }
  }, [api])

  async function perform<T>(
    action: string,
    request: () => Promise<T>,
    accept: (value: T) => void,
    reject: (message: string) => void = setActionError,
  ) {
    setPendingActions((current) => new Set(current).add(action))
    setActionError(null)

    try {
      const response = await request()
      accept(response)
      setConnection('connected')
    } catch (error) {
      reject(messageFrom(error))
      setConnection(connectionAfter(error))
    } finally {
      setPendingActions((current) => withoutAction(current, action))
    }
  }

  function selectUser(userId: string) {
    setActiveUserId(userId)
    setCartError(null)
    void perform('cart', () => api.getCart(userId), setCart, setCartError)
  }

  function addItem(productId: number, quantity: number) {
    void perform(
      `add:${productId}`,
      () => api.addItem(activeUserId, { productId, quantity }),
      setCart,
    )
  }

  function inspectProduct(productId: number) {
    void perform(`inspect:${productId}`, () => api.getProduct(productId), () => undefined)
  }

  function removeItem(productId: number) {
    void perform(`remove:${productId}`, () => api.removeItem(activeUserId, productId), setCart)
  }

  function clearCart() {
    void perform('clear', () => api.clearCart(activeUserId), setCart)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">JEB · Jakarta EE classroom demo</p>
          <h1>Transparent cart operations</h1>
          <p>Real API evidence with explicitly static backend explanations.</p>
        </div>
        <div className="header-controls">
          <ConnectionStatus state={pendingActions.size > 0 ? 'loading' : connection} />
          <UserSelector
            activeUserId={activeUserId}
            disabled={pendingActions.has('cart')}
            onSelect={selectUser}
          />
        </div>
      </header>

      {actionError && <p role="alert" className="error-message app-error">{actionError}</p>}

      <div className="workspace">
        <div className="commerce-column">
          <ProductCatalog
            products={products}
            loading={pendingActions.has('catalog')}
            error={catalogError}
            pendingActions={pendingActions}
            onAdd={addItem}
            onInspect={inspectProduct}
          />
          <CartPanel
            cart={cart}
            loading={pendingActions.has('cart')}
            error={cartError}
            pendingActions={pendingActions}
            onRemove={removeItem}
            onClear={clearCart}
          />
        </div>
        <RequestInspector history={history} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run the orchestration tests to verify GREEN**

Run:

```bash
npm test --prefix frontend -- src/CartDemo.test.tsx
```

Expected: PASS with 7 tests. In particular, the pending add test observes the old quantity until the backend promise resolves, and the failed user switch leaves the prior cart visible.

- [ ] **Step 5: Run all focused frontend tests before committing**

Run:

```bash
npm test --prefix frontend
```

Expected: PASS for the history, HTTP client, endpoint adapter, backend path, presentation, and orchestration suites with no warnings.

- [ ] **Step 6: Commit the coordinated application behavior**

```bash
git add frontend/src/CartDemo.tsx frontend/src/CartDemo.test.tsx
git commit -m "feat(frontend): coordinate transparent cart demo"
```

Expected: state coordination and its behavioral tests are one work unit. Runtime harness is deferred to the real-stack smoke; rollback boundary is the two `CartDemo` files.

### Task 8: Apply the responsive technical-dashboard shell

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/styles.css`
- Delete: `frontend/src/App.css`
- Delete: `frontend/src/index.css`
- Delete: `frontend/src/assets/react.svg`
- Delete: `frontend/public/vite.svg`

- [ ] **Step 1: Replace the generated app and entry point**

Write `frontend/src/App.tsx`:

```tsx
import { CartDemo } from './CartDemo'

export default function App() {
  return <CartDemo />
}
```

Write `frontend/src/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App />)
```

- [ ] **Step 2: Add the complete responsive styling**

Write `frontend/src/styles.css`:

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172033;
  background: #edf1f5;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; min-height: 100vh; }
button, input { font: inherit; }
button {
  border: 0;
  border-radius: 0.45rem;
  padding: 0.65rem 0.9rem;
  color: #fff;
  background: #2457d6;
  cursor: pointer;
}
button:disabled { cursor: not-allowed; opacity: 0.5; }
button:focus-visible, input:focus-visible, summary:focus-visible {
  outline: 3px solid #f4b942;
  outline-offset: 2px;
}
input {
  width: 100%;
  border: 1px solid #a8b2c3;
  border-radius: 0.45rem;
  padding: 0.6rem 0.7rem;
  background: #fff;
}
h1, h2, h3, p { margin-top: 0; }
.app-shell { max-width: 1600px; margin: 0 auto; padding: 1.25rem; }
.app-header {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.35rem;
  color: #f8fafc;
  background: #172033;
  border-top: 4px solid #4f7cff;
  box-shadow: 0 10px 30px rgb(23 32 51 / 14%);
}
.app-header h1 { margin-bottom: 0.35rem; font-size: clamp(1.7rem, 4vw, 2.6rem); }
.app-header p { margin-bottom: 0; color: #c9d3e4; }
.header-controls { display: grid; align-content: start; gap: 0.8rem; min-width: min(100%, 22rem); }
.connection-status { width: fit-content; padding: 0.3rem 0.65rem; border-radius: 999px; font-weight: 700; }
.connection-status--connected { color: #072e1d; background: #7ee2ae; }
.connection-status--loading { color: #3b2a00; background: #f4d47c; }
.connection-status--unavailable { color: #fff; background: #b42318; }
.user-selector label { display: block; margin-bottom: 0.3rem; font-weight: 700; }
.user-selector__controls { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
.user-selector [role="alert"] { display: block; margin-top: 0.35rem; color: #ffd2cf; }
.workspace { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(22rem, 0.75fr); gap: 1rem; margin-top: 1rem; align-items: start; }
.commerce-column { display: grid; gap: 1rem; min-width: 0; }
.panel { padding: 1rem; background: #fff; border: 1px solid #d6dce5; box-shadow: 0 5px 18px rgb(23 32 51 / 8%); }
.panel__heading { display: flex; justify-content: space-between; align-items: start; gap: 1rem; margin-bottom: 1rem; }
.panel__heading h2 { margin-bottom: 0; }
.eyebrow { margin-bottom: 0.25rem; color: #3156a6; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0.8rem; }
.product-card { display: grid; gap: 0.6rem; padding: 0.9rem; border: 1px solid #d6dce5; background: #fafbfd; }
.product-card h3, .product-card p { margin-bottom: 0; }
.product-card__id { color: #667085; font: 0.8rem ui-monospace, SFMono-Regular, Menlo, monospace; }
.button-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.button-secondary { color: #173b88; background: #e5ecff; }
.button-danger { background: #9d2b24; }
.cart-list { display: grid; gap: 0.65rem; padding: 0; list-style: none; }
.cart-list li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.8rem; border: 1px solid #d6dce5; }
.cart-list li span { display: block; margin-top: 0.2rem; color: #566176; }
.cart-list__actions { display: grid; justify-items: end; gap: 0.5rem; }
.cart-total { display: flex; justify-content: space-between; margin: 1rem 0; padding-top: 1rem; border-top: 2px solid #172033; font-size: 1.15rem; }
.empty-state { padding: 1rem; border: 1px dashed #98a2b3; color: #566176; }
.error-message { padding: 0.75rem; color: #7a271a; background: #fee4e2; border-left: 4px solid #b42318; }
.app-error { margin: 1rem 0 0; }
.inspector { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow: auto; }
.backend-path { padding: 0.8rem; background: #eef3ff; border-left: 4px solid #4f7cff; }
.backend-path ol { display: flex; flex-wrap: wrap; gap: 0.45rem; padding: 0; list-style: none; }
.backend-path li { padding: 0.3rem 0.5rem; background: #fff; border: 1px solid #aebfe8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.backend-path li:not(:last-child)::after { content: " →"; margin-left: 0.45rem; color: #3156a6; }
.backend-path p { margin-bottom: 0; font-weight: 700; }
.request-history { display: grid; gap: 0.6rem; margin-top: 0.8rem; }
.request-history details { border: 1px solid #d6dce5; background: #fafbfd; }
.request-history summary { display: flex; justify-content: space-between; gap: 0.8rem; padding: 0.7rem; cursor: pointer; font: 0.84rem ui-monospace, SFMono-Regular, Menlo, monospace; }
.request-history dl { margin: 0; padding: 0.7rem; border-top: 1px solid #d6dce5; }
.request-history dt { margin-top: 0.6rem; font-weight: 800; }
.request-history dd { margin-left: 0; }
.request-history pre { overflow-x: auto; margin: 0.3rem 0 0; padding: 0.65rem; color: #e6edf7; background: #111827; font: 0.78rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-word; }

@media (max-width: 960px) {
  .app-header { flex-direction: column; }
  .workspace { grid-template-columns: 1fr; }
  .inspector { position: static; max-height: none; }
}

@media (max-width: 560px) {
  .app-shell { padding: 0.6rem; }
  .app-header, .panel { padding: 0.85rem; }
  .user-selector__controls { grid-template-columns: 1fr; }
  .cart-list li, .panel__heading, .request-history summary { flex-direction: column; }
  .cart-list__actions { justify-items: start; }
}
```

- [ ] **Step 3: Remove generated starter-only files**

Run:

```bash
rm frontend/src/App.css frontend/src/index.css frontend/src/assets/react.svg frontend/public/vite.svg
```

Expected: only the four unused Vite starter files are removed. `frontend/src/styles.css` is the sole application stylesheet.

- [ ] **Step 4: Verify components and production build**

Run:

```bash
npm test --prefix frontend
npm run build --prefix frontend
```

Expected: all frontend tests PASS; TypeScript and Vite create `frontend/dist/` with no error. At widths below 960 px the inspector moves below the catalog/cart, and below 560 px controls stack vertically.

- [ ] **Step 5: Commit the visual shell work unit**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx frontend/src/styles.css frontend/src/App.css frontend/src/index.css frontend/src/assets/react.svg frontend/public/vite.svg
git commit -m "feat(frontend): style responsive demo workspace"
```

Expected: the application entry point, responsive shell, and starter cleanup are one visual work unit. Runtime harness is the production build plus a responsive browser check; rollback boundary is the listed shell/style files.

### Task 9: Document frontend operation and its truthful limits

**Files:**
- Modify: `frontend/README.md`

- [ ] **Step 1: Write the scoped frontend runbook**

Write `frontend/README.md`:

```markdown
# JEB cart demo frontend

React/Vite classroom interface for the existing JEB Jakarta EE API. It displays real browser-visible HTTP exchanges and a separately labelled static explanation of each backend path.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- JDK 17 at `/usr/lib/jvm/java-17-openjdk`
- Docker with Compose
- Ports 5173, 5433, and 8080 available

## Start

From the repository root, start PostgreSQL and build the WAR:

```bash
docker compose up -d --wait
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH="$JAVA_HOME/bin:$PATH"
./mvnw clean package
```

Start WildFly:

```bash
docker run -d --rm --name jeb-wildfly --network host \
  -v "$PWD/target/JEB-1.0-SNAPSHOT.war:/opt/jboss/wildfly/standalone/deployments/JEB-1.0-SNAPSHOT.war:ro" \
  quay.io/wildfly/wildfly:40.0.1.Final
```

Start the frontend:

```bash
npm install --prefix frontend
npm run dev --prefix frontend -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Vite forwards `/api` to `http://localhost:8080/JEB-1.0-SNAPSHOT/api`.

## Verify

```bash
npm test --prefix frontend
npm run build --prefix frontend
```

Both commands must exit with status 0 before the presentation.

## Stop

Stop the frontend with `Ctrl+C`, then run:

```bash
docker stop jeb-wildfly
docker compose down
```

`docker compose down` keeps the named PostgreSQL volume. Add `--volumes` only when intentionally discarding local database data.

## Demonstration limits

- The UI has no checkout, payment, order, login, or authentication flow.
- User IDs are cache keys, not authenticated accounts.
- Carts are local WildFly-process memory and disappear when that process stops.
- Product stock is transport data only; this backend does not enforce or decrement stock during cart operations.
- Adding the same product accumulates quantity. There is no endpoint for replacing part of an item's quantity.
- `Explained backend path` is static documentation, not server telemetry.
```

- [ ] **Step 2: Verify every documented command points at the scoped frontend or existing backend**

Run:

```bash
git diff --check -- frontend/README.md
```

Expected: no output and exit status 0.

- [ ] **Step 3: Commit the runbook with the user-visible frontend**

```bash
git add frontend/README.md
git commit -m "docs(frontend): add demo runbook"
```

Expected: the operational documentation is independently reversible and does not modify the root backend README. Runtime harness is N/A for documentation; its exact commands are exercised in Task 11.

### Task 10: Run automated frontend verification

**Files:**
- Verify only: `frontend/`

- [ ] **Step 1: Run the full unit/component suite once**

Run:

```bash
npm test --prefix frontend
```

Expected: every suite passes, including 2 exchange-history tests, 4 HTTP-client tests, 6 API tests, 6 backend-path cases, 6 presentation tests, and 7 `CartDemo` tests. Vitest exits with status 0 and prints no unhandled error.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint --prefix frontend
```

Expected: ESLint exits with status 0 and reports no errors.

- [ ] **Step 3: Run the production TypeScript/Vite build**

Run:

```bash
npm run build --prefix frontend
```

Expected: TypeScript compilation and `vite build` succeed; `frontend/dist/index.html` and hashed assets are emitted.

- [ ] **Step 4: Check frontend whitespace and conflict markers**

Run:

```bash
git diff --check -- frontend
```

Expected: no output and exit status 0.

- [ ] **Step 5: Record verification without creating an empty commit**

Run:

```bash
git status --short -- frontend
```

Expected: no uncommitted frontend changes after Tasks 1-9. Do not create a commit if verification changed no tracked file.

### Task 11: Execute the real PostgreSQL, WildFly, Vite integrated smoke

**Files:**
- Verify only: existing backend plus `frontend/`

- [ ] **Step 1: Confirm the three service ports are available**

Run from the repository root:

```bash
ss -ltn '( sport = :5173 or sport = :5433 or sport = :8080 )'
```

Expected: no listening socket is shown. If a listed service belongs to this repository, stop it cleanly before continuing.

- [ ] **Step 2: Start real PostgreSQL and wait for health**

Run:

```bash
docker compose up -d --wait
docker compose ps
```

Expected: `jeb-postgres` reports `Up` and `healthy`, with host port `5433` mapped to container port `5432`.

- [ ] **Step 3: Build the backend WAR with the required JDK**

Run:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH="$JAVA_HOME/bin:$PATH"
java -version
./mvnw clean package
```

Expected: `java -version` reports Java 17 and Maven ends with `BUILD SUCCESS`, producing `target/JEB-1.0-SNAPSHOT.war`.

- [ ] **Step 4: Start WildFly 40 against host PostgreSQL**

Run:

```bash
docker run -d --rm --name jeb-wildfly --network host \
  -v "$PWD/target/JEB-1.0-SNAPSHOT.war:/opt/jboss/wildfly/standalone/deployments/JEB-1.0-SNAPSHOT.war:ro" \
  quay.io/wildfly/wildfly:40.0.1.Final
timeout 90 bash -c 'until curl -fsS http://localhost:8080/JEB-1.0-SNAPSHOT/api/products >/dev/null; do sleep 2; done'
curl -fsS http://localhost:8080/JEB-1.0-SNAPSHOT/api/products
```

Expected: the readiness loop exits with status 0 and curl returns a JSON array containing exactly five seeded products, including product 1 named `Laptop` at price `899.99`.

- [ ] **Step 5: Start Vite in a dedicated terminal**

Run in terminal B from the repository root:

```bash
npm run dev --prefix frontend -- --host 127.0.0.1
```

Expected: Vite prints a local URL at `http://127.0.0.1:5173/` and remains running.

- [ ] **Step 6: Prove the proxy reaches the deployed WAR**

Run in terminal A:

```bash
curl -fsS http://127.0.0.1:5173/api/products
```

Expected: the same five-product JSON array is returned through Vite. Browser CORS configuration is not required.

- [ ] **Step 7: Exercise the successful browser presentation sequence**

Open `http://127.0.0.1:5173` and perform these exact actions:

1. Confirm five catalog cards appear and both initial `GET /api/products` and `GET /api/cart/demo-eliab` exchanges are retained.
2. Enter a fresh user ID such as `smoke-20260719-1`, click `Load cart`, and confirm `This cart is empty.`
3. Set Laptop quantity to `2`, click `Add Laptop`, and confirm quantity `2`, subtotal `$1,799.98`, and backend total `$1,799.98`.
4. Set Laptop quantity to `1`, click `Add Laptop` again, and confirm the backend accumulates quantity to `3` and total `$2,699.97`; no quantity replacement control appears.
5. Click `Inspect Laptop` and confirm the newest exchange is `GET /api/products/1` with returned JSON.
6. Switch to `smoke-20260719-2`; confirm a separate empty cart while the catalog stays visible.
7. Switch back to `smoke-20260719-1`; confirm quantity `3` remains while WildFly is running.
8. Click `Remove Laptop`, confirm the returned empty cart replaces local state, then add once and click `Clear cart` to exercise both DELETE endpoints.
9. Confirm the newest history entry is expanded, method/path/status/duration/request/response are visible, only the newest 20 entries remain, and `Explained backend path` includes `Static explanation, not runtime telemetry.`

Expected: all six endpoints appear in captured history after the sequence; cart state changes only after successful responses.

- [ ] **Step 8: Verify client quantity validation does not send a request**

Set Laptop quantity to `0` and click `Add Laptop`.

Expected: `Enter a positive whole number.` appears, the add callback is not sent, and the history count does not increase.

- [ ] **Step 9: Trigger and display a real backend product-not-found response**

Keep the browser catalog loaded, then run in terminal A:

```bash
docker exec jeb-postgres psql -U jeb -d jeb -c "DELETE FROM products WHERE id = 1;"
```

Expected: PostgreSQL reports `DELETE 1`.

In the still-open browser, click `Inspect Laptop`.

Expected: the frontend keeps the existing catalog/cart visible, shows `Producto no encontrado: 1`, and records a `404` JSON exchange with `outcome` equal to `http-error`. This runtime deletion is smoke data only; the next WildFly deployment recreates and reseeds the schema.

- [ ] **Step 10: Verify the backend's real quantity error shape through the Vite integration boundary**

Run:

```bash
curl -i -X POST http://127.0.0.1:5173/api/cart/smoke-20260719-1/items \
  -H 'Content-Type: application/json' \
  -d '{"productId":2,"quantity":0}'
```

Expected: HTTP `400` with JSON `{"error":"La cantidad debe ser mayor a 0"}`. The UI intentionally prevents this invalid request; the HTTP-client unit test proves that this JSON error shape is normalized when a frontend action receives it.

- [ ] **Step 11: Verify unavailable status and last-valid-state retention**

Run in terminal A:

```bash
docker stop jeb-wildfly
```

Expected: Docker prints `jeb-wildfly`; because `--rm` was used, the stopped container is removed.

In the browser, click `Inspect Mouse`.

Expected: the header changes to `Backend unavailable`, the error begins with `Backend unreachable:`, a network exchange has `status` `NETWORK`, and the last valid catalog and cart remain visible.

- [ ] **Step 12: Stop Vite and PostgreSQL cleanly**

In terminal B press `Ctrl+C`, then run in terminal A:

```bash
docker compose down
docker compose ps
```

Expected: the Vite process exits; Compose stops/removes the PostgreSQL container and network; `docker compose ps` shows no running service. The named `jeb_pgdata` volume remains because `--volumes` was not used.

- [ ] **Step 13: Confirm smoke work did not modify backend files**

Run:

```bash
git status --short
```

Expected: no smoke-generated backend source/config changes. Do not stage, revert, or remove pre-existing `.idea/misc.xml`, `.atl/`, or `.codegraph/` changes.

## Design Coverage Matrix

| Approved requirement | Implementation task |
| --- | --- |
| React + Vite + TypeScript under `frontend/` only | Task 1 |
| Vitest + Testing Library | Tasks 1, 2, 3, 4, 5, 6, 7, 10 |
| Product, Cart, CartItem, exchange, and error types | Tasks 2 and 3 |
| Method/path/duration/request/response capture | Task 3 |
| JSON, text, HTTP, and unreachable-backend failures | Task 3 |
| Six endpoints, including `GET /products/{id}` | Task 4 |
| Static backend path clearly separated from telemetry | Tasks 5 and 6 |
| Header/status/user ID, catalog, cart, inspector/history | Tasks 6, 7, and 8 |
| Newest-first 20-entry browser-session history | Tasks 2, 6, and 7 |
| No optimistic updates and action-only disabling | Tasks 6 and 7 |
| Preserve last valid catalog/cart after failure | Task 7 |
| Proxy to the WildFly context path | Tasks 1 and 11 |
| Unit/component tests and production build | Tasks 2-10 |
| Real PostgreSQL + WildFly smoke and shutdown | Task 11 |
| Scoped operational README | Task 9 |
| No checkout/login/stock claims/partial update | Scope Guardrails, Tasks 6, 9, and 11 |

## Final Implementation Review

Before presenting or opening a pull request, verify all of these statements against the implementation rather than memory:

- [ ] `git diff --name-only` contains no backend changes caused by frontend implementation.
- [ ] Search results for `checkout`, `login`, `authenticate`, and `update quantity` contain no claimed capability in rendered UI copy.
- [ ] `stock` appears only in the transport contract/test fixture and is not rendered.
- [ ] Every `Cart` assignment follows a successful API response; no click handler mutates item quantity or total locally.
- [ ] All six `cartApi` methods use the same names and types declared in Task 4.
- [ ] Every `HttpExchange` producer supplies the fields declared in Task 2.
- [ ] Every dynamic backend route matches the static explanation map, whose label and note remain exact.
- [ ] `npm test --prefix frontend`, `npm run lint --prefix frontend`, `npm run build --prefix frontend`, and `git diff --check -- frontend` all exit with status 0.
- [ ] The real-stack smoke passes and PostgreSQL, WildFly, and Vite are stopped afterward.
