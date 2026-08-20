import { MessageSquare, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/Button'

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        onClick={() => {
          void navigate('/app/chat')
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Room
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          void navigate('/app/chat')
        }}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Open Chat
      </Button>
    </div>
  )
}
