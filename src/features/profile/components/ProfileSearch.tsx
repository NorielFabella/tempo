import { useState } from 'react'

import { useProfileSearch } from '../hooks/useProfileSearch'
import type { ProfileSearchResult } from '../types/profile'

type ProfileSearchProps = {
  onSelectProfile: (profile: ProfileSearchResult) => void
  excludeUserIds?: string[]
  placeholder?: string
}

function getDisplayName(profile: ProfileSearchResult) {
  if (profile.full_name?.trim()) {
    return profile.full_name.trim()
  }

  return profile.email
}

function getInitials(profile: ProfileSearchResult) {
  const name = profile.full_name?.trim()

  if (!name) {
    return profile.email.charAt(0).toUpperCase()
  }

  const parts = name.split(/\s+/)

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function ProfileSearch({
  onSelectProfile,
  excludeUserIds = [],
  placeholder = 'Search people...',
}: ProfileSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const normalizedQuery = searchQuery.trim()

  const {
    data: profiles = [],
    isLoading,
    isError,
  } = useProfileSearch(normalizedQuery)

  const visibleProfiles = profiles.filter(
    (profile) => !excludeUserIds.includes(profile.id),
  )

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value)
        }}
        placeholder={placeholder}
        aria-label="Search people"
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
      />

      {normalizedQuery.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Type at least 2 characters to search.
        </p>
      ) : isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <span className="sr-only">Searching for people</span>

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : isError ? (
        <p role="alert" className="text-sm text-red-600">
          People could not be loaded. Please try again.
        </p>
      ) : visibleProfiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No people found.
        </p>
      ) : (
        <div className="space-y-1">
          {visibleProfiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-muted"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold"
                >
                  {getInitials(profile)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {getDisplayName(profile)}
                </p>

                {profile.full_name?.trim() && (
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.email}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectProfile(profile)
                }}
                className="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Message
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
