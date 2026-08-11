import type { Tables } from '@/shared/types/database'

export type MessageAttachment = Tables<'message_attachments'>

export type MessageAttachmentWithUrl = MessageAttachment & {
  url: string | null
}
