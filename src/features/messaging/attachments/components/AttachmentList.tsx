import {
  formatAttachmentSize,
  isImageAttachment,
} from '../services/attachments.service'
import type { MessageAttachmentWithUrl } from '../types/attachment'

type AttachmentListProps = {
  attachments: MessageAttachmentWithUrl[]
  isOwnMessage: boolean
}

function getFileTypeLabel(fileType: string, fileName: string) {
  const extension = fileName.includes('.')
    ? fileName.split('.').pop()?.toUpperCase()
    : null

  if (extension) {
    return extension
  }

  if (fileType.includes('/')) {
    return fileType.split('/')[1].toUpperCase()
  }

  return 'FILE'
}

export function AttachmentList({
  attachments,
  isOwnMessage,
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
            <div
              key={attachment.id}
              className={`rounded-lg border border-current/20 px-3 py-2 text-sm ${attachmentTextColor}`}
            >
              <p className="truncate font-medium">{attachment.file_name}</p>
              <p className="mt-0.5 text-xs">
                This attachment is temporarily unavailable.
              </p>
            </div>
          )
        }

        if (isImage) {
          return (
            <div key={attachment.id} className="overflow-hidden rounded-lg">
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-lg border border-black/10 bg-black/5"
                aria-label={`Open ${attachment.file_name}`}
              >
                <img
                  src={attachment.url}
                  alt={attachment.file_name}
                  className="max-h-80 max-w-full object-contain transition group-hover:opacity-90"
                  loading="lazy"
                />
              </a>

              <div
                className={`mt-1 flex min-w-0 items-center justify-between gap-2 text-xs ${attachmentTextColor}`}
              >
                <span className="min-w-0 truncate">{attachment.file_name}</span>
                <span className="shrink-0">
                  {formatAttachmentSize(attachment.file_size)}
                </span>
              </div>
            </div>
          )
        }

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-3 rounded-lg border border-current/20 bg-black/5 px-3 py-2.5 text-sm transition hover:bg-black/10"
          >
            <span
              aria-hidden="true"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-current/10 bg-black/5 text-[10px] font-bold ${attachmentTextColor}`}
            >
              {getFileTypeLabel(attachment.file_type, attachment.file_name)}
            </span>

            <span className="min-w-0 flex-1">
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
