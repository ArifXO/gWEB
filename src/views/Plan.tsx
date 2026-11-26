import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BodyMap } from '../components/BodyMap'
import { ExercisePicker } from '../components/ExercisePicker'
import { IChevronRight, IDown, IPlus, ITrash, IUp } from '../components/icons'
import { Button, Card, Header, NumberField, Sheet } from '../components/ui'
import { useExercises } from '../lib/exercises'
import { muscleLoad } from '../lib/muscles'
import { STARTERS } from '../lib/starters'
import { useStore } from '../lib/store'
import { uid, type Routine, type RoutineItem } from '../lib/types'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Plan() {
  const routines = useStore((s) => s.routines)
  const save = useStore((s) => s.saveRoutine)
  const { get } = useExercises()
  const nav = useNavigate()
  const [starters, setStarters] = useState(false)
  const list = useMemo(() => Object.values(routines).filter((r) => !r.deleted).sort((a, b) => (Math.min(...a.days, 9) - Math.min(...b.days, 9)) || a.name.localeCompare(b.name)), [routines])

  const byDay = DAY_NAMES.map((_, d) => list.filter((r) => r.days.includes(d)))

  return (
    <div className="mx-auto max-w-[560px] pb-28">
      <Header title="Plan" right={<Button kind="primary" className="min-h-10 px-3.5 text-[14px]" onClick={() => nav('/plan/new')}><IPlus size={16} /> Routine</Button>} />
      <div className="px-4">
        {list.length > 0 && (
          <section aria-label="Week" className="mt-2">
            <ol className="overflow-hidden rounded-2xl border border-line/60">
              {byDay.map((rs, d) => (
                <li key={d} className="flex min-h-12 items-center gap-3 border-b border-line/50 bg-surface px-4 last:border-b-0">
                  <span className="w-10 text-[13px] text-mute">{DAY_NAMES[d]}</span>
                  <span className={`flex-1 truncate text-[15px] ${rs.length ? '' : 'text-faint'}`}>{rs.length ? rs.map((r) => r.name).join(' + ') : 'Rest'}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-6" aria-label="Routines">
          <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">Routines</h2>
          {list.length === 0 && (
            <Card className="p-5">
              <div className="text-[17px] font-semibold">No routines yet</div>
              <p className="mt-1 text-[15px] text-mute">A routine is a list of exercises you do on certain days, like “Push” on Mondays.</p>
              <div className="mt-4 flex gap-2">
                <Button kind="primary" className="flex-1" onClick={() => nav('/plan/new')}>Make one</Button>
                <Button className="flex-1" onClick={() => setStarters(true)}>Use a ready plan</Button>
              </div>
            </Card>
          )}
          <ul className="flex flex-col gap-2">
            {list.map((r) => (
              <li key={r.id}>
                <Link to={`/plan/${r.id}`}>
                  <Card className="flex items-center gap-4 p-4 active:bg-raised">
                    <BodyMap load={muscleLoad(r.items.map((i) => ({ ex: get(i.exerciseId), sets: i.sets })))} full={4} size={56} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[17px] font-medium">{r.name}</div>
                      <div className="mt-0.5 text-[13px] text-mute">{r.days.length ? r.days.slice().sort().map((d) => DAY_NAMES[d]).join(', ') : 'Any day'} · {r.items.length} exercises</div>
                    </div>
                    <IChevronRight className="text-faint" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {list.length > 0 && (
            <button className="mt-3 h-12 w-full text-[14px] text-mute" onClick={() => setStarters(true)}>Add a ready-made plan</button>
          )}
        </section>
      </div>

      <Sheet open={starters} onClose={() => setStarters(false)} title="Ready-made plans">
        <p className="mb-3 text-[14px] text-mute">These are added as normal routines you can change.</p>
        <div className="flex flex-col gap-2">
          {STARTERS.map((p) => (
            <button
              key={p.name}
              className="rounded-2xl border border-line bg-raised/40 p-4 text-left active:bg-raised"
              onClick={() => {
                for (const r of p.routines) save({ id: uid(), ...r })
                setStarters(false)
              }}
            >
              <div className="text-[16px] font-medium">{p.name}</div>
              <div className="text-[13px] text-mute">{p.blurb} {p.routines.map((r) => r.name).join(', ')}.</div>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

export function RoutineEdit() {
  const { id } = useParams()
  const isNew = id === 'new'
  const existing = useStore((s) => (id ? s.routines[id] : undefined))
  const save = useStore((s) => s.saveRoutine)
  const remove = useStore((s) => s.deleteRoutine)
  const defaultRest = useStore((s) => s.settings.defaultRest)
  const { get } = useExercises()
  const nav = useNavigate()
  const [r, setR] = useState<Omit<Routine, 'updatedAt'>>(() => existing ?? { id: uid(), name: '', days: [], items: [] })
  const [picker, setPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!isNew && (!existing || existing.deleted)) return <Header title="Routine not found" back="/plan" />

  const setItem = (i: number, p: Partial<RoutineItem>) => setR({ ...r, items: r.items.map((x, j) => (j === i ? { ...x, ...p } : x)) })
  const move = (i: number, d: -1 | 1) => {
    const a = [...r.items]
    ;[a[i], a[i + d]] = [a[i + d], a[i]]
    setR({ ...r, items: a })
  }
  const canSave = r.name.trim().length > 0
  const doSave = () => {
    save({ ...r, name: r.name.trim() })
    nav('/plan')
  }

  return (
    <div className="mx-auto max-w-[560px] pb-40">
      <Header title={isNew ? 'New routine' : 'Edit routine'} back="/plan" />
      <div className="flex flex-col gap-6 px-4 pt-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mute">Name</span>
          <input autoFocus={isNew} value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder="e.g. Push, Legs, Upper body" className="h-12 rounded-xl bg-raised px-3 text-[17px] outline-none placeholder:text-faint" />
        </label>

        <fieldset>
          <legend className="mb-2 text-[13px] text-mute">Days</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_NAMES.map((d, i) => {
              const on = r.days.includes(i)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setR({ ...r, days: on ? r.days.filter((x) => x !== i) : [...r.days, i].sort() })}
                  className={`h-11 rounded-xl text-[13px] font-medium ${on ? 'bg-ink text-bg' : 'bg-raised text-mute'}`}
                >
                  {d.slice(0, 2)}
                </button>
              )
            })}
          </div>
        </fieldset>

        <section>
          <div className="mb-2 text-[13px] text-mute">Exercises</div>
          <ol className="flex flex-col gap-2">
            {r.items.map((it, i) => {
              const ex = get(it.exerciseId)
              return (
                <li key={`${it.exerciseId}-${i}`}>
                  <Card className="p-3">
                    <div className="flex items-center gap-1">
                      <div className="min-w-0 flex-1 pl-1">
                        <div className="truncate text-[16px] font-medium">{ex.name}</div>
                        <div className="text-[12px] text-mute">{ex.muscle}</div>
                      </div>
                      <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-10 place-items-center rounded-full text-mute disabled:opacity-25"><IUp size={18} /></button>
                      <button aria-label="Move down" disabled={i === r.items.length - 1} onClick={() => move(i, 1)} className="grid size-10 place-items-center rounded-full text-mute disabled:opacity-25"><IDown size={18} /></button>
                      <button aria-label={`Remove ${ex.name}`} onClick={() => setR({ ...r, items: r.items.filter((_, j) => j !== i) })} className="grid size-10 place-items-center rounded-full text-mute"><ITrash size={18} /></button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Field label="Sets"><NumberField compact label="Sets" value={it.sets} step={1} min={1} onChange={(v) => setItem(i, { sets: Math.max(1, Math.round(v)) })} /></Field>
                      <Field label="Reps"><NumberField compact label="Reps" value={it.reps} step={1} min={1} onChange={(v) => setItem(i, { reps: Math.round(v) })} /></Field>
                      <Field label="Rest (sec)"><NumberField compact label="Rest seconds" value={it.rest} step={15} onChange={(v) => setItem(i, { rest: Math.round(v) })} /></Field>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ol>
          <Button className="mt-2 w-full" onClick={() => setPicker(true)}>
            <IPlus size={18} /> Add exercises
          </Button>
        </section>

        {!isNew && (
          <button className="h-12 text-[14px] text-[#ff6b6b]" onClick={() => setConfirmDelete(true)}>Delete routine</button>
        )}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-[560px] gap-2 px-4 py-3">
          <Button className="flex-1" onClick={() => nav('/plan')}>Cancel</Button>
          <Button kind="primary" className="flex-[2]" disabled={!canSave} onClick={doSave}>Save routine</Button>
        </div>
      </div>

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(ids) => setR({ ...r, items: [...r.items, ...ids.map((exerciseId) => ({ exerciseId, sets: 3, reps: get(exerciseId).muscle === 'Cardio' ? 20 : 10, rest: defaultRest }))] })}
      />
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title={`Delete ${r.name || 'routine'}?`}>
        <p className="text-[15px] text-mute">Past workouts stay in your history.</p>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button kind="danger" className="flex-1" onClick={() => (remove(r.id), nav('/plan'))}>Delete</Button>
        </div>
      </Sheet>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-center text-[11px] text-faint">{label}</span>
      {children}
    </div>
  )
}
