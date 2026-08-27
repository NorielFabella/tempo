import { useState } from 'react'

import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'

import { useDeleteDirectRoom } from '../hooks/useDeleteDirectRoom'
import { useDeleteRoom } from '../hooks/useDeleteRoom'
import type { RoomWithMetadata } from '../types/room'

type DeleteRoomModalProps = {
  room: RoomWithMetadata | null
  userId: string
  open: boolean
  onClose: () => void
  onDeleted?: (deletedRoomId: string) => void
}

export function DeleteRoomModal({
  room,
  userId,
  open,
  onClose,
  onDeleted,
}: DeleteRoomModalProps) {
  const [error, setError] = useState<string | null>(null)
  const deleteRoomMutation = useDeleteRoom()
  const deleteDirectRoomMutation = useDeleteDirectRoom()
  const isGroupRoom = room?.is_group ?? false
  const deleteMutation = isGroupRoom
    ? deleteRoomMutation
    : deleteDirectRoomMutation

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    if (!room) {
      return
    }

    setError(null)

    try {
      if (room.is_group) {
        await deleteRoomMutation.mutateAsync({ roomId: room.id })
      } else {
        await deleteDirectRoomMutation.mutateAsync({
          roomId: room.id,
          userId,
        })
      }

      handleClose()
      onDeleted?.(room.id)
    } catch {
      setError(
        room.is_group
          ? 'The room could not be deleted. Please try again.'
          : 'The conversation could not be deleted. Please try again.',
      )
    }
  }

  return (
    <Modal
      open={open}
      title={isGroupRoom ? 'Delete room' : 'Delete conversation'}
      onClose={handleClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isGroupRoom ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {room?.name ?? 'this group room'}
              </span>
              ? This action is permanent and will remove the room and all its messages for all members.
            </>
          ) : (
            'This conversation will be removed from your chat list. The other participant will keep their message history.'
          )}
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
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => {
              void handleDelete()
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? 'Deleting...'
              : isGroupRoom
                ? 'Delete room'
                : 'Delete for me'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
