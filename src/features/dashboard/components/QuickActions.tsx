import { MessageSquare, Plus } from 'lucide-react'

import { Button } from '@/shared/components/ui/Button'

export function QuickActions() {
  return (
    <div className="flex gap-3">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Project
      </Button>

      <Button variant="secondary">
        <MessageSquare className="mr-2 h-4 w-4" />
        New Chat
      </Button>
    </div>
  )
}
