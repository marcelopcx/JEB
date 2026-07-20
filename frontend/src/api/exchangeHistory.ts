import type { HttpExchange } from './types'

const HISTORY_LIMIT = 20

export function prependExchange(
  history: HttpExchange[],
  exchange: HttpExchange,
): HttpExchange[] {
  return [exchange, ...history].slice(0, HISTORY_LIMIT)
}
