import { useAuth } from '@/features/auth/hooks/useAuth'
import { signOut } from '@/features/auth/services/auth.service'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div>
      <h1>Home</h1>

      <p>{user?.email}</p>

      <button
        onClick={() => {
          void signOut()
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
