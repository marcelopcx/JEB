import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CartPanel } from './CartPanel'
import { ConnectionStatus, type ConnectionState } from './ConnectionStatus'
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
  it.each<[ConnectionState, string]>([
    ['connected', 'Backend connected'],
    ['loading', 'Contacting backend'],
    ['unavailable', 'Backend unavailable'],
  ])('renders the %s connection state', (state, label) => {
    render(<ConnectionStatus state={state} />)
    expect(screen.getByRole('status')).toHaveTextContent(label)
  })

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
    const { rerender } = render(
      <ProductCatalog
        products={[laptop]}
        loading={false}
        error={null}
        pendingActions={new Set()}
        onAdd={onAdd}
        onInspect={onInspect}
      />,
    )

    await user.clear(screen.getByLabelText('Quantity for Laptop'))
    await user.type(screen.getByLabelText('Quantity for Laptop'), '3')
    await user.click(screen.getByRole('button', { name: 'Add Laptop' }))
    expect(onAdd).toHaveBeenCalledWith(1, 3)

    rerender(
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

  it('shows loading and backend errors without hiding loaded products', () => {
    render(
      <ProductCatalog
        products={[laptop]}
        loading
        error="Catalog refresh failed"
        pendingActions={new Set()}
        onAdd={vi.fn()}
        onInspect={vi.fn()}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading catalog...')
    expect(screen.getByRole('alert')).toHaveTextContent('Catalog refresh failed')
    expect(screen.getByRole('heading', { name: 'Laptop' })).toBeInTheDocument()
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

  it('emits remove and clear cart intents', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const onClear = vi.fn()
    render(
      <CartPanel
        cart={cart}
        loading={false}
        error={null}
        pendingActions={new Set()}
        onRemove={onRemove}
        onClear={onClear}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove Laptop' }))
    await user.click(screen.getByRole('button', { name: 'Clear cart' }))
    expect(onRemove).toHaveBeenCalledWith(1)
    expect(onClear).toHaveBeenCalledOnce()
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

  it('trims a selected user ID', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<UserSelector activeUserId="demo-eliab" onSelect={onSelect} disabled={false} />)

    await user.clear(screen.getByLabelText('User ID'))
    await user.type(screen.getByLabelText('User ID'), '  second-user  ')
    await user.click(screen.getByRole('button', { name: 'Load cart' }))
    expect(onSelect).toHaveBeenCalledWith('second-user')
  })

  it('expands the newest exchange and labels the backend path as static', () => {
    render(<RequestInspector history={[latestExchange]} />)

    expect(screen.getByText('Latest HTTP exchange')).toBeInTheDocument()
    expect(screen.getByText('Explained backend path')).toBeInTheDocument()
    expect(screen.getByText('Static explanation, not runtime telemetry.')).toBeInTheDocument()
    expect(screen.getAllByText(/"quantity": 2/)).toHaveLength(2)
  })
})
