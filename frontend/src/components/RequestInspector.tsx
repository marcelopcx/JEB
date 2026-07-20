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
