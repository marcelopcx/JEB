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

function isUnavailableProxyResponse(status: number, body: unknown): boolean {
  return status === 502 && body === null
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
        const proxyUnavailable = isUnavailableProxyResponse(response.status, responseBody)
        const exchange: HttpExchange = {
          ...baseExchange,
          durationMs: Math.round(monotonicNow() - start),
          status: response.status,
          responseBody,
          outcome: response.ok ? 'success' : proxyUnavailable ? 'network-error' : 'http-error',
        }

        options.onExchange(exchange)

        if (proxyUnavailable) {
          throw new HttpRequestError(
            'network',
            `Backend unreachable: HTTP ${response.status}`,
            exchange,
          )
        }

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
