import {
    CalendarDays,
    Camera,
    Clock3,
    Mail,
    UserCircle,
} from 'lucide-react'

import { useAvatarUpload } from '@/features/profile/hooks/useAvatarUpload'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile'
import {
    profileSchema,
    type ProfileFormValues,
} from '@/features/profile/schemas/profileSchema'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEventHandler } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'

function getInitials(fullName: string | null, email: string) {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/)

    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  }

  return email.charAt(0).toUpperCase()
}

function formatDate(date: string | null) {
  if (!date) {
    return 'Not available'
  }

  return new Date(date).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatLastSeen(lastSeenAt: string | null) {
  if (!lastSeenAt) {
    return 'Never'
  }

  const lastSeen = new Date(lastSeenAt)
  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - lastSeen.getTime())
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  return lastSeen.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const avatarUpload = useAvatarUpload()
  const updateProfileMutation = useUpdateProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
    },
  })

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    avatarUpload.mutate(file)
  }

  const handleEdit = () => {
    if (!profile) {
      return
    }

    reset({ full_name: profile.full_name?.trim() ?? '' })
    setUpdateMessage(null)
    setUpdateError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    reset({ full_name: profile?.full_name?.trim() ?? '' })
    setUpdateError(null)
    setIsEditing(false)
  }

  const onSubmit: SubmitHandler<ProfileFormValues> = async (values) => {
    if (!profile) {
      return
    }

    setUpdateMessage(null)
    setUpdateError(null)

    const fullName = values.full_name.trim()
    const originalFullName = profile.full_name?.trim() ?? ''

    if (fullName === originalFullName) {
      setIsEditing(false)
      return
    }

    try {
      await updateProfileMutation.mutateAsync({ full_name: fullName })
      setIsEditing(false)
      setUpdateMessage('Profile updated.')
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : 'Could not update your profile.',
      )
    }
  }

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    void handleSubmit(onSubmit)(event)
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/70" />
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />

            <div className="w-full space-y-3 sm:w-auto">
              <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-56 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/70" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/70"
              />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md items-center justify-center">
        <Card className="w-full p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <UserCircle className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            Profile unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            We could not load your profile information. Please try again.
          </p>

          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={() => {
              void refetch()
            }}
          >
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  const displayName = profile.full_name?.trim() || 'Tempo User'
  const initials = getInitials(profile.full_name, profile.email)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Profile
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          View your account information and activity details.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${displayName}'s avatar`}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-sm dark:border-slate-800"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-2xl font-semibold text-white shadow-sm dark:border-slate-800 dark:bg-slate-700"
                >
                  {initials}
                </div>
              )}

              <label
                className={[
                  'absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full',
                  'border-2 border-white bg-slate-900 text-white shadow-md',
                  'transition-colors hover:bg-slate-700',
                  'dark:border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
                  avatarUpload.isPending
                    ? 'pointer-events-none opacity-60'
                    : '',
                ].join(' ')}
                aria-label="Change profile picture"
              >
                <Camera className="h-4 w-4" />

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={avatarUpload.isPending}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <h2 className="truncate text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {displayName}
              </h2>

              <p className="mt-1 flex items-center justify-center gap-2 break-all text-sm text-slate-600 dark:text-slate-400 sm:justify-start">
                <Mail className="h-4 w-4 shrink-0" />
                {profile.email}
              </p>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {avatarUpload.isPending
                  ? 'Uploading profile picture...'
                  : 'JPG, PNG, or WebP · Max 1 MB'}
              </p>

              {avatarUpload.isError && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {avatarUpload.error instanceof Error
                    ? avatarUpload.error.message
                    : 'Could not upload your profile picture.'}
                </p>
              )}

              {avatarUpload.isSuccess && (
                <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Profile picture updated.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Member since
                </p>

                <p className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Clock3 className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Last seen
                </p>

                <p className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">
                  {formatLastSeen(profile.last_seen_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <UserCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Account information
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Information associated with your Tempo account.
              </p>
            </div>
          </div>

          {!isEditing && (
            <Button type="button" variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleFormSubmit}>
          <dl className="mt-6 divide-y divide-slate-200 dark:divide-slate-800">
            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Full name
              </dt>

              <dd className="w-full text-sm text-slate-900 dark:text-slate-100 sm:max-w-sm sm:text-right">
                {isEditing ? (
                  <div className="text-left">
                    <label htmlFor="profile-full-name" className="sr-only">
                      Full name
                    </label>

                    <Input
                      id="profile-full-name"
                      autoComplete="name"
                      {...register('full_name', {
                        onChange: () => {
                          setUpdateError(null)
                        },
                      })}
                      aria-invalid={errors.full_name ? 'true' : undefined}
                      aria-describedby={
                        errors.full_name ? 'profile-full-name-error' : undefined
                      }
                      autoFocus
                    />

                    {errors.full_name && (
                      <p
                        id="profile-full-name-error"
                        role="alert"
                        className="mt-1 text-sm text-red-600 dark:text-red-400"
                      >
                        {errors.full_name.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="break-words">
                    {profile.full_name?.trim() || 'Not set'}
                  </span>
                )}
              </dd>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Email
              </dt>

              <dd className="break-all text-sm text-slate-900 dark:text-slate-100 sm:text-right">
                {profile.email}
              </dd>
            </div>

            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Account created
              </dt>

              <dd className="text-sm text-slate-900 dark:text-slate-100 sm:text-right">
                {formatDate(profile.created_at)}
              </dd>
            </div>
          </dl>

          {isEditing && (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
              {updateError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400 sm:mr-auto">
                  {updateError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </form>

        {updateMessage && !isEditing && (
          <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {updateMessage}
          </p>
        )}
      </Card>
    </div>
  )
}
