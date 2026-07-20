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
