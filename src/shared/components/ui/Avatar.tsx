import { useState } from 'react'

type AvatarProps = {
  imageUrl?: string | null
  fallback: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  cacheKey?: string | number
}

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
}

export function Avatar({
  imageUrl,
  fallback,
  alt = '',
  size = 'md',
  cacheKey,
}: AvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const sizeClass = sizeClasses[size]
  const displayImageUrl =
    imageUrl && cacheKey !== undefined
      ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(cacheKey))}`
      : imageUrl

  if (displayImageUrl && failedImageUrl !== displayImageUrl) {
    return (
      <img
        src={displayImageUrl}
        alt={alt}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
        onError={() => {
          setFailedImageUrl(displayImageUrl)
        }}
      />
    )
  }

  return (
    <div
      aria-hidden={alt ? undefined : true}
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground`}
    >
      {fallback}
    </div>
  )
}