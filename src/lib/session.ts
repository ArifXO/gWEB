import type { Exercise } from './catalogue'
import { stepFor } from './exercises'
import { useStore } from './store'
import { finished, lastPerformance, suggest } from './training'
import { uid, type Entry, type Routine, type Workout } from './types'

/** A fresh entry for an exercise, pre-filled from the last time it was done. */
export function makeEntry(ex: Exercise, plan?: { sets: number; reps: number; rest: number }): Entry {
  const s = useStore.getState()
  const hist = finished(s.workouts)
  const last = lastPerformance(hist, ex.id)
  const reps = plan?.reps ?? last?.sets[0]?.r ?? 10
  const count = plan?.sets ?? last?.sets.length ?? 3
  const sug = suggest(last?.sets ?? null, reps, stepFor(s.settings.unit, ex))
  const w = sug?.weight ?? 0
  return {
    exerciseId: ex.id,
    rest: plan?.rest ?? s.settings.defaultRest,
    targetReps: plan?.reps,
    sets: Array.from({ length: count }, () => ({ w, r: reps, done: false })),
  }
}

export function startWorkout(get: (id: string) => Exercise, routine?: Routine): Workout {
  const w: Workout = {
    id: uid(),
    name: routine?.name ?? 'Workout',
    routineId: routine?.id,
    startedAt: Date.now(),
    updatedAt: 0,
    entries: routine ? routine.items.map((it) => makeEntry(get(it.exerciseId), it)) : [],
  }
  useStore.getState().setActive(w)
  return w
}

/** The routine planned for a given Monday-based weekday, if any. */
export function routineForDay(routines: Record<string, Routine>, day: number): Routine | undefined {
  return Object.values(routines)
    .filter((r) => !r.deleted && r.days.includes(day))
    .sort((a, b) => a.name.localeCompare(b.name))[0]
}
