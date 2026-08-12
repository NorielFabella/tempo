import { useRef } from 'react'

import { Button } from '@/shared/components/ui/Button'

import {
  ATTACHMENT_INPUT_ACCEPT,
  formatAttachmentSize,
} from '../services/attachments.service'

type AttachmentPickerProps = {
  attachments: File[]
  disabled: boolean
  error: string | null
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
}

export function AttachmentPicker({
  attachments,
  disabled,
  error,
  onAdd,
  onRemove,
}: AttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        multiple
        accept={ATTACHMENT_INPUT_ACCEPT}
        aria-label="Choose files to attach"
        onChange={(event) => {
          onAdd(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      <Button
        type="button"
        variant="secondary"
        className="px-3 py-2"
        aria-label="Attach files"
        disabled={disabled}
        onClick={() => {
          fileInputRef.current?.click()
        }}
      >
        Attach files
      </Button>

      {attachments.length > 0 && (
        <ul className="space-y-2" aria-label="Selected attachments">
          {attachments.map((attachment, index) => (
            <li
              key={`${attachment.name}-${attachment.lastModified}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {attachment.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatAttachmentSize(attachment.size)}
                </span>
              </span>

              <Button
                type="button"
                variant="ghost"
                className="shrink-0 px-2 py-1"
                aria-label={`Remove ${attachment.name}`}
                disabled={disabled}
                onClick={() => {
                  onRemove(index)
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
