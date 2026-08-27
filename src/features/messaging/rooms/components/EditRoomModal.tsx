import { useState } from 'react'

import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'

import { useUpdateRoom } from '../hooks/useUpdateRoom'
import type { RoomWithMetadata } from '../types/room'

type EditRoomFormProps = {
  room: RoomWithMetadata
  onClose: () => void
}

function EditRoomForm({ room, onClose }: EditRoomFormProps) {
  const [name, setName] = useState(room.name ?? '')
  const [error, setError] = useState<string | null>(null)

  const updateRoomMutation = useUpdateRoom()

  const handleSubmit = async () => {
    if (!room.is_group) {
      return
    }

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Room name is required.')
      return
    }

    if (trimmedName === (room.name ?? '')) {
      onClose()
      return
    }

    setError(null)

    try {
      await updateRoomMutation.mutateAsync({
        roomId: room.id,
        name: trimmedName,
      })

      onClose()
    } catch {
      setError('The room could not be updated. Please try again.')
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label
          htmlFor="edit-room-name"
          className="text-sm font-medium text-foreground"
        >
          Room name
        </label>

        <Input
          id="edit-room-name"
          placeholder="Room name..."
          aria-label="Room name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (error) {
              setError(null)
            }
          }}
          autoFocus
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={updateRoomMutation.isPending}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={updateRoomMutation.isPending || !name.trim()}
        >
          {updateRoomMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

type EditRoomModalProps = {
  room: RoomWithMetadata | null
  open: boolean
  onClose: () => void
}

export function EditRoomModal({ room, open, onClose }: EditRoomModalProps) {
  return (
    <Modal open={open} title="Rename room" onClose={onClose}>
      {room && <EditRoomForm room={room} onClose={onClose} />}
    </Modal>
  )
}
