export type ConnectionState = 'connected' | 'loading' | 'unavailable'

interface ConnectionStatusProps {
  state: ConnectionState
}

const labels: Record<ConnectionState, string> = {
  connected: 'Backend connected',
  loading: 'Contacting backend',
  unavailable: 'Backend unavailable',
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  return (
    <span className={`connection-status connection-status--${state}`} role="status">
      {labels[state]}
    </span>
  )
}
