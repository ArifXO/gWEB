import { useEffect, useMemo, useState } from 'react'
import { useExercises } from '../lib/exercises'
import { useStore } from '../lib/store'
import { e1rm, finished, fmtNum } from '../lib/training'
import { relDay } from '../lib/dates'
import { BodyMap } from './BodyMap'
import { summarize } from './ExerciseBlock'
import { ExerciseAnim } from './anim/ExerciseAnim'
import { Sheet } from './ui'

let howtoCache: Record<string, string[]> | null = null
const loadHowto = () => (howtoCache ? Promise.resolve(howtoCache) : import('../lib/howto.json').then((m) => (howtoCache = m.default as Record<string, string[]>)))

/** Everything about one exercise: how it moves, how to do it, and your history with it. */
export function ExerciseInfo({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { get } = useExercises()
  const ex = id ? get(id) : null
  return (
    <Sheet open={!!id} onClose={onClose} title={ex?.name ?? ''} full>
      {id && ex && <Body id={id} />}
    </Sheet>
  )
}

function Body({ id }: { id: string }) {
  const { get } = useExercises()
  const ex = get(id)
  const unit = useStore((s) => s.settings.unit)
  const workouts = useStore((s) => s.workouts)
  const [steps, setSteps] = useState<string[] | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    loadHowto().then((h) => live && setSteps(h[id] ?? null)).catch(() => live && setSteps(null))
    return () => {
      live = false
    }
  }, [id])

  const sessions = useMemo(
    () =>
      finished(workouts)
        .map((w) => ({ at: w.startedAt, sets: w.entries.filter((e) => e.exerciseId === id).flatMap((e) => e.sets) }))
        .filter((s) => s.sets.length),
    [workouts, id],
  )
  const best = sessions.flatMap((s) => s.sets).reduce<null | { w: number; r: number; done: boolean }>((b, s) => (!b || e1rm(s.w, s.r) > e1rm(b.w, b.r) ? s : b), null)
  const load = { [ex.muscle]: 2, ...Object.fromEntries((ex.secondary ?? []).map((m) => [m, 0.8])) }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center gap-4 rounded-2xl bg-raised/50 p-3">
        <ExerciseAnim ex={ex} size={150} />
        <div className="min-w-0 flex-1">
          <BodyMap load={load} full={2} size={110} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[13px]">
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">{ex.muscle}</span>
        {ex.secondary?.map((m) => <span key={m} className="rounded-full bg-raised px-2.5 py-1 text-mute">{m}</span>)}
        <span className="rounded-full border border-line px-2.5 py-1 text-mute">{ex.equipment}</span>
        {ex.level && <span className="rounded-full border border-line px-2.5 py-1 capitalize text-mute">{ex.level}</span>}
      </div>

      {sessions.length > 0 && (
        <section>
          <h3 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Your history</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-raised/60 px-3 py-2.5">
              <div className="num text-[17px] font-semibold">{best ? summarize([best], unit) : '—'}</div>
              <div className="text-[12px] text-mute">Best set</div>
            </div>
            <div className="rounded-xl bg-raised/60 px-3 py-2.5">
              <div className="num text-[17px] font-semibold">{sessions.length}</div>
              <div className="text-[12px] text-mute">Times done</div>
            </div>
          </div>
          {sessions.length > 1 && <LineChart points={sessions.map((s) => ({ at: s.at, v: Math.max(...s.sets.map((x) => x.w)) })).reverse()} unit={unit} />}
          <ul className="mt-2">
            {sessions.slice(0, 6).map((s) => (
              <li key={s.at} className="flex justify-between gap-3 border-b border-line/50 py-2.5 text-[14px]">
                <span className="text-mute">{relDay(s.at)}</span>
                <span className="num text-right">{summarize(s.sets, unit)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">How to do it</h3>
        {steps === undefined ? (
          <p className="text-[14px] text-faint">Loading…</p>
        ) : steps ? (
          <ol className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink/90">
                <span className="num mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-raised text-[12px] text-mute">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[14px] text-mute">No written steps for this one yet. Follow the figure above, and keep the movement slow and controlled.</p>
        )}
      </section>
    </div>
  )
}

export function LineChart({ points, unit, label = 'Heaviest weight per session' }: { points: { at: number; v: number }[]; unit: string; label?: string }) {
  const W = 320, H = 130, P = 8
  const min = Math.min(...points.map((p) => p.v)), max = Math.max(...points.map((p) => p.v))
  const span = max - min || 1
  const x = (i: number) => P + (i / Math.max(1, points.length - 1)) * (W - 2 * P)
  const y = (v: number) => H - P - ((v - min) / span) * (H - 2 * P - 16)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join('')
  return (
    <figure className="m-0 mt-3">
      <figcaption className="mb-2 flex justify-between text-[13px] text-mute">
        <span>{label}</span>
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
