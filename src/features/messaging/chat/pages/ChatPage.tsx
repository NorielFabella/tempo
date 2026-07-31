import { useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCreateRoom } from '@/features/messaging/rooms/hooks/useCreateRoom'
import { useRooms } from '@/features/messaging/rooms/hooks/useRooms'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'



export function ChatPage() {
  const { user } = useAuth()
  const { data: rooms, isLoading } = useRooms()
  const createRoomMutation = useCreateRoom()



  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [roomName, setRoomName] = useState('')

  const activeRoomId = selectedRoomId ?? rooms?.[0]?.id ?? null

  const selectedRoom = rooms?.find(
    (room) => room.id === activeRoomId,
  )

  async function handleCreateRoom() {

    if (!user || !roomName.trim()) {
      return
    }

    await createRoomMutation.mutateAsync({
      name: roomName.trim(),
      userId: user.id,
    })

    setRoomName('')
  }

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* Rooms Sidebar */}
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">
            Rooms
          </h2>

          <div className="mt-4 space-y-2">
            <Input
              placeholder="Room name..."
              value={roomName}
              onChange={(event) => {
                setRoomName(event.target.value)
              }}
            />

            <Button
              className="w-full"
              onClick={() => {
                void handleCreateRoom()
              }}
              disabled={
                createRoomMutation.isPending ||
                !roomName.trim()
              }
            >
              {createRoomMutation.isPending
                ? 'Creating...'
                : 'New Room'}
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {rooms?.length ? (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => {
                  setSelectedRoomId(room.id)
                }}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                  room.id === activeRoomId
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="font-medium">
                  {room.name ?? 'Direct Message'}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No rooms found.
            </p>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">
            {selectedRoom?.name ?? 'Direct Message'}
          </h2>

          <p className="text-sm text-muted-foreground">
            Room ID: {selectedRoom?.id ?? '-'}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-muted-foreground">
            Messages will appear here.
          </p>
        </div>

        <div className="border-t p-4">
          <div className="flex gap-3">
            <Input
              placeholder="Type a message..."
              disabled
            />

            <Button disabled>
              Send
            </Button>

          </div>
        </div>
      </Card>
    </div>
  )
}
