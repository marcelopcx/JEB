export type ConnectionState = 'connected' | 'loading' | 'unavailable'

interface ConnectionStatusProps {
  state: ConnectionState
}

const labels: Record<ConnectionState, string> = {
  connected: 'Backend conectado',
  loading: 'Contactando al backend',
  unavailable: 'Backend no disponible',
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  return (
    <span className={`connection-status connection-status--${state}`} role="status">
      {labels[state]}
    </span>
  )
}
