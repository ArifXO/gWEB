import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BodyMap } from '../components/BodyMap'
import { IChevronRight, IPlay, ISettings } from '../components/icons'
import { Button, Card, Sheet } from '../components/ui'
import { useNow } from '../components/useNow'
import { useExercises } from '../lib/exercises'
import { muscleLoad } from '../lib/muscles'
import { routineForDay, startWorkout } from '../lib/session'
import { useStore } from '../lib/store'
import { doneSets, finished, fmtBig, fmtDuration, weekStart, weekday, workoutVolume } from '../lib/training'
import type { Routine } from '../lib/types'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Home() {
  const routines = useStore((s) => s.routines)
  const workouts = useStore((s) => s.workouts)
  const active = useStore((s) => s.active)
  const unit = useStore((s) => s.settings.unit)
  const { get } = useExercises()
  const nav = useNavigate()
  const now = useNow(30_000)
  const [choose, setChoose] = useState(false)

  const list = useMemo(() => Object.values(routines).filter((r) => !r.deleted).sort((a, b) => a.name.localeCompare(b.name)), [routines])
  const hist = useMemo(() => finished(workouts), [workouts])
  const today = weekday(now)
  const ws = weekStart(now)
  const trainedToday = hist.some((w) => w.startedAt >= new Date(now).setHours(0, 0, 0, 0))
  const planned = routineForDay(routines, today)
  const next = useMemo(() => {
    for (let d = 1; d <= 7; d++) {
      const r = routineForDay(routines, (today + d) % 7)
      if (r) return { r, d }
    }
    return null
  }, [routines, today])

  const start = (r?: Routine) => {
    if (active) return nav('/workout')
    startWorkout(get, r)
    nav('/workout')
  }

  const week = DAYS.map((label, i) => {
    const t = ws + i * 86400000
    const date = new Date(t)
    const did = hist.some((w) => w.startedAt >= t && w.startedAt < t + 86400000)
    const plan = !!routineForDay(routines, i)
    return { label, day: date.getDate(), did, plan, isToday: i === today }
  })
  const thisWeek = hist.filter((w) => w.startedAt >= ws).length
  const plannedCount = week.filter((d) => d.plan).length
  const last = hist[0]

  return (
    <div className="pt-safe mx-auto max-w-[560px] px-4 pb-28">
      <header className="flex items-start justify-between pt-5">
        <div>
          <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-mute">
            {new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{greeting(now)}</h1>
        </div>
        <Link to="/settings" aria-label="Settings" className="-mr-2 grid size-11 place-items-center rounded-full text-mute active:bg-raised">
          <ISettings />
        </Link>
      </header>

      {active && (
        <button onClick={() => nav('/workout')} className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-accent px-4 py-3.5 text-left text-accent-ink">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-ink/50" />
            <span className="relative inline-flex size-2.5 rounded-full bg-accent-ink" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{active.name} in progress</span>
            <span className="num text-[13px] opacity-80">{fmtDuration(Date.now() - active.startedAt)} · {doneSets(active)} sets done</span>
          </span>
          <span className="font-semibold">Resume</span>
        </button>
      )}

      {/* This week */}
      <section className="mt-6" aria-label="This week">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-mute">This week</h2>
          <span className="text-[13px] text-mute">
            <span className="num text-ink">{thisWeek}</span>
            {plannedCount ? ` of ${plannedCount}` : ''} workouts
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1.5">
          {week.map((d, i) => (
            <li key={i} className={`flex flex-col items-center gap-1.5 rounded-xl py-2.5 ${d.isToday ? 'bg-raised' : ''}`}>
              <span className={`text-[12px] ${d.isToday ? 'text-ink' : 'text-faint'}`}>{d.label}</span>
              <span className={`num text-[15px] ${d.isToday ? 'font-semibold' : 'text-mute'}`}>{d.day}</span>
              <span
                aria-label={d.did ? 'trained' : d.plan ? 'planned' : 'rest'}
                className={`size-1.5 rounded-full ${d.did ? 'bg-accent' : d.plan ? 'border border-faint' : 'bg-transparent'}`}
              />
            </li>
          ))}
        </ol>
      </section>

      {/* Today */}
      <section className="mt-6" aria-label="Today">
        {list.length === 0 ? (
          <Card className="p-5">
            <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Get started</div>
            <div className="mt-1.5 text-[20px] font-semibold tracking-tight">Set up your week</div>
            <p className="mt-1 text-[15px] text-mute">Make a routine for the days you train, or pick a ready-made plan.</p>
            <div className="mt-4 flex gap-2">
              <Button kind="primary" className="flex-1" onClick={() => nav('/plan')}>Plan my week</Button>
              <Button className="flex-1" onClick={() => start()}>Log a workout</Button>
            </div>
          </Card>
        ) : planned && !trainedToday ? (
          <TodayCard routine={planned} onStart={() => start(planned)} />
        ) : (
          <Card className="p-5">
            <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Today</div>
            <div className="mt-1.5 text-[20px] font-semibold tracking-tight">{trainedToday ? 'Done for today. Nice work.' : 'Rest day'}</div>
            {next && (
              <p className="mt-1 text-[15px] text-mute">
                Next up: <span className="text-ink">{next.r.name}</span> {next.d === 1 ? 'tomorrow' : `on ${new Date(now + next.d * 86400000).toLocaleDateString(undefined, { weekday: 'long' })}`}.
              </p>
            )}
          </Card>
        )}
        {list.length > 0 && (
          <button onClick={() => setChoose(true)} className="mt-2 flex h-12 w-full items-center justify-center text-[15px] text-mute active:text-ink">
            {planned && !trainedToday ? 'Do a different workout' : 'Start a workout anyway'}
          </button>
        )}
      </section>

      {last && (
        <section className="mt-4" aria-label="Last workout">
          <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Last workout</h2>
          <Link to={`/history/${last.id}`}>
            <Card className="flex items-center gap-3 p-4 active:bg-raised">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-medium">{last.name}</div>
                <div className="mt-0.5 text-[13px] text-mute">
                  {relDay(last.startedAt, now)} · <span className="num">{fmtDuration((last.finishedAt ?? last.startedAt) - last.startedAt)}</span> ·{' '}
                  <span className="num">{fmtBig(workoutVolume(last))}</span> {unit} lifted
                </div>
              </div>
              <IChevronRight className="text-faint" />
            </Card>
          </Link>
        </section>
      )}

      <Sheet open={choose} onClose={() => setChoose(false)} title="Start a workout">
        <div className="flex flex-col">
          {list.map((r) => (
            <button key={r.id} onClick={() => (setChoose(false), start(r))} className="flex items-center gap-3 border-b border-line/50 py-3.5 text-left">
              <div className="flex-1">
                <div className="text-[16px]">{r.name}</div>
                <div className="text-[13px] text-mute">{r.items.length} exercises</div>
              </div>
              <IPlay size={18} className="text-accent" />
            </button>
          ))}
          <button onClick={() => (setChoose(false), start())} className="flex items-center gap-3 py-3.5 text-left">
            <div className="flex-1">
              <div className="text-[16px]">Empty workout</div>
              <div className="text-[13px] text-mute">Add exercises as you go</div>
            </div>
            <IPlay size={18} className="text-mute" />
          </button>
        </div>
      </Sheet>
    </div>
  )
}

function TodayCard({ routine, onStart }: { routine: Routine; onStart: () => void }) {
  const { get } = useExercises()
  const load = muscleLoad(routine.items.map((i) => ({ muscle: get(i.exerciseId).muscle, sets: i.sets })))
  const sets = routine.items.reduce((a, i) => a + i.sets, 0)
  const mins = Math.round(routine.items.reduce((a, i) => a + i.sets * (i.rest + 40), 0) / 60 / 5) * 5
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-5 pb-4">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">Today</div>
          <div className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight">{routine.name}</div>
          <div className="mt-1 text-[14px] text-mute">
            {routine.items.length} exercises · {sets} sets{mins ? ` · about ${mins} min` : ''}
          </div>
          <ul className="mt-3 space-y-1 text-[14px] text-ink/85">
            {routine.items.slice(0, 4).map((it, i) => (
              <li key={i} className="truncate">
                <span className="num text-mute">{it.sets}×{it.reps}</span>&nbsp; {get(it.exerciseId).name}
              </li>
            ))}
            {routine.items.length > 4 && <li className="text-mute">+{routine.items.length - 4} more</li>}
          </ul>
        </div>
        <BodyMap load={load} full={4} size={110} />
      </div>
      <div className="px-5 pb-5">
        <Button kind="primary" className="min-h-14 w-full text-[17px]" onClick={onStart}>
          <IPlay size={18} /> Start workout
        </Button>
      </div>
    </Card>
  )
}

function greeting(t: number) {
  const h = new Date(t).getHours()
  return h < 5 ? 'Late session?' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function relDay(t: number, now = Date.now()) {
  const d0 = new Date(now).setHours(0, 0, 0, 0)
  const diff = Math.round((d0 - new Date(t).setHours(0, 0, 0, 0)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return new Date(t).toLocaleDateString(undefined, { weekday: 'long' })
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: new Date(t).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' })
}
