import type { HttpExchange, HttpOutcome } from '../api/types'
import { BackendPath } from './BackendPath'

interface RequestInspectorProps {
  history: HttpExchange[]
}

function body(value: unknown): string {
  if (value === undefined) return 'Ninguno'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

const outcomeLabels: Record<HttpOutcome, string> = {
  success: 'Éxito',
  'http-error': 'Error HTTP',
  'network-error': 'Error de red',
}

export function RequestInspector({ history }: RequestInspectorProps) {
  const latest = history[0] ?? null

  return (
    <aside className="panel inspector" aria-labelledby="inspector-title">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Observado en el límite del navegador</p>
          <h2 id="inspector-title">Último intercambio HTTP</h2>
        </div>
        <span>{history.length}/20 conservados</span>
      </div>
      {!latest && <p>Usa el catálogo o el carrito para capturar una solicitud real.</p>}
      {latest && <BackendPath exchange={latest} />}
      <div className="request-history">
        {history.map((exchange, index) => (
          <details key={exchange.id} open={index === 0}>
            <summary>
              <span>{exchange.method} {exchange.path}</span>
              <span>{exchange.status ?? 'SIN RESPUESTA'} · {exchange.durationMs} ms</span>
            </summary>
            <dl>
              <dt>Inicio</dt>
              <dd>{exchange.startedAt}</dd>
              <dt>Resultado</dt>
              <dd>{outcomeLabels[exchange.outcome]}</dd>
              <dt>Cuerpo de la solicitud</dt>
              <dd><pre>{body(exchange.requestBody)}</pre></dd>
              <dt>Cuerpo de la respuesta</dt>
              <dd><pre>{body(exchange.responseBody)}</pre></dd>
            </dl>
          </details>
        ))}
      </div>
    </aside>
  )
}
