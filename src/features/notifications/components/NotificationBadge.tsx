type NotificationBadgeProps = {
  count: number
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count < 1) {
    return null
  }

  return (
    <span
      aria-label={`${count} unread ${count === 1 ? 'notification' : 'notifications'}`}
      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-slate-950"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
