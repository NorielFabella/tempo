import { createContext } from 'react'

export type PresenceContextValue = {
  onlineUserIds: string[]
}

export const PresenceContext = createContext<PresenceContextValue | null>(null)
