import { useState } from 'react'

import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'

import { useDeleteRoom } from '../hooks/useDeleteRoom'
import type { RoomWithMetadata } from '../types/room'

type DeleteRoomModalProps = {
  room: RoomWithMetadata | null
  open: boolean
  onClose: () => void
  onDeleted?: (deletedRoomId: string) => void
}

export function DeleteRoomModal({
  room,
  open,
  onClose,
  onDeleted,
}: DeleteRoomModalProps) {
  const [error, setError] = useState<string | null>(null)
  const deleteRoomMutation = useDeleteRoom()

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    if (!room || !room.is_group) {
      return
    }

    setError(null)

    try {
      await deleteRoomMutation.mutateAsync({
        roomId: room.id,
      })

      handleClose()
      onDeleted?.(room.id)
    } catch {
      setError('The room could not be deleted. Please try again.')
    }
  }

  return (
    <Modal open={open} title="Delete room" onClose={handleClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-foreground">
            {room?.name ?? 'this group room'}
          </span>
          ? This action is permanent and will remove the room and all its messages for all members.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={deleteRoomMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => {
              void handleDelete()
            }}
            disabled={deleteRoomMutation.isPending}
          >
            {deleteRoomMutation.isPending ? 'Deleting...' : 'Delete room'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
