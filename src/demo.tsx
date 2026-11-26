// Demo entry: no login, sample data on first open, in-memory routing (for previews and sharing).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { STARTERS } from './lib/starters'
import { useStore } from './lib/store'
import { uid, type Workout } from './lib/types'
import './index.css'

function seed() {
  const s = useStore.getState()
  if (Object.keys(s.routines).length || Object.keys(s.workouts).length) return
  const ppl = STARTERS[2]
  const ids: Record<string, string> = {}
  for (const r of ppl.routines) {
    const id = uid()
    ids[r.name] = id
    s.saveRoutine({ id, ...r })
  }
  const base: Record<string, number> = { 'bench-press': 60, 'incline-dumbbell-press': 22, 'overhead-press': 40, 'lateral-raise': 8, 'rope-pushdown': 25, deadlift: 100, 'pull-up': 0, 'seated-cable-row': 50, 'face-pull': 20, 'hammer-curl': 14, 'back-squat': 80, 'romanian-deadlift': 70, 'leg-extension': 40, 'seated-leg-curl': 35, 'standing-calf-raise': 60 }
  const now = new Date()
  now.setHours(18, 0, 0, 0)
  for (let back = 27; back >= 1; back--) {
    const d = new Date(now)
    d.setDate(d.getDate() - back)
    const wd = (d.getDay() + 6) % 7
    if (wd === 6 || back % 9 === 4) continue
    const r = ppl.routines.find((x) => x.days.includes(wd))!
    const step = Math.floor((27 - back) / 7)
    const t = d.getTime() + ((back * 7) % 40 - 20) * 60000
    const w: Workout = {
      id: `demo-${back}`,
      name: r.name,
      routineId: ids[r.name],
      startedAt: t,
      finishedAt: t + (52 + ((back * 5) % 15)) * 60000,
      updatedAt: 0,
      entries: r.items.map((it) => {
        const wt = base[it.exerciseId] ? Math.round((base[it.exerciseId] * (1 + 0.04 * step)) / 2.5) * 2.5 : 0
        return { exerciseId: it.exerciseId, rest: it.rest, targetReps: it.reps, sets: Array.from({ length: it.sets }, (_, i) => ({ w: wt, r: Math.max(1, it.reps - (i === it.sets - 1 && back % 3 === 0 ? 2 : 0)), done: true })) }
      }),
    }
    s.saveWorkout(w)
  }
}

seed()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </StrictMode>,
)
