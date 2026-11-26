import type { Muscle } from './catalogue'

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

/** Sets per muscle (helpers counted at a fraction). */
export function muscleLoad(list: { muscle: Muscle; sets: number }[]): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {}
  for (const { muscle, sets } of list) {
    if (muscle !== 'Full body' && muscle !== 'Cardio') out[muscle] = (out[muscle] ?? 0) + sets
    for (const [m, f] of Object.entries(HELPERS[muscle] ?? {})) out[m as Muscle] = (out[m as Muscle] ?? 0) + sets * f!
  }
  return out
}
