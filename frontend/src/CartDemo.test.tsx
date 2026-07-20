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

    expect(screen.getAllByText(/cargando/i).length).toBeGreaterThan(0)
    expect(await screen.findByRole('heading', { name: 'Laptop' })).toBeInTheDocument()
    expect(await screen.findByText('Carrito de demo-eliab')).toBeInTheDocument()
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
    await screen.findByText('Cantidad: 1')

    await user.clear(screen.getByLabelText('ID de usuario'))
    await user.type(screen.getByLabelText('ID de usuario'), 'second-user')
    await user.click(screen.getByRole('button', { name: 'Cargar carrito' }))

    expect(await screen.findByText('Cart request failed')).toBeInTheDocument()
    expect(screen.getByText('Cantidad: 1')).toBeInTheDocument()
  })

  it('does not update the cart optimistically and disables only the add action', async () => {
    const user = userEvent.setup()
    const pendingAdd = deferred<Cart>()
    const addItem = vi.fn<CartApi['addItem']>().mockReturnValue(pendingAdd.promise)
    render(<CartDemo apiFactory={factory(apiWith({ addItem }))} />)
    await screen.findByText('Cantidad: 1')

    await user.click(screen.getByRole('button', { name: 'Agregar Laptop' }))

    expect(screen.getByText('Cantidad: 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar Laptop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Inspeccionar Laptop' })).toBeEnabled()

    await act(async () => {
      pendingAdd.resolve({
        ...initialCart,
        items: [{ ...initialCart.items[0], quantity: 3, subtotal: 2699.97 }],
        total: 2699.97,
      })
    })

    expect(await screen.findByText('Cantidad: 3')).toBeInTheDocument()
  })

  it('uses product-by-ID inspection without changing catalog or cart state', async () => {
    const user = userEvent.setup()
    const getProduct = vi.fn<CartApi['getProduct']>().mockResolvedValue(products[0])
    render(<CartDemo apiFactory={factory(apiWith({ getProduct }))} />)
    await screen.findByText('Cantidad: 1')

    await user.click(screen.getByRole('button', { name: 'Inspeccionar Laptop' }))

    await waitFor(() => expect(getProduct).toHaveBeenCalledWith(1))
    expect(screen.getByText('Cantidad: 1')).toBeInTheDocument()
  })

  it('replaces cart state with the remove response', async () => {
    const user = userEvent.setup()
    const emptyCart = { userId: 'demo-eliab', items: [], total: 0 }
    const removeItem = vi.fn<CartApi['removeItem']>().mockResolvedValue(emptyCart)
    render(<CartDemo apiFactory={factory(apiWith({ removeItem }))} />)
    await screen.findByText('Cantidad: 1')

    await user.click(screen.getByRole('button', { name: 'Eliminar Laptop' }))
    expect(await screen.findByText('Este carrito está vacío.')).toBeInTheDocument()
    expect(removeItem).toHaveBeenCalledWith('demo-eliab', 1)
  })

  it('replaces cart state with the clear response', async () => {
    const user = userEvent.setup()
    const emptyCart = { userId: 'demo-eliab', items: [], total: 0 }
    const clearCart = vi.fn<CartApi['clearCart']>().mockResolvedValue(emptyCart)
    render(<CartDemo apiFactory={factory(apiWith({ clearCart }))} />)
    await screen.findByText('Cantidad: 1')

    await user.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    expect(await screen.findByText('Este carrito está vacío.')).toBeInTheDocument()
    expect(clearCart).toHaveBeenCalledWith('demo-eliab')
  })

  it('keeps loaded catalog data visible after a later catalog-independent error', async () => {
    const api = apiWith({ getProduct: vi.fn().mockRejectedValue(new Error('Inspect failed')) })
    const user = userEvent.setup()
    render(<CartDemo apiFactory={factory(api)} />)
    await screen.findByRole('heading', { name: 'Laptop' })

    await user.click(screen.getByRole('button', { name: 'Inspeccionar Laptop' }))

    expect(await screen.findByText('Inspect failed')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Laptop' })).toBeInTheDocument()
  })

  it('ignores a cart mutation response after the active user changes', async () => {
    const user = userEvent.setup()
    const pendingAdd = deferred<Cart>()
    const secondCart: Cart = { userId: 'second-user', items: [], total: 0 }
    const getCart = vi
      .fn<CartApi['getCart']>()
      .mockResolvedValueOnce(initialCart)
      .mockResolvedValueOnce(secondCart)
    const addItem = vi.fn<CartApi['addItem']>().mockReturnValue(pendingAdd.promise)
    render(<CartDemo apiFactory={factory(apiWith({ addItem, getCart }))} />)
    await screen.findByText('Cantidad: 1')

    await user.click(screen.getByRole('button', { name: 'Agregar Laptop' }))
    await user.clear(screen.getByLabelText('ID de usuario'))
    await user.type(screen.getByLabelText('ID de usuario'), 'second-user')
    await user.click(screen.getByRole('button', { name: 'Cargar carrito' }))
    expect(await screen.findByText('Carrito de second-user')).toBeInTheDocument()

    await act(async () => pendingAdd.resolve(initialCart))

    expect(screen.getByText('Carrito de second-user')).toBeInTheDocument()
    expect(screen.getByText('Este carrito está vacío.')).toBeInTheDocument()
  })

  it('serializes cart mutations so backend snapshots cannot resolve out of order', async () => {
    const mouse: Product = {
      id: 2,
      name: 'Mouse',
      description: 'Wireless mouse',
      price: 25,
      stock: 30,
    }
    const firstAdd = deferred<Cart>()
    const secondAdd = deferred<Cart>()
    const addItem = vi
      .fn<CartApi['addItem']>()
      .mockReturnValueOnce(firstAdd.promise)
      .mockReturnValueOnce(secondAdd.promise)
    const user = userEvent.setup()
    render(
      <CartDemo
        apiFactory={factory(apiWith({
          listProducts: vi.fn().mockResolvedValue([...products, mouse]),
          addItem,
        }))}
      />,
    )
    await screen.findByRole('heading', { name: 'Mouse' })

    await user.click(screen.getByRole('button', { name: 'Agregar Laptop' }))
    await user.click(screen.getByRole('button', { name: 'Agregar Mouse' }))
    expect(addItem).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Agregar Laptop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Agregar Mouse' })).toBeDisabled()

    await act(async () => firstAdd.resolve(initialCart))
    await waitFor(() => expect(addItem).toHaveBeenCalledTimes(2))

    const finalCart: Cart = {
      userId: 'demo-eliab',
      items: [
        initialCart.items[0],
        { productId: 2, productName: 'Mouse', unitPrice: 25, quantity: 1, subtotal: 25 },
      ],
      total: 924.99,
    }
    await act(async () => secondAdd.resolve(finalCart))

    expect(await screen.findByRole('button', { name: 'Eliminar Mouse' })).toBeInTheDocument()
    expect(screen.getByText('$924.99')).toBeInTheDocument()
  })
})
