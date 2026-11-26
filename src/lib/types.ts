import type { Exercise } from './catalogue'

/** Every synced record carries these: newest updatedAt wins, deletions are kept as tombstones. */
export interface Meta {
  id: string
  updatedAt: number
  deleted?: boolean
}

export interface RoutineItem {
  exerciseId: string
  sets: number
  reps: number
  rest: number // seconds
}

export interface Routine extends Meta {
  name: string
  days: number[] // 0 = Monday ... 6 = Sunday
  items: RoutineItem[]
}

export interface SetLog {
  w: number
  r: number
  done: boolean
}

export interface Entry {
  exerciseId: string
  sets: SetLog[]
  rest: number
  targetReps?: number
}

export interface Workout extends Meta {
  name: string
  routineId?: string
  startedAt: number
  finishedAt?: number
  entries: Entry[]
  note?: string
}

export type CustomExercise = Exercise & Meta

export interface Settings extends Meta {
  unit: 'kg' | 'lb'
  defaultRest: number
}

export type Kind = 'routine' | 'workout' | 'exercise' | 'settings'

export const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)
