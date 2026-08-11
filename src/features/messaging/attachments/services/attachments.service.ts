import type { TablesInsert } from '@/shared/types/database'
import { supabase } from '@/shared/supabase/client'

import type {
  MessageAttachment,
  MessageAttachmentWithUrl,
} from '../types/attachment'

export const ATTACHMENTS_BUCKET = 'message-attachments'
export const MAX_ATTACHMENTS_PER_MESSAGE = 5
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
export const ATTACHMENT_INPUT_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
].join(',')

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60

const supportedFileTypes = new Set(ATTACHMENT_INPUT_ACCEPT.split(','))
const supportedFileExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
])

function getFileExtension(fileName: string) {
  const extensionStart = fileName.lastIndexOf('.')

  return extensionStart > 0 ? fileName.slice(extensionStart).toLowerCase() : ''
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function getAttachmentPath(messageId: string, file: File) {
  return `${messageId}/${crypto.randomUUID()}${getFileExtension(file.name)}`
}

async function removeUploadedFiles(filePaths: string[]) {
  if (!filePaths.length) {
    return
  }

  await supabase.storage.from(ATTACHMENTS_BUCKET).remove(filePaths)
}

export function formatAttachmentSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.round(fileSize / 1024)} KB`
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageAttachment(attachment: MessageAttachment) {
  return attachment.file_type.startsWith('image/')
}

export function validateAttachments(files: File[]) {
  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new Error(
      `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`,
    )
  }

  for (const file of files) {
    if (file.size === 0) {
      throw new Error(`"${file.name}" is empty.`)
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error(`"${file.name}" is larger than 10 MB.`)
    }

    const isSupportedFile =
      supportedFileTypes.has(file.type) ||
      supportedFileExtensions.has(getFileExtension(file.name))

    if (!isSupportedFile) {
      throw new Error(
        `"${file.name}" is not a supported file type. Attach an image, PDF, text file, or Office document.`,
      )
    }
  }
}

export async function getMessageAttachments(
  messageIds: string[],
): Promise<MessageAttachmentWithUrl[]> {
  if (!messageIds.length) {
    return []
  }

  const { data: attachments, error } = await supabase
    .from('message_attachments')
    .select('*')
    .in('message_id', messageIds)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  if (!attachments.length) {
    return []
  }

  const { data: signedUrls, error: signedUrlError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrls(
      attachments.map((attachment) => attachment.file_path),
      SIGNED_URL_EXPIRY_SECONDS,
    )

  if (signedUrlError) {
    throw signedUrlError
  }

  const signedUrlsByPath = new Map(
    signedUrls.map((signedUrl) => [signedUrl.path, signedUrl.signedUrl]),
  )

  return attachments.map((attachment) => ({
    ...attachment,
    url: signedUrlsByPath.get(attachment.file_path) ?? null,
  }))
}

export async function uploadMessageAttachments(
  messageId: string,
  files: File[],
): Promise<MessageAttachment[]> {
  validateAttachments(files)

  const uploadedFiles: Array<{ file: File; filePath: string }> = []

  try {
    for (const file of files) {
      const filePath = getAttachmentPath(messageId, file)
      const { error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (error) {
        throw error
      }

      uploadedFiles.push({ file, filePath })
    }

    const attachmentRows: TablesInsert<'message_attachments'>[] =
      uploadedFiles.map(({ file, filePath }) => ({
        message_id: messageId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
      }))

    const { data, error } = await supabase
      .from('message_attachments')
      .insert(attachmentRows)
      .select()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    await removeUploadedFiles(uploadedFiles.map(({ filePath }) => filePath))

    throw new Error(
      `Your message was sent, but its attachment could not be uploaded. ${getErrorMessage(error, '')}`.trim(),
    )
  }
}
