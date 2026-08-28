import { useState } from 'react'

import { ProfileSearch } from '@/features/profile/components/ProfileSearch'
import type { ProfileSearchResult } from '@/features/profile/types/profile'
import { Button } from '@/shared/components/ui/Button'

import { useAddRoomMember } from '../hooks/useAddRoomMember'

type AddRoomMembersProps = {
  roomId: string
  currentUserId: string
  memberIds: string[]
}

export function AddRoomMembers({
  roomId,
  currentUserId,
  memberIds,
}: AddRoomMembersProps) {
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addRoomMemberMutation = useAddRoomMember()

  const excludedUserIds = [currentUserId, ...memberIds]

  async function handleAddMember() {
    if (!selectedProfile) {
      return
    }

    setError(null)

    try {
      await addRoomMemberMutation.mutateAsync({
        roomId,
        userId: selectedProfile.id,
      })

      setSelectedProfile(null)
    } catch {
      setError('The member could not be added. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <ProfileSearch
        excludeUserIds={excludedUserIds}
        onSelectProfile={(profile) => {
          setSelectedProfile(profile)
          setError(null)
        }}
      />

      {selectedProfile && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          {selectedProfile.avatar_url ? (
            <img
              src={selectedProfile.avatar_url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {selectedProfile.full_name?.trim()
                ? selectedProfile.full_name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join('')
                : selectedProfile.email.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {selectedProfile.full_name?.trim() || selectedProfile.email}
            </p>

            {selectedProfile.full_name?.trim() && (
              <p className="truncate text-xs text-muted-foreground">
                {selectedProfile.email}
              </p>
            )}
          </div>

          <Button
            type="button"
            onClick={() => {
              void handleAddMember()
            }}
            disabled={addRoomMemberMutation.isPending}
          >
            {addRoomMemberMutation.isPending ? 'Adding...' : 'Confirm'}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
