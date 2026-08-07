import type { PropsWithChildren } from 'react'

import { PresenceContext } from '../context/PresenceContext'
import { useGlobalPresence } from '../hooks/usePresence'

export function PresenceProvider({ children }: PropsWithChildren) {
  const { onlineUserIds } = useGlobalPresence()

  return (
    <PresenceContext.Provider value={{ onlineUserIds }}>
      {children}
    </PresenceContext.Provider>
  )
}
