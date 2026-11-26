export function relDay(t: number, now = Date.now()) {
  const d0 = new Date(now).setHours(0, 0, 0, 0)
  const diff = Math.round((d0 - new Date(t).setHours(0, 0, 0, 0)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return new Date(t).toLocaleDateString(undefined, { weekday: 'long' })
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: new Date(t).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' })
}
