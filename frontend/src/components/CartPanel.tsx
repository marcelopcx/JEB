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
          <p className="eyebrow">Caché local en memoria</p>
          <h2 id="cart-title">Carrito {cart ? `de ${cart.userId}` : ''}</h2>
        </div>
        {loading && <span role="status">Cargando carrito...</span>}
      </div>
      {error && <p role="alert" className="error-message">{error}</p>}
      {!cart && !loading && <p>Aún no se ha cargado un carrito válido.</p>}
      {cart && (
        <>
          {cart.items.length === 0 ? (
            <p className="empty-state">Este carrito está vacío.</p>
          ) : (
            <ul className="cart-list">
              {cart.items.map((item) => (
                <li key={item.productId}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>Cantidad: {item.quantity}</span>
                    <span>Precio unitario: {money(item.unitPrice)}</span>
                  </div>
                  <div className="cart-list__actions">
                    <strong>{money(item.subtotal)}</strong>
                    <button
                      type="button"
                      className="button-danger"
                      disabled={pendingActions.has(`remove:${item.productId}`)}
                      onClick={() => onRemove(item.productId)}
                    >
                      Eliminar {item.productName}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="cart-total">
            <span>Total del backend</span>
            <strong>{money(cart.total)}</strong>
          </div>
          <button
            type="button"
            className="button-danger"
            disabled={pendingActions.has('clear') || cart.items.length === 0}
            onClick={onClear}
          >
            Vaciar carrito
          </button>
        </>
      )}
    </section>
  )
}
