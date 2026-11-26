import { useMemo, useState } from 'react'
import { BodyMap } from '../components/BodyMap'
import { Card, Empty, Header, Sheet } from '../components/ui'
import { IChevronRight } from '../components/icons'
import { summarize } from '../components/ExerciseBlock'
import { useExercises } from '../lib/exercises'
import { muscleLoad } from '../lib/muscles'
import { useStore } from '../lib/store'
import { e1rm, finished, fmtBig, fmtNum, weekStart, weeklyVolume } from '../lib/training'
import type { SetLog, Workout } from '../lib/types'
import type { Muscle } from '../lib/catalogue'
import { relDay } from './Home'

export default function Progress() {
  const workouts = useStore((s) => s.workouts)
  const unit = useStore((s) => s.settings.unit)
  const { get } = useExercises()
  const hist = useMemo(() => finished(workouts), [workouts])
  const [open, setOpen] = useState<string | null>(null)

  const weeks = useMemo(() => weeklyVolume(hist, 8), [hist])
  const thisWeek = useMemo(() => hist.filter((w) => w.startedAt >= weekStart(Date.now())), [hist])
  const load = useMemo(() => muscleLoad(thisWeek.flatMap((w) => w.entries.map((e) => ({ muscle: get(e.exerciseId).muscle, sets: e.sets.length })))), [thisWeek, get])
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

        <section className="mt-3">
          <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Your lifts</h2>
          <ul className="overflow-hidden rounded-2xl border border-line/60 bg-surface">
            {lifts.map((l) => (
              <li key={l.id} className="border-b border-line/50 last:border-b-0">
                <button onClick={() => setOpen(l.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-raised">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px]">{get(l.id).name}</div>
                    <div className="text-[12px] text-mute">Last done {relDay(l.lastAt).toLowerCase()}</div>
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
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? get(open).name : ''}>
        {open && <LiftDetail id={open} hist={hist} unit={unit} />}
      </Sheet>
    </div>
  )
}

function LiftDetail({ id, hist, unit }: { id: string; hist: Workout[]; unit: string }) {
  const sessions = hist
    .map((w) => ({ at: w.startedAt, sets: w.entries.filter((e) => e.exerciseId === id).flatMap((e) => e.sets) }))
    .filter((s) => s.sets.length)
  const points = sessions.map((s) => ({ at: s.at, v: Math.max(...s.sets.map((x) => x.w)) })).reverse()
  return (
    <div>
      {points.length > 1 ? <LineChart points={points} unit={unit} /> : <p className="text-[14px] text-mute">Do this a couple more times to see a chart.</p>}
      <h3 className="mt-5 mb-1 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Recent sessions</h3>
      <ul>
        {sessions.slice(0, 12).map((s) => (
          <li key={s.at} className="flex justify-between gap-3 border-b border-line/50 py-2.5 text-[14px]">
            <span className="text-mute">{relDay(s.at)}</span>
            <span className="num text-right">{summarize(s.sets, unit)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LineChart({ points, unit }: { points: { at: number; v: number }[]; unit: string }) {
  const W = 320, H = 140, P = 8
  const min = Math.min(...points.map((p) => p.v)), max = Math.max(...points.map((p) => p.v))
  const span = max - min || 1
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P)
  const y = (v: number) => H - P - ((v - min) / span) * (H - 2 * P - 16)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join('')
  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex justify-between text-[13px] text-mute">
        <span>Heaviest weight per session</span>
        <span className="num text-ink">{fmtNum(points[points.length - 1].v)} {unit}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`From ${fmtNum(points[0].v)} to ${fmtNum(points[points.length - 1].v)} ${unit}`}>
        {[0, 0.5, 1].map((f) => <line key={f} x1={P} x2={W - P} y1={y(min + f * span)} y2={y(min + f * span)} stroke="var(--color-line)" strokeWidth="1" />)}
        <text x={W - P} y={y(max) - 4} textAnchor="end" fontSize="10" fill="var(--color-faint)">{fmtNum(max)}</text>
        <text x={W - P} y={y(min) - 4} textAnchor="end" fontSize="10" fill="var(--color-faint)">{fmtNum(min)}</text>
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.v)} r="3" fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth="2" />)}
      </svg>
    </figure>
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
