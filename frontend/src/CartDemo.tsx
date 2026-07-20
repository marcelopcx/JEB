import { useEffect, useRef, useState } from 'react'
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
  const activeUserRef = useRef(DEFAULT_USER_ID)
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve())
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
        if (!active || activeUserRef.current !== DEFAULT_USER_ID) return
        setCart(response)
        setCartError(null)
        setConnection('connected')
      })
      .catch((error: unknown) => {
        if (!active || activeUserRef.current !== DEFAULT_USER_ID) return
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
    activeUserRef.current = userId
    setActiveUserId(userId)
    setCartError(null)
    void perform(
      'cart',
      () => api.getCart(userId),
      (response) => {
        if (activeUserRef.current === userId) setCart(response)
      },
      (message) => {
        if (activeUserRef.current === userId) setCartError(message)
      },
    )
  }

  function enqueueCartMutation(
    action: string,
    request: (userId: string) => Promise<Cart>,
  ) {
    const userId = activeUserRef.current
    setPendingActions((current) => new Set(current).add(action))
    setActionError(null)

    const run = async () => {
      try {
        const response = await request(userId)
        if (activeUserRef.current === userId) {
          setCart(response)
          setConnection('connected')
        }
      } catch (error) {
        if (activeUserRef.current === userId) {
          setActionError(messageFrom(error))
          setConnection(connectionAfter(error))
        }
      } finally {
        setPendingActions((current) => withoutAction(current, action))
      }
    }

    mutationQueueRef.current = mutationQueueRef.current.then(run, run)
  }

  function addItem(productId: number, quantity: number) {
    enqueueCartMutation(
      `add:${productId}`,
      (userId) => api.addItem(userId, { productId, quantity }),
    )
  }

  function inspectProduct(productId: number) {
    void perform(`inspect:${productId}`, () => api.getProduct(productId), () => undefined)
  }

  function removeItem(productId: number) {
    enqueueCartMutation(
      `remove:${productId}`,
      (userId) => api.removeItem(userId, productId),
    )
  }

  function clearCart() {
    enqueueCartMutation('clear', (userId) => api.clearCart(userId))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">JEB · Demostración académica con Jakarta EE</p>
          <h1>Operaciones transparentes del carrito</h1>
          <p>Evidencia real de la API con explicaciones estáticas explícitas del backend.</p>
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
