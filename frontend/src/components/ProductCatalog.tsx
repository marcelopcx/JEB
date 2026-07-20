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
            <strong>
              ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
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
