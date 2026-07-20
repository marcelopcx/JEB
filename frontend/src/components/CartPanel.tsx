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
