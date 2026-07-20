import { useState, type FormEvent } from 'react'

interface UserSelectorProps {
  activeUserId: string
  disabled: boolean
  onSelect: (userId: string) => void
}

export function UserSelector({ activeUserId, disabled, onSelect }: UserSelectorProps) {
  const [draft, setDraft] = useState(activeUserId)
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const userId = draft.trim()

    if (userId.length === 0) {
      setError('El ID de usuario es obligatorio.')
      return
    }

    setError(null)
    onSelect(userId)
  }

  return (
    <form className="user-selector" onSubmit={submit} noValidate>
      <label htmlFor="user-id">ID de usuario</label>
      <div className="user-selector__controls">
        <input
          id="user-id"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-invalid={error !== null}
        />
        <button type="submit" disabled={disabled}>
          Cargar carrito
        </button>
      </div>
      {error && <span role="alert">{error}</span>}
    </form>
  )
}
