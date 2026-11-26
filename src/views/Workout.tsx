import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ExerciseBlock } from '../components/ExerciseBlock'
import { ExercisePicker } from '../components/ExercisePicker'
import { IChevronDown, IPlus } from '../components/icons'
import { Button, Sheet } from '../components/ui'
import { useNow } from '../components/useNow'
import { useExercises } from '../lib/exercises'
import { useRest } from '../lib/rest'
import { makeEntry } from '../lib/session'
import { useStore } from '../lib/store'
import { doneSets, fmtDuration, totalSets } from '../lib/training'
import type { Entry } from '../lib/types'

export default function Workout() {
  const active = useStore((s) => s.active)
  const setActive = useStore((s) => s.setActive)
  const finishActive = useStore((s) => s.finishActive)
  const { get } = useExercises()
  const nav = useNavigate()
  const now = useNow()
  const rest = useRest()
  const [picker, setPicker] = useState(false)
  const [confirm, setConfirm] = useState<null | 'finish' | 'discard'>(null)
  const [naming, setNaming] = useState(false)
  const leaving = useRef(false)
  useWakeLock()

  // While finishing, the route change can land after the workout is cleared: don't bounce to Home then.
  if (!active) return leaving.current ? null : <Navigate to="/" replace />

  const update = (entries: Entry[]) => setActive({ ...active, entries })
  const done = doneSets(active)
  const total = totalSets(active)

  const finish = () => {
    const id = active.id
    rest.stop()
    leaving.current = true
    nav(`/history/${id}?done=1`, { replace: true })
    finishActive()
  }

  return (
    <div className="min-h-full pb-40">
      <header className="pt-safe sticky top-0 z-20 border-b border-line/60 bg-bg/95 backdrop-blur">
        <div className="flex h-16 items-center gap-2 px-3">
          <button aria-label="Back to app" onClick={() => nav('/')} className="grid size-11 place-items-center rounded-full text-mute active:bg-raised">
            <IChevronDown />
          </button>
          <button className="min-w-0 flex-1 text-left" onClick={() => setNaming(true)}>
            <div className="truncate text-[17px] font-semibold">{active.name}</div>
            <div className="num text-[13px] text-mute">
              {fmtDuration(now - active.startedAt)} · {done}/{total} sets
            </div>
          </button>
          <Button kind="primary" className="min-h-11 px-5" onClick={() => (done < total ? setConfirm('finish') : finish())} disabled={done === 0}>
            Finish
          </Button>
        </div>
        <div className="h-[3px] bg-line/50">
          <div className="h-full bg-accent transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </header>

      <main className="mx-auto flex max-w-[560px] flex-col gap-3 px-3 pt-3">
        {active.entries.length === 0 && (
          <div className="px-6 py-10 text-center text-mute">Add your first exercise to get going.</div>
        )}
        {active.entries.map((e, i) => (
          <ExerciseBlock
            key={`${e.exerciseId}-${i}`}
            entry={e}
            index={i}
            count={active.entries.length}
            workoutId={active.id}
            startedAt={active.startedAt}
            onChange={(ne) => update(active.entries.map((x, j) => (j === i ? ne : x)))}
            onRemove={() => update(active.entries.filter((_, j) => j !== i))}
            onMove={(d) => {
              const a = [...active.entries]
              ;[a[i], a[i + d]] = [a[i + d], a[i]]
              update(a)
            }}
            onSetDone={(s) => rest.start(s)}
          />
        ))}
        <Button className="mt-1 w-full" onClick={() => setPicker(true)}>
          <IPlus size={18} /> Add exercise
        </Button>
        <button className="mt-4 h-12 text-[14px] text-mute" onClick={() => setConfirm('discard')}>
          Discard workout
        </button>
      </main>

      <RestBar />

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={(ids) => update([...active.entries, ...ids.map((id) => makeEntry(get(id)))])} />

      <Sheet open={naming} onClose={() => setNaming(false)} title="Workout name">
        <form onSubmit={(e) => (e.preventDefault(), setNaming(false))} className="flex flex-col gap-3">
          <input autoFocus value={active.name} onChange={(e) => setActive({ ...active, name: e.target.value })} className="h-12 rounded-xl bg-raised px-3 text-[16px] outline-none" />
          <Button kind="primary">Done</Button>
        </form>
      </Sheet>

      <Sheet open={confirm === 'finish'} onClose={() => setConfirm(null)} title="Finish workout?">
        <p className="text-[15px] text-mute">
          {total - done} {total - done === 1 ? 'set is' : 'sets are'} not ticked. Only ticked sets will be saved.
        </p>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => setConfirm(null)}>Keep going</Button>
          <Button kind="primary" className="flex-1" onClick={finish}>Finish</Button>
        </div>
      </Sheet>
      <Sheet open={confirm === 'discard'} onClose={() => setConfirm(null)} title="Discard this workout?">
        <p className="text-[15px] text-mute">Nothing from this session will be saved.</p>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            kind="danger"
            className="flex-1"
            onClick={() => {
              rest.stop()
              nav('/', { replace: true })
              setActive(null)
            }}
          >
            Discard
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function RestBar() {
  const { end, total, add, stop } = useRest()
  const now = useNow(250, !!end)
  const left = end ? Math.ceil((end - now) / 1000) : 0
  const buzzed = useRef<number | null>(null)
  useEffect(() => {
    if (end && left <= 0) {
      if (buzzed.current !== end) {
        buzzed.current = end
        navigator.vibrate?.([200, 100, 200])
      }
      stop()
    }
  }, [end, left, stop])
  if (!end || left <= 0) return null
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
      <div className="h-[3px] bg-line/50">
        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-[560px] items-center gap-2 px-4 py-3">
        <div className="flex-1">
          <div className="num text-[32px] font-semibold leading-none">{fmtDuration(left * 1000)}</div>
          <div className="mt-1 text-[12px] text-mute">Rest</div>
        </div>
        <Button className="min-h-11 px-3 num" onClick={() => add(-15)}>−15</Button>
        <Button className="min-h-11 px-3 num" onClick={() => add(15)}>+15</Button>
        <Button kind="primary" className="min-h-11 px-5" onClick={stop}>Skip</Button>
      </div>
    </div>
  )
}

/** Keeps the screen on while logging, where the browser allows it. */
function useWakeLock() {
  {
    useEffect(() => {
      let lock: { release: () => Promise<void> } | null = null
      const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
      const get = () => wl?.request('screen').then((l) => (lock = l)).catch(() => {})
      get()
      const onVis = () => document.visibilityState === 'visible' && get()
      document.addEventListener('visibilitychange', onVis)
      return () => {
        document.removeEventListener('visibilitychange', onVis)
        lock?.release().catch(() => {})
      }
    }, [])
  }
}
