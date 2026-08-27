import { useEffect, useRef, useState } from 'react'

import { Avatar } from '@/shared/components/ui/Avatar'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'

import { useRoomAvatarMutation } from '../hooks/useRoomAvatarMutation'
import { useUpdateRoom } from '../hooks/useUpdateRoom'
import { getRoomInitials, type RoomWithMetadata } from '../types/room'

type EditRoomFormProps = {
  room: RoomWithMetadata
  userId: string
  onClose: () => void
}

function EditRoomForm({ room, userId, onClose }: EditRoomFormProps) {
  const [name, setName] = useState(room.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false)
  const previewUrlRef = useRef<string | null>(null)

  const updateRoomMutation = useUpdateRoom()
  const roomAvatarMutation = useRoomAvatarMutation()
  const isPending =
    updateRoomMutation.isPending || roomAvatarMutation.isPending

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const avatarUrl = removeAvatarRequested
    ? null
    : previewUrl ?? room.avatar_url

  const handleFileChange = (file: File | undefined) => {
    if (!file) {
      return
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextPreviewUrl
    setPreviewUrl(nextPreviewUrl)
    setSelectedFile(file)
    setRemoveAvatarRequested(false)
    setError(null)
  }

  const handleRemoveAvatar = () => {
    if (selectedFile) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }

      setSelectedFile(null)
      setPreviewUrl(null)
    } else {
      setRemoveAvatarRequested(true)
    }

    setError(null)
  }

  const handleSubmit = async () => {
    if (!room.is_group) {
      return
    }

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Room name is required.')
      return
    }

    const shouldUpdateName = trimmedName !== (room.name ?? '')
    const shouldUpdateAvatar =
      selectedFile !== null || removeAvatarRequested

    if (!shouldUpdateName && !shouldUpdateAvatar) {
      onClose()
      return
    }

    setError(null)

    try {
      if (shouldUpdateName) {
        await updateRoomMutation.mutateAsync({
          roomId: room.id,
          name: trimmedName,
        })
      }

      if (selectedFile) {
        if (!userId) {
          throw new Error('You must be signed in to update a room avatar.')
        }

        await roomAvatarMutation.mutateAsync({
          roomId: room.id,
          userId,
          file: selectedFile,
        })
      } else if (removeAvatarRequested) {
        if (!userId) {
          throw new Error('You must be signed in to update a room avatar.')
        }

        await roomAvatarMutation.mutateAsync({
          roomId: room.id,
          userId,
        })
      }

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

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Room avatar</p>

        <div className="flex items-center gap-4">
          <Avatar
            imageUrl={avatarUrl}
            fallback={getRoomInitials(name)}
            alt=""
            size="lg"
          />

          <div className="space-y-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted">
              Choose image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isPending}
                onChange={(event) => {
                  handleFileChange(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </label>

            {(room.avatar_url || selectedFile) && !removeAvatarRequested && (
              <button
                type="button"
                className="block text-sm text-red-600 hover:underline disabled:opacity-60"
                disabled={isPending}
                onClick={handleRemoveAvatar}
              >
                {selectedFile ? 'Discard image' : 'Remove image'}
              </button>
            )}

            {removeAvatarRequested && (
              <button
                type="button"
                className="block text-sm hover:underline disabled:opacity-60"
                disabled={isPending}
                onClick={() => {
                  setRemoveAvatarRequested(false)
                  setError(null)
                }}
              >
                Keep current image
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP · Max 1 MB
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isPending || !name.trim()}
        >
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

type EditRoomModalProps = {
  room: RoomWithMetadata | null
  userId: string
  open: boolean
  onClose: () => void
}

export function EditRoomModal({
  room,
  userId,
  open,
  onClose,
}: EditRoomModalProps) {
  return (
    <Modal open={open} title="Rename room" onClose={onClose}>
      {room && (
        <EditRoomForm
          key={room.id}
          room={room}
          userId={userId}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}
