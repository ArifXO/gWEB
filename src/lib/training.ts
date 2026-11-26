import type { Entry, SetLog, Workout } from './types'

/** Estimated one-rep max (Epley). */
export function e1rm(w: number, r: number): number {
  if (w <= 0 || r <= 0) return 0
  if (r === 1) return w
  return w * (1 + r / 30)
}

export const round = (n: number, step = 0.5) => Math.round(n / step) * step

export const setVolume = (s: SetLog) => (s.done ? s.w * s.r : 0)
export const entryVolume = (e: Entry) => e.sets.reduce((a, s) => a + setVolume(s), 0)
export const workoutVolume = (w: Workout) => w.entries.reduce((a, e) => a + entryVolume(e), 0)
export const doneSets = (w: Workout) => w.entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)
export const totalSets = (w: Workout) => w.entries.reduce((a, e) => a + e.sets.length, 0)

/** Finished, non-deleted workouts, newest first. */
export function finished(workouts: Record<string, Workout>): Workout[] {
  return Object.values(workouts)
    .filter((w) => !w.deleted && w.finishedAt)
    .sort((a, b) => b.startedAt - a.startedAt)
}

/** The sets logged for an exercise the last time it was done (before `before`). */
export function lastPerformance(history: Workout[], exerciseId: string, before = Infinity, excludeId?: string): { sets: SetLog[]; at: number } | null {
  for (const w of history) {
    if (w.id === excludeId || w.startedAt >= before) continue
    const e = w.entries.find((x) => x.exerciseId === exerciseId)
    const sets = e?.sets.filter((s) => s.done) ?? []
    if (sets.length) return { sets, at: w.startedAt }
  }
  return null
}

export interface Bests {
  e1rm: number
  weight: number
  volume: number // best single-set volume
}

export function bests(history: Workout[], exerciseId: string, excludeId?: string): Bests {
  const b: Bests = { e1rm: 0, weight: 0, volume: 0 }
  for (const w of history) {
    if (w.id === excludeId) continue
    for (const e of w.entries) {
      if (e.exerciseId !== exerciseId) continue
      for (const s of e.sets) {
        if (!s.done) continue
        b.e1rm = Math.max(b.e1rm, e1rm(s.w, s.r))
        b.weight = Math.max(b.weight, s.w)
        b.volume = Math.max(b.volume, s.w * s.r)
      }
    }
  }
  return b
}

/** Which records a set beats. Empty when there's no history to compare against. */
export function prsFor(s: SetLog, prev: Bests): string[] {
  if (!s.done || s.w <= 0 || s.r <= 0) return []
  if (prev.e1rm === 0 && prev.weight === 0) return []
  const out: string[] = []
  if (s.w > prev.weight) out.push('Heaviest')
  if (e1rm(s.w, s.r) > prev.e1rm + 0.01) out.push('Strongest set')
  if (s.w * s.r > prev.volume) out.push('Biggest set')
  return out
}

export interface Suggestion {
  weight: number
  reps: number
  note: string
  up: boolean
}

/**
 * Simple linear progression: if every set last time reached the target reps, add one step.
 * Otherwise repeat the weight.
 */
export function suggest(last: SetLog[] | null, targetReps: number, step: number): Suggestion | null {
  if (!last || last.length === 0) return null
  const top = Math.max(...last.map((s) => s.w))
  if (top <= 0) return { weight: 0, reps: targetReps, note: 'Same as last time.', up: false }
  const hitAll = last.every((s) => s.r >= targetReps)
  if (hitAll) return { weight: top + step, reps: targetReps, note: `Every rep last time. ${step} more.`, up: true }
  return { weight: top, reps: targetReps, note: 'Missed reps last time. Same weight.', up: false }
}

/** Monday-based start of the week, as a timestamp. */
export function weekStart(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.getTime()
}

/** Monday-based weekday index of a date: 0 = Monday. */
export const weekday = (t: number) => (new Date(t).getDay() + 6) % 7

export function weeklyVolume(history: Workout[], weeks: number, now = Date.now()): { week: number; volume: number; count: number }[] {
  const start = weekStart(now)
  const out = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() - 7 * (weeks - 1 - i))
    return { week: d.getTime(), volume: 0, count: 0 }
  })
  for (const w of history) {
    const ws = weekStart(w.startedAt)
    const slot = out.find((o) => o.week === ws)
    if (slot) {
      slot.volume += workoutVolume(w)
      slot.count++
    }
  }
  return out
}

/** Best estimated 1RM per workout for one exercise, oldest first. */
export function e1rmSeries(history: Workout[], exerciseId: string): { at: number; value: number }[] {
  const out: { at: number; value: number }[] = []
  for (const w of history) {
    let best = 0
    for (const e of w.entries) if (e.exerciseId === exerciseId) for (const s of e.sets) if (s.done) best = Math.max(best, e1rm(s.w, s.r))
    if (best > 0) out.push({ at: w.startedAt, value: best })
  }
  return out.sort((a, b) => a.at - b.at)
}

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

export const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''))
export const fmtBig = (n: number) => Math.round(n).toLocaleString('en-US')
