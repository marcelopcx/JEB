import type { HttpErrorKind, HttpExchange } from './types'

export class HttpRequestError extends Error {
  readonly kind: HttpErrorKind
  readonly exchange: HttpExchange

  constructor(kind: HttpErrorKind, message: string, exchange: HttpExchange, cause?: unknown) {
    super(message)
    this.name = 'HttpRequestError'
    this.kind = kind
    this.exchange = exchange
    this.cause = cause
  }
}
