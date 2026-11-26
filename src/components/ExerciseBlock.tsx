import { useMemo, useState } from 'react'
import { stepFor, useExercises } from '../lib/exercises'
import { useStore } from '../lib/store'
import { bests, finished, fmtNum, lastPerformance, prsFor, suggest } from '../lib/training'
import type { Entry, SetLog } from '../lib/types'
import { ICheck, IDown, IMinus, IMore, IPlus, ITrash, IUp } from './icons'
import { NumberField, Sheet } from './ui'

interface Props {
  entry: Entry
  index: number
  count: number
  workoutId: string
  startedAt: number
  onChange: (e: Entry) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onSetDone?: (rest: number) => void
  /** editing a saved workout: sets are already done, no rest timer */
  editing?: boolean
}

export function ExerciseBlock({ entry, index, count, workoutId, startedAt, onChange, onRemove, onMove, onSetDone, editing }: Props) {
  const { get } = useExercises()
  const ex = get(entry.exerciseId)
  const unit = useStore((s) => s.settings.unit)
  const workouts = useStore((s) => s.workouts)
  const [menu, setMenu] = useState(false)
  const step = stepFor(unit, ex)

  const hist = useMemo(() => finished(workouts), [workouts])
  const last = useMemo(() => lastPerformance(hist, ex.id, startedAt, workoutId), [hist, ex.id, startedAt, workoutId])
  const prev = useMemo(() => bests(hist.filter((w) => w.startedAt < startedAt), ex.id, workoutId), [hist, ex.id, startedAt, workoutId])
  const sug = !editing && entry.targetReps ? suggest(last?.sets ?? null, entry.targetReps, step) : null

  const setAt = (i: number, p: Partial<SetLog>) => onChange({ ...entry, sets: entry.sets.map((s, j) => (j === i ? { ...s, ...p } : s)) })
  const addSet = () => {
    const l = entry.sets[entry.sets.length - 1]
    onChange({ ...entry, sets: [...entry.sets, { w: l?.w ?? 0, r: l?.r ?? 10, done: !!editing }] })
  }
  const removeSet = (i: number) => onChange({ ...entry, sets: entry.sets.filter((_, j) => j !== i) })
  const toggle = (i: number) => {
    const s = entry.sets[i]
    const done = !s.done
    // carry the numbers forward to the next untouched sets, so the common case is one tap per set
    const sets = entry.sets.map((x, j) => (j === i ? { ...x, done } : done && j > i && !x.done ? { ...x, w: s.w, r: x.r || s.r } : x))
    onChange({ ...entry, sets })
    if (done) {
      navigator.vibrate?.(15)
      onSetDone?.(entry.rest)
    }
  }

  const allDone = entry.sets.length > 0 && entry.sets.every((s) => s.done)
  const lastText = last ? summarize(last.sets, unit) : null

  return (
    <section className="rounded-2xl border border-line/60 bg-surface" aria-label={ex.name}>
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <h2 className={`text-[18px] font-semibold leading-tight tracking-tight ${allDone ? 'text-mute' : ''}`}>{ex.name}</h2>
          <div className="mt-1 text-[13px] text-mute">
            {ex.muscle} · {ex.equipment}
          </div>
        </div>
        <button aria-label={`Options for ${ex.name}`} onClick={() => setMenu(true)} className="-mr-2 -mt-1 grid size-10 place-items-center rounded-full text-mute active:bg-raised">
          <IMore />
        </button>
      </div>

      {(lastText || sug) && (
        <div className="mx-4 mt-3 space-y-1 text-[13px] leading-snug">
          {lastText && (
            <div className="text-mute">
              Last time: <span className="num text-ink/80">{lastText}</span>
            </div>
          )}
          {sug && sug.up && <div className="text-accent">Try {fmtNum(sug.weight)} {unit}. You hit every rep last time.</div>}
        </div>
      )}

      <div className="mt-3 grid grid-cols-[22px_1fr_1fr_44px] items-center gap-x-2 px-3 pb-1 text-[12px] text-faint">
        <span className="text-center">Set</span>
        <span className="text-center">{ex.bodyweight ? `Extra ${unit}` : unit}</span>
        <span className="text-center">Reps</span>
        <span />
      </div>
      <ol className="space-y-2 px-3">
        {entry.sets.map((s, i) => {
          const prs = s.done && !editing ? prsFor(s, prev) : []
          return (
            <li key={i}>
              <div className={`grid grid-cols-[22px_1fr_1fr_44px] items-center gap-x-2 rounded-xl ${s.done && !editing ? 'bg-accent/[0.07]' : ''}`}>
                <span className="num text-center text-[14px] text-mute">{i + 1}</span>
                <NumberField compact label={`Set ${i + 1} weight`} value={s.w} step={step} onChange={(w) => setAt(i, { w })} dim={s.done && !editing} />
                <NumberField compact label={`Set ${i + 1} reps`} value={s.r} step={1} onChange={(r) => setAt(i, { r: Math.round(r) })} dim={s.done && !editing} />
                {editing ? (
                  <button aria-label={`Delete set ${i + 1}`} onClick={() => removeSet(i)} className="grid size-11 place-items-center rounded-xl text-mute active:bg-raised">
                    <ITrash size={18} />
                  </button>
                ) : (
                  <button
                    aria-label={s.done ? `Undo set ${i + 1}` : `Done set ${i + 1}`}
                    aria-pressed={s.done}
                    onClick={() => toggle(i)}
                    className={`grid size-11 place-items-center rounded-xl border transition ${s.done ? 'border-accent bg-accent text-accent-ink' : 'border-line text-faint active:bg-raised'}`}
                  >
                    <ICheck size={20} />
                  </button>
                )}
              </div>
              {prs.length > 0 && <div className="mt-1 pl-8 text-[12px] font-medium text-warn">New best: {prs[0].toLowerCase()}</div>}
            </li>
          )
        })}
      </ol>
      <button onClick={addSet} className="mt-1 flex h-12 w-full items-center justify-center gap-1.5 text-[14px] text-mute active:text-ink">
        <IPlus size={16} /> Add set
      </button>

      <Sheet open={menu} onClose={() => setMenu(false)} title={ex.name}>
        <div className="flex flex-col">
          <MenuItem disabled={index === 0} onClick={() => (onMove(-1), setMenu(false))} icon={<IUp size={20} />}>Move up</MenuItem>
          <MenuItem disabled={index === count - 1} onClick={() => (onMove(1), setMenu(false))} icon={<IDown size={20} />}>Move down</MenuItem>
          {!editing && (
            <div className="flex items-center justify-between border-b border-line/50 py-3">
              <span className="text-[16px]">Rest between sets</span>
              <div className="w-40">
                <NumberField label="Rest seconds" value={entry.rest} step={15} onChange={(rest) => onChange({ ...entry, rest: Math.round(rest) })} />
              </div>
            </div>
          )}
          {!editing && (
            <MenuItem disabled={entry.sets.length === 0} onClick={() => (removeSet(entry.sets.length - 1), setMenu(false))} icon={<IMinus size={20} />}>Remove last set</MenuItem>
          )}
          <MenuItem danger onClick={() => (onRemove(), setMenu(false))} icon={<ITrash size={20} />}>Remove exercise</MenuItem>
        </div>
      </Sheet>
    </section>
  )
}

function MenuItem({ children, icon, danger, ...p }: { icon: React.ReactNode; danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`flex items-center gap-3 border-b border-line/50 py-4 text-left text-[16px] disabled:opacity-30 ${danger ? 'text-[#ff6b6b]' : ''}`} {...p}>
      <span className="text-mute">{icon}</span>
      {children}
    </button>
  )
}

/** "60 kg × 10, 10, 8" or "60×10, 65×8" when weights differ. */
export function summarize(sets: SetLog[], unit: string): string {
  if (!sets.length) return ''
  const same = sets.every((s) => s.w === sets[0].w)
  if (same) return sets[0].w ? `${fmtNum(sets[0].w)} ${unit} × ${sets.map((s) => s.r).join(', ')}` : `${sets.map((s) => s.r).join(', ')} reps`
  return sets.map((s) => `${fmtNum(s.w)}×${s.r}`).join(', ')
}
