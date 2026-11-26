import { useStore } from './store'

export function exportJSON(): string {
  const { routines, workouts, exercises, weights, settings } = useStore.getState()
  return JSON.stringify({ app: 'gweb', version: 1, exportedAt: new Date().toISOString(), routines, workouts, exercises, weights, settings }, null, 2)
}

export function downloadBackup() {
  const blob = new Blob([exportJSON()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `gweb-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function importFile(file: File) {
  const d = JSON.parse(await file.text())
  if (d?.app !== 'gweb') throw new Error("That file isn't a gWEB backup.")
  useStore.getState().replaceAll(d)
}
