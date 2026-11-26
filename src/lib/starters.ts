import type { RoutineItem } from './types'

const it = (exerciseId: string, sets: number, reps: number, rest = 90): RoutineItem => ({ exerciseId, sets, reps, rest })

/** Plain starter plans that load as normal, editable routines. Days: 0 = Monday. */
export const STARTERS: { name: string; blurb: string; routines: { name: string; days: number[]; items: RoutineItem[] }[] }[] = [
  {
    name: 'Full body, 3 days',
    blurb: 'Mon, Wed, Fri. Good for starting out.',
    routines: [
      { name: 'Full Body A', days: [0, 4], items: [it('back-squat', 3, 8, 120), it('bench-press', 3, 8, 120), it('barbell-row', 3, 10), it('lateral-raise', 3, 12, 60), it('plank', 3, 1, 60)] },
      { name: 'Full Body B', days: [2], items: [it('deadlift', 3, 5, 150), it('overhead-press', 3, 8, 120), it('lat-pulldown', 3, 10), it('walking-lunge', 3, 10), it('dumbbell-curl', 3, 12, 60)] },
    ],
  },
  {
    name: 'Upper / Lower, 4 days',
    blurb: 'Mon, Tue, Thu, Fri.',
    routines: [
      { name: 'Upper', days: [0, 3], items: [it('bench-press', 4, 8, 120), it('barbell-row', 4, 8, 120), it('seated-dumbbell-shoulder-press', 3, 10), it('lat-pulldown', 3, 10), it('triceps-pushdown', 3, 12, 60), it('dumbbell-curl', 3, 12, 60)] },
      { name: 'Lower', days: [1, 4], items: [it('back-squat', 4, 6, 150), it('romanian-deadlift', 3, 8, 120), it('leg-press', 3, 10), it('lying-leg-curl', 3, 12, 60), it('standing-calf-raise', 4, 12, 60)] },
    ],
  },
  {
    name: 'Push / Pull / Legs, 6 days',
    blurb: 'Each muscle twice a week. Sunday off.',
    routines: [
      { name: 'Push', days: [0, 3], items: [it('bench-press', 4, 8, 120), it('incline-dumbbell-press', 3, 10), it('overhead-press', 3, 8, 120), it('lateral-raise', 3, 15, 60), it('rope-pushdown', 3, 12, 60)] },
      { name: 'Pull', days: [1, 4], items: [it('deadlift', 3, 5, 150), it('pull-up', 3, 8, 120), it('seated-cable-row', 3, 10), it('face-pull', 3, 15, 60), it('hammer-curl', 3, 12, 60)] },
      { name: 'Legs', days: [2, 5], items: [it('back-squat', 4, 8, 150), it('romanian-deadlift', 3, 10, 120), it('leg-extension', 3, 12, 60), it('seated-leg-curl', 3, 12, 60), it('standing-calf-raise', 4, 12, 60)] },
    ],
  },
]
