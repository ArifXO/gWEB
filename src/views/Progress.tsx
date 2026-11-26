import { useMemo, useState } from 'react'
import { BodyMap } from '../components/BodyMap'
import { Button, Card, Empty, Header, NumberField, Sheet } from '../components/ui'
import { ExerciseInfo, LineChart } from '../components/ExerciseInfo'
import { IChevronRight } from '../components/icons'
import { summarize } from '../components/ExerciseBlock'
import { useExercises } from '../lib/exercises'
import { muscleLoad } from '../lib/muscles'
import { useStore } from '../lib/store'
import { e1rm, finished, fmtBig, fmtNum, weekStart, weeklyVolume } from '../lib/training'
import type { SetLog, Workout } from '../lib/types'
import { IPlus } from '../components/icons'
import type { Muscle } from '../lib/catalogue'
import { relDay } from '../lib/dates'

export default function Progress() {
  const workouts = useStore((s) => s.workouts)
  const unit = useStore((s) => s.settings.unit)
  const { get } = useExercises()
  const hist = useMemo(() => finished(workouts), [workouts])
  const [open, setOpen] = useState<string | null>(null)

  const weeks = useMemo(() => weeklyVolume(hist, 8), [hist])
  const thisWeek = useMemo(() => hist.filter((w) => w.startedAt >= weekStart(Date.now())), [hist])
  const load = useMemo(() => muscleLoad(thisWeek.flatMap((w) => w.entries.map((e) => ({ ex: get(e.exerciseId), sets: e.sets.length })))), [thisWeek, get])
  const untrained = (['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Biceps', 'Triceps'] as Muscle[]).filter((m) => !(load[m] && load[m]! >= 1))

  const lifts = useMemo(() => {
    const m = new Map<string, { id: string; best: SetLog; count: number; lastAt: number }>()
    for (const w of hist)
      for (const e of w.entries)
        for (const s of e.sets) {
          const cur = m.get(e.exerciseId)
          if (!cur) m.set(e.exerciseId, { id: e.exerciseId, best: s, count: 1, lastAt: w.startedAt })
          else {
            if (e1rm(s.w, s.r) > e1rm(cur.best.w, cur.best.r)) cur.best = s
            cur.count++
          }
        }
    return [...m.values()].sort((a, b) => b.lastAt - a.lastAt)
  }, [hist])

  const total = hist.reduce((a, w) => a + w.entries.reduce((b, e) => b + e.sets.reduce((c, s) => c + s.w * s.r, 0), 0), 0)
  const streak = useMemo(() => weekStreak(hist), [hist])

  if (!hist.length)
    return (
      <div className="mx-auto max-w-[560px] pb-28">
        <Header title="Progress" />
        <Empty title="Nothing to show yet">Finish a workout and your progress will build up here.</Empty>
        <div className="px-4"><BodyWeight /></div>
      </div>
    )

  const maxVol = Math.max(1, ...weeks.map((w) => w.volume))

  return (
    <div className="mx-auto max-w-[560px] pb-28">
      <Header title="Progress" />
      <div className="flex flex-col gap-3 px-4 pt-2">
        <div className="grid grid-cols-3 gap-2">
          <Tile value={String(hist.length)} label="Workouts" />
          <Tile value={`${streak}`} label={streak === 1 ? 'Week in a row' : 'Weeks in a row'} />
          <Tile value={total >= 10000 ? `${fmtNum(Math.round(total / 100) / 10)}k` : fmtBig(total)} label={`${unit} lifted`} />
        </div>

        <Card className="p-4">
          <h2 className="text-[15px] font-semibold">This week</h2>
          <div className="mt-3 flex items-center gap-5">
            <BodyMap load={load} full={10} size={150} showLabels />
            <div className="min-w-0 flex-1 text-[14px]">
              {thisWeek.length === 0 ? (
                <p className="text-mute">No workouts yet this week.</p>
              ) : (
                <>
                  <p className="text-mute">Brighter means more sets.</p>
                  {untrained.length > 0 && (
                    <p className="mt-2">
                      <span className="text-mute">Not trained yet:</span> {untrained.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">Weight lifted per week</h2>
            <span className="text-[12px] text-mute">last 8 weeks</span>
          </div>
          <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label="Weekly total weight lifted">
            {weeks.map((w, i) => (
              <div key={w.week} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="num text-[10px] text-mute">{w.volume ? `${fmtNum(Math.round(w.volume / 100) / 10)}k` : ''}</div>
                <div className={`w-full rounded-md ${i === weeks.length - 1 ? 'bg-accent' : 'bg-ink/25'}`} style={{ height: `${Math.max(w.volume ? 4 : 2, (w.volume / maxVol) * 100)}%` }} />
                <div className="text-[10px] text-faint">{new Date(w.week).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' })}</div>
              </div>
            ))}
          </div>
        </Card>

        <Calendar hist={hist} />
        <BodyWeight />

        <section className="mt-3">
          <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Your lifts</h2>
          <ul className="overflow-hidden rounded-2xl border border-line/60 bg-surface">
            {lifts.map((l) => (
              <li key={l.id} className="border-b border-line/50 last:border-b-0">
                <button onClick={() => setOpen(l.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-raised">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px]">{get(l.id).name}</div>
                    <div className="text-[12px] text-mute">Last done: {relDay(l.lastAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[15px]">{summarize([l.best], unit)}</div>
                    <div className="text-[11px] text-faint">best set</div>
                  </div>
                  <IChevronRight size={18} className="text-faint" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ExerciseInfo id={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface px-3 py-3">
      <div className="num text-[22px] font-semibold">{value}</div>
      <div className="mt-0.5 text-[12px] leading-tight text-mute">{label}</div>
    </div>
  )
}

/** Weeks in a row (ending this week or last) with at least one workout. */
function weekStreak(hist: Workout[]): number {
  const weeks = new Set(hist.map((w) => weekStart(w.startedAt)))
  let cur = weekStart(Date.now())
  if (!weeks.has(cur)) cur = weekStart(cur - 86400000)
  let n = 0
  while (weeks.has(cur)) {
    n++
    cur = weekStart(cur - 86400000)
  }
  return n
}

/** The last 18 weeks as a grid of days: a filled square for every day you trained. */
function Calendar({ hist }: { hist: Workout[] }) {
  const weeks = 18
  const days = new Set(hist.map((w) => new Date(w.startedAt).setHours(0, 0, 0, 0)))
  const start = weekStart(Date.now()) - (weeks - 1) * 7 * 86400000
  const today = new Date().setHours(0, 0, 0, 0)
  const cols = Array.from({ length: weeks }, (_, c) =>
    Array.from({ length: 7 }, (_, r) => {
      const d = new Date(start)
      d.setDate(d.getDate() + c * 7 + r)
      const t = d.getTime()
      return { t, on: days.has(t), future: t > today }
    }),
  )
  const count = hist.filter((w) => w.startedAt >= start).length
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">Training days</h2>
        <span className="text-[12px] text-mute">{count} in 18 weeks</span>
      </div>
      <div className="mt-3 flex gap-[3px]" role="img" aria-label={`${count} workouts in the last 18 weeks`}>
        {cols.map((col, i) => (
          <div key={i} className="flex flex-1 flex-col gap-[3px]">
            {col.map((d) => (
              <div key={d.t} className={`aspect-square w-full rounded-[3px] ${d.future ? 'bg-transparent' : d.on ? 'bg-accent' : 'bg-raised'}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-faint">
        <span>{new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        <span>Today</span>
      </div>
    </Card>
  )
}

const dayKey = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function BodyWeight() {
  const weights = useStore((s) => s.weights)
  const unit = useStore((s) => s.settings.unit)
  const logWeight = useStore((s) => s.logWeight)
  const deleteWeight = useStore((s) => s.deleteWeight)
  const list = useMemo(() => Object.values(weights ?? {}).filter((x) => !x.deleted).sort((a, b) => a.id.localeCompare(b.id)), [weights])
  const last = list[list.length - 1]
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(0)
  const monthAgo = list.find((x) => x.id >= dayKey(Date.now() - 30 * 86400000))
  const change = last && monthAgo && monthAgo !== last ? last.w - monthAgo.w : null
  const pts = list.slice(-30).map((x) => ({ at: new Date(x.id).getTime(), v: x.w }))

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Body weight</h2>
          {last ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-[24px] font-semibold">{fmtNum(last.w)}</span>
              <span className="text-[13px] text-mute">{unit}</span>
              {change !== null && (
                <span className="num text-[13px] text-mute">
                  {change > 0 ? '+' : ''}{fmtNum(Math.round(change * 10) / 10)} in 30 days
                </span>
              )}
            </div>
          ) : (
            <p className="mt-1 text-[14px] text-mute">Log your weight now and then to see the trend.</p>
          )}
        </div>
        <Button className="min-h-10 shrink-0 px-3 text-[14px]" onClick={() => (setVal(last?.w ?? 70), setOpen(true))}>
          <IPlus size={16} /> Log
        </Button>
      </div>
      {pts.length > 1 && <LineChart points={pts} unit={unit} label="Last 30 entries" />}
      <Sheet open={open} onClose={() => setOpen(false)} title="Log body weight">
        <p className="mb-3 text-[14px] text-mute">Today, {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}. Logging again today replaces it.</p>
        <NumberField label={`Body weight in ${unit}`} value={val} step={0.1} onChange={setVal} />
        <div className="mt-4 flex gap-2">
          {weights?.[dayKey()] && !weights[dayKey()].deleted && (
            <Button kind="danger" className="flex-1" onClick={() => (deleteWeight(dayKey()), setOpen(false))}>Remove today</Button>
          )}
          <Button kind="primary" className="flex-[2]" disabled={!val} onClick={() => (logWeight(dayKey(), Math.round(val * 10) / 10), setOpen(false))}>Save</Button>
        </div>
      </Sheet>
    </Card>
  )
}
