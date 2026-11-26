import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ExerciseBlock, summarize } from '../components/ExerciseBlock'
import { ExercisePicker } from '../components/ExercisePicker'
import { IChevronRight, IPlus } from '../components/icons'
import { Button, Card, Empty, Header, Sheet, useToast } from '../components/ui'
import { useExercises } from '../lib/exercises'
import { makeEntry } from '../lib/session'
import { uid } from '../lib/types'
import { IPlay } from '../components/icons'
import { useStore } from '../lib/store'
import { bests, doneSets, finished, fmtBig, fmtDuration, prsFor, workoutVolume } from '../lib/training'
import type { Workout } from '../lib/types'
import { relDay } from '../lib/dates'

export function History() {
  const workouts = useStore((s) => s.workouts)
  const unit = useStore((s) => s.settings.unit)
  const { get } = useExercises()
  const hist = useMemo(() => finished(workouts), [workouts])
  const groups = useMemo(() => {
    const m = new Map<string, Workout[]>()
    for (const w of hist) {
      const k = new Date(w.startedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      m.set(k, [...(m.get(k) ?? []), w])
    }
    return [...m.entries()]
  }, [hist])

  return (
    <div className="mx-auto max-w-[560px] pb-28">
      <Header title="History" sub={hist.length ? `${hist.length} workouts` : undefined} />
      {hist.length === 0 && <Empty title="No workouts yet">Finished workouts show up here.</Empty>}
      <div className="px-4">
        {groups.map(([month, ws]) => (
          <section key={month} className="mt-4">
            <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">{month}</h2>
            <ul className="flex flex-col gap-2">
              {ws.map((w) => (
                <li key={w.id}>
                  <Link to={`/history/${w.id}`}>
                    <Card className="flex items-center gap-3 p-4 active:bg-raised">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[16px] font-medium">{w.name}</span>
                          <span className="shrink-0 text-[13px] text-mute">{relDay(w.startedAt)}</span>
                        </div>
                        <div className="mt-1 truncate text-[13px] text-mute">{w.entries.map((e) => get(e.exerciseId).name).join(', ')}</div>
                        <div className="num mt-1.5 flex gap-3 text-[12px] text-faint">
                          <span>{fmtDuration((w.finishedAt ?? w.startedAt) - w.startedAt)}</span>
                          <span>{doneSets(w)} sets</span>
                          <span>{fmtBig(workoutVolume(w))} {unit}</span>
                        </div>
                      </div>
                      <IChevronRight className="text-faint" />
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export function WorkoutDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const justDone = params.get('done') === '1'
  const saved = useStore((s) => (id ? s.workouts[id] : undefined))
  const workouts = useStore((s) => s.workouts)
  const saveWorkout = useStore((s) => s.saveWorkout)
  const deleteWorkout = useStore((s) => s.deleteWorkout)
  const unit = useStore((s) => s.settings.unit)
  const { get } = useExercises()
  const nav = useNavigate()
  const [edit, setEdit] = useState<Workout | null>(null)
  const [picker, setPicker] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [toast, showToast] = useToast()

  const records = useMemo(() => {
    if (!saved) return []
    const before = finished(workouts).filter((w) => w.startedAt < saved.startedAt)
    const out: { name: string; text: string }[] = []
    for (const e of saved.entries) {
      const prev = bests(before, e.exerciseId)
      const hit = e.sets.find((s) => prsFor(s, prev).length)
      if (hit) out.push({ name: get(e.exerciseId).name, text: summarize([hit], unit) })
    }
    return out
  }, [saved, workouts, get, unit])

  if (!saved || saved.deleted) return <><Header title="Workout not found" back="/history" /></>

  const w = edit ?? saved
  const date = new Date(w.startedAt)

  return (
    <div className="mx-auto max-w-[560px] pb-32">
      <Header
        title={edit ? 'Edit workout' : w.name}
        back={justDone ? '/' : '/history'}
        sub={`${date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
        right={!edit && <Button kind="ghost" className="min-h-10 px-3 text-[15px]" onClick={() => setEdit(structuredClone(saved))}>Edit</Button>}
      />
      <div className="flex flex-col gap-3 px-4 pt-2">
        {justDone && !edit && (
          <Card className="border-accent/40 p-5">
            <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">Workout saved</div>
            <div className="mt-1 text-[22px] font-semibold tracking-tight">Good session.</div>
            {records.length > 0 && (
              <ul className="mt-3 space-y-1 text-[14px]">
                {records.map((r) => (
                  <li key={r.name}><span className="text-warn">New best</span> · {r.name} <span className="num text-mute">{r.text}</span></li>
                ))}
              </ul>
            )}
          </Card>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Time" value={fmtDuration((w.finishedAt ?? w.startedAt) - w.startedAt)} />
          <Stat label="Sets" value={String(doneSets(w))} />
          <Stat label={`Lifted (${unit})`} value={fmtBig(workoutVolume(w))} />
        </div>

        {edit ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] text-mute">Name</span>
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="h-12 rounded-xl bg-raised px-3 text-[16px] outline-none" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] text-mute">Date</span>
              <input
                type="date"
                value={toDateInput(edit.startedAt)}
                onChange={(e) => {
                  if (!e.target.value) return
                  const [y, m, d] = e.target.value.split('-').map(Number)
                  const s = new Date(edit.startedAt); s.setFullYear(y, m - 1, d)
                  const shift = s.getTime() - edit.startedAt
                  setEdit({ ...edit, startedAt: edit.startedAt + shift, finishedAt: (edit.finishedAt ?? edit.startedAt) + shift })
                }}
                className="h-12 rounded-xl bg-raised px-3 text-[16px] outline-none [color-scheme:dark]"
              />
            </label>
            {edit.entries.map((e, i) => (
              <ExerciseBlock
                key={`${e.exerciseId}-${i}`}
                editing
                entry={e}
                index={i}
                count={edit.entries.length}
                workoutId={edit.id}
                startedAt={edit.startedAt}
                onChange={(ne) => setEdit({ ...edit, entries: edit.entries.map((x, j) => (j === i ? ne : x)) })}
                onRemove={() => setEdit({ ...edit, entries: edit.entries.filter((_, j) => j !== i) })}
                onMove={(d) => {
                  const a = [...edit.entries]
                  ;[a[i], a[i + d]] = [a[i + d], a[i]]
                  setEdit({ ...edit, entries: a })
                }}
              />
            ))}
            <Button onClick={() => setPicker(true)}><IPlus size={18} /> Add exercise</Button>
            <button className="mt-2 h-12 text-[14px] text-[#ff6b6b]" onClick={() => setConfirm(true)}>Delete workout</button>
            <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
              <div className="mx-auto flex max-w-[560px] gap-2 px-4 py-3">
                <Button className="flex-1" onClick={() => setEdit(null)}>Cancel</Button>
                <Button
                  kind="primary"
                  className="flex-[2]"
                  onClick={() => {
                    saveWorkout({ ...edit, entries: edit.entries.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: true })) })).filter((e) => e.sets.length) })
                    setEdit(null)
                    showToast('Changes saved')
                  }}
                >
                  Save changes
                </Button>
              </div>
            </div>
            <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={(ids) => setEdit({ ...edit, entries: [...edit.entries, ...ids.map((x) => { const en = makeEntry(get(x)); return { ...en, sets: en.sets.map((s) => ({ ...s, done: true })) } })] })} />
          </>
        ) : (
          <ul className="flex flex-col gap-2">
            {w.entries.map((e, i) => {
              const ex = get(e.exerciseId)
              return (
                <li key={i}>
                  <Card className="p-4">
                    <div className="text-[16px] font-medium">{ex.name}</div>
                    <ol className="mt-2 space-y-1">
                      {e.sets.map((s, j) => (
                        <li key={j} className="num flex gap-3 text-[14px]">
                          <span className="w-5 text-faint">{j + 1}</span>
                          <span>{s.w ? `${s.w} ${unit}` : ex.bodyweight ? 'Bodyweight' : '—'}</span>
                          <span className="text-mute">× {s.r}</span>
                        </li>
                      ))}
                    </ol>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
        {justDone && !edit && <Button kind="primary" className="mt-2" onClick={() => nav('/')}>Done</Button>}
        {!justDone && !edit && (
          <Button
            className="mt-2"
            onClick={() => {
              const st = useStore.getState()
              if (st.active) return nav('/workout')
              st.setActive({
                id: uid(),
                name: saved.name,
                routineId: saved.routineId,
                startedAt: Date.now(),
                updatedAt: 0,
                entries: saved.entries.map((e) => {
                  const n = makeEntry(get(e.exerciseId), { sets: e.sets.length, reps: e.targetReps ?? e.sets[0]?.r ?? 10, rest: e.rest })
                  return { ...n, targetReps: e.targetReps }
                }),
              })
              nav('/workout')
            }}
          >
            <IPlay size={16} /> Do this workout again
          </Button>
        )}
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Delete this workout?">
        <p className="text-[15px] text-mute">This removes it from your history on every device.</p>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button kind="danger" className="flex-1" onClick={() => (deleteWorkout(saved.id), nav('/history', { replace: true }))}>Delete</Button>
        </div>
      </Sheet>
      {toast}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface px-3 py-3">
      <div className="num text-[20px] font-semibold">{value}</div>
      <div className="mt-0.5 text-[12px] text-mute">{label}</div>
    </div>
  )
}

const toDateInput = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
