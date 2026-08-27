const MAX_AVATAR_SIZE = 1 * 1024 * 1024

export function getAvatarFileExtension(file: File): string | null {
  switch (file.type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
}

export function validateAvatarFile(file: File): string {
  const extension = getAvatarFileExtension(file)

  if (!extension) {
    throw new Error('Please choose a JPG, PNG, or WebP image.')
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('Avatar image must be 1 MB or smaller.')
  }

  return extension
}