import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomExercise, Kind, Meta, Routine, Settings, Workout } from './types'
import { uid } from './types'

export interface RemoteRow {
  kind: Kind
  id: string
  data: unknown
  updated_at: number
  deleted: boolean
  server_ts?: string
}

type Coll<T> = Record<string, T>

interface Data {
  owner: string | null // user id the local data belongs to; null = not signed in yet
  routines: Coll<Routine>
  workouts: Coll<Workout>
  exercises: Coll<CustomExercise>
  settings: Settings
  active: Workout | null // the workout in progress (kept on this device until finished)
  dirty: Record<string, number> // "kind:id" -> updatedAt that still needs pushing
  lastPull: string | null
}

interface Actions {
  saveRoutine: (r: Omit<Routine, 'updatedAt'>) => void
  deleteRoutine: (id: string) => void
  saveWorkout: (w: Workout) => void
  deleteWorkout: (id: string) => void
  saveExercise: (e: Omit<CustomExercise, 'updatedAt'>) => void
  setSettings: (p: Partial<Omit<Settings, keyof Meta>>) => void
  setActive: (w: Workout | null) => void
  finishActive: () => void
  // sync plumbing
  claim: (userId: string) => void
  applyRemote: (rows: RemoteRow[], lastPull: string | null) => void
  markPushed: (sent: Record<string, number>) => void
  replaceAll: (d: Pick<Data, 'routines' | 'workouts' | 'exercises' | 'settings'>) => void
  resetLocal: () => void
}

const defaultSettings = (): Settings => ({ id: 'settings', updatedAt: 0, unit: 'kg', defaultRest: 90 })

const empty = (): Data => ({
  owner: null,
  routines: {},
  workouts: {},
  exercises: {},
  settings: defaultSettings(),
  active: null,
  dirty: {},
  lastPull: null,
})

const collFor = { routine: 'routines', workout: 'workouts', exercise: 'exercises' } as const

/** Monotonic edit clock, so two edits in the same millisecond still order correctly. */
let lastStamp = 0
const stamp = () => (lastStamp = Math.max(Date.now(), lastStamp + 1))

export const useStore = create<Data & Actions>()(
  persist(
    (set) => ({
      ...empty(),

      saveRoutine: (r) =>
        set((s) => {
          const t = stamp()
          return { routines: { ...s.routines, [r.id]: { ...r, updatedAt: t } }, dirty: { ...s.dirty, [`routine:${r.id}`]: t } }
        }),
      deleteRoutine: (id) =>
        set((s) => {
          const r = s.routines[id]
          if (!r) return {}
          const t = stamp()
          return { routines: { ...s.routines, [id]: { ...r, deleted: true, updatedAt: t } }, dirty: { ...s.dirty, [`routine:${id}`]: t } }
        }),
      saveWorkout: (w) =>
        set((s) => {
          const t = stamp()
          return { workouts: { ...s.workouts, [w.id]: { ...w, updatedAt: t } }, dirty: { ...s.dirty, [`workout:${w.id}`]: t } }
        }),
      deleteWorkout: (id) =>
        set((s) => {
          const w = s.workouts[id]
          if (!w) return {}
          const t = stamp()
          return { workouts: { ...s.workouts, [id]: { ...w, deleted: true, updatedAt: t } }, dirty: { ...s.dirty, [`workout:${id}`]: t } }
        }),
      saveExercise: (e) =>
        set((s) => {
          const t = stamp()
          return { exercises: { ...s.exercises, [e.id]: { ...e, custom: true, updatedAt: t } }, dirty: { ...s.dirty, [`exercise:${e.id}`]: t } }
        }),
      setSettings: (p) =>
        set((s) => {
          const t = stamp()
          return { settings: { ...s.settings, ...p, updatedAt: t }, dirty: { ...s.dirty, 'settings:settings': t } }
        }),
      setActive: (w) => set({ active: w }),
      finishActive: () =>
        set((s) => {
          if (!s.active) return {}
          const t = stamp()
          const w: Workout = {
            ...s.active,
            finishedAt: Date.now(),
            // drop sets that were never ticked, and exercises left empty
            entries: s.active.entries.map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) })).filter((e) => e.sets.length),
            updatedAt: t,
          }
          return { active: null, workouts: { ...s.workouts, [w.id]: w }, dirty: { ...s.dirty, [`workout:${w.id}`]: t } }
        }),

      claim: (userId) =>
        set((s) => {
          if (s.owner === userId) return {}
          if (s.owner === null) {
            // Data made before signing in moves into this account: mark all of it for upload.
            const dirty: Record<string, number> = { ...s.dirty }
            for (const r of Object.values(s.routines)) dirty[`routine:${r.id}`] = r.updatedAt
            for (const w of Object.values(s.workouts)) dirty[`workout:${w.id}`] = w.updatedAt
            for (const e of Object.values(s.exercises)) dirty[`exercise:${e.id}`] = e.updatedAt
            if (s.settings.updatedAt) dirty['settings:settings'] = s.settings.updatedAt
            return { owner: userId, dirty, lastPull: null }
          }
          // A different account on this device: start clean, the server has their data.
          return { ...empty(), owner: userId }
        }),

      applyRemote: (rows, lastPull) =>
        set((s) => {
          const next: Partial<Data> = { lastPull: lastPull ?? s.lastPull }
          const colls = { routines: { ...s.routines }, workouts: { ...s.workouts }, exercises: { ...s.exercises } }
          let settings = s.settings
          for (const row of rows) {
            const rec = { ...(row.data as Meta), id: row.id, updatedAt: Number(row.updated_at), deleted: row.deleted || undefined }
            if (row.kind === 'settings') {
              if (rec.updatedAt > settings.updatedAt) settings = { ...defaultSettings(), ...(rec as Settings) }
              continue
            }
            const key = collFor[row.kind as keyof typeof collFor]
            if (!key) continue
            const c = colls[key] as Coll<Meta>
            const local = c[row.id]
            if (!local || rec.updatedAt > local.updatedAt) c[row.id] = rec
          }
          return { ...next, ...colls, settings }
        }),

      markPushed: (sent) =>
        set((s) => {
          const dirty = { ...s.dirty }
          // Only clear entries that weren't edited again while the push was in flight.
          for (const [k, t] of Object.entries(sent)) if (dirty[k] === t) delete dirty[k]
          return { dirty }
        }),

      replaceAll: (d) =>
        set((s) => {
          const t = stamp()
          const dirty: Record<string, number> = { ...s.dirty }
          const bump = <T extends Meta>(c: Coll<T>, kind: Kind) =>
            Object.fromEntries(
              Object.values(c).map((x) => {
                dirty[`${kind}:${x.id}`] = t
                return [x.id, { ...x, updatedAt: t }]
              }),
            )
          dirty['settings:settings'] = t
          return {
            routines: { ...s.routines, ...bump(d.routines ?? {}, 'routine') },
            workouts: { ...s.workouts, ...bump(d.workouts ?? {}, 'workout') },
            exercises: { ...s.exercises, ...bump(d.exercises ?? {}, 'exercise') },
            settings: { ...defaultSettings(), ...d.settings, id: 'settings', updatedAt: t },
            dirty,
          }
        }),

      resetLocal: () => set(empty()),
    }),
    { name: 'gweb-data', version: 1 },
  ),
)

/** Snapshot of a record for upload. */
export function recordFor(kind: Kind, id: string): Meta | undefined {
  const s = useStore.getState()
  if (kind === 'settings') return s.settings
  return (s[collFor[kind]] as Coll<Meta>)[id]
}

export { uid }
