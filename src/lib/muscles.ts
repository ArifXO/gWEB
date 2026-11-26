import type { Exercise, Muscle } from './catalogue'

/** How much a muscle gets worked when an exercise targets another one (rough, for the body map only). */
const HELPERS: Partial<Record<Muscle, Partial<Record<Muscle, number>>>> = {
  Chest: { Triceps: 0.5, Shoulders: 0.4 },
  Back: { Biceps: 0.5, Forearms: 0.3 },
  Shoulders: { Triceps: 0.4 },
  Quads: { Glutes: 0.5 },
  Hamstrings: { Glutes: 0.5 },
  Glutes: { Hamstrings: 0.5 },
  'Full body': { Quads: 0.7, Glutes: 0.7, Back: 0.7, Shoulders: 0.6, Hamstrings: 0.5, Core: 0.5 },
}

/** Sets per muscle. Helping muscles count at a fraction. */
export function muscleLoad(list: { ex: Exercise; sets: number }[]): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {}
  const add = (m: Muscle, v: number) => {
    if (m !== 'Full body' && m !== 'Cardio') out[m] = (out[m] ?? 0) + v
  }
  for (const { ex, sets } of list) {
    add(ex.muscle, sets)
    const helpers: Partial<Record<Muscle, number>> = ex.secondary?.length ? Object.fromEntries(ex.secondary.map((m) => [m, 0.4])) : HELPERS[ex.muscle] ?? {}
    if (ex.muscle === 'Full body') Object.assign(helpers, HELPERS['Full body'])
    for (const [m, f] of Object.entries(helpers)) add(m as Muscle, sets * f!)
  }
  return out
}
