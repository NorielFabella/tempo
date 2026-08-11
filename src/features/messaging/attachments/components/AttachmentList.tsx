import {
  formatAttachmentSize,
  isImageAttachment,
} from '../services/attachments.service'
import type { MessageAttachmentWithUrl } from '../types/attachment'

type AttachmentListProps = {
  attachments: MessageAttachmentWithUrl[]
  isOwnMessage: boolean
  onImageLoad?: () => void
}

export function AttachmentList({
  attachments,
  isOwnMessage,
  onImageLoad,
}: AttachmentListProps) {
  if (!attachments.length) {
    return null
  }

  const attachmentTextColor = isOwnMessage
    ? 'text-blue-100'
    : 'text-muted-foreground'

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment) => {
        const isImage = isImageAttachment(attachment)

        if (!attachment.url) {
          return (
            <p key={attachment.id} className={`text-sm ${attachmentTextColor}`}>
              {attachment.file_name} is temporarily unavailable.
            </p>
          )
        }

        if (isImage) {
          return (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border border-black/10 bg-black/5"
            >
              <img
                src={attachment.url}
                alt={attachment.file_name}
                className="max-h-80 w-full object-cover"
                loading="lazy"
                onLoad={onImageLoad}
              />
            </a>
          )
        }

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-lg border border-current/20 bg-black/5 px-3 py-2 text-sm hover:bg-black/10"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {attachment.file_name}
              </span>
              <span className={`text-xs ${attachmentTextColor}`}>
                {formatAttachmentSize(attachment.file_size)}
              </span>
            </span>
            <span className="shrink-0 font-medium">Open</span>
          </a>
        )
      })}
    </div>
  )
}
