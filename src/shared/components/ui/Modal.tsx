import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl border bg-background shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
          <h2 id="modal-title" className="text-base font-semibold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
