const imageUrlCache = new Map<string, string>()

export function getCachedImageUrl(attachmentId: string) {
  return imageUrlCache.get(attachmentId) ?? null
}

export async function cacheImage(
  attachmentId: string,
  imageUrl: string,
) {
  const cachedImageUrl = imageUrlCache.get(attachmentId)

  if (cachedImageUrl) {
    return cachedImageUrl
  }

  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('Failed to load image.')
  }

  const imageBlob = await response.blob()
  const objectUrl = URL.createObjectURL(imageBlob)

  imageUrlCache.set(attachmentId, objectUrl)

  return objectUrl
}
