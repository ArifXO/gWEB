import { useMemo, useState } from 'react'
import { EQUIPMENT, MUSCLES, slug, type Equipment, type Muscle } from '../lib/catalogue'
import { useExercises } from '../lib/exercises'
import { useStore } from '../lib/store'
import { uid } from '../lib/types'
import { ICheck, IPlus, ISearch } from './icons'
import { ExerciseInfo } from './ExerciseInfo'
import { MoveFigure } from './Move'
import { Button, Chip, Sheet } from './ui'

export function ExercisePicker({ open, onClose, onPick, multi = true, title, initialMuscle }: { open: boolean; onClose: () => void; onPick: (ids: string[]) => void; multi?: boolean; title?: string; initialMuscle?: Muscle }) {
  const { all } = useExercises()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | null>(initialMuscle ?? null)
  const [info, setInfo] = useState<string | null>(null)
  const [limit, setLimit] = useState(60)
  const [picked, setPicked] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return all.filter((e) => (!muscle || e.muscle === muscle) && words.every((w) => `${e.name} ${e.muscle} ${e.equipment}`.toLowerCase().includes(w)))
  }, [all, q, muscle])
  const shown = list.slice(0, limit)

  const close = () => {
    setPicked([])
    setQ('')
    setLimit(60)
    setMuscle(initialMuscle ?? null)
    setCreating(false)
    onClose()
  }
  const done = (ids = picked) => {
    if (ids.length) onPick(ids)
    close()
  }
  const toggle = (id: string) => {
    if (!multi) return done([id])
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  return (
    <Sheet open={open} onClose={close} title={creating ? 'New exercise' : title ?? (multi ? 'Add exercises' : 'Pick an exercise')} full>
      {creating ? (
        <CreateExercise
          initialName={q}
          onCancel={() => setCreating(false)}
          onCreate={(id) => {
            setCreating(false)
            if (multi) setPicked((p) => [...p, id])
            else done([id])
          }}
        />
      ) : (
        <div className="flex h-full flex-col">
          <label className="flex h-11 items-center gap-2 rounded-xl bg-raised px-3 text-mute">
            <ISearch size={18} />
            <input value={q} onChange={(e) => (setQ(e.target.value), setLimit(60))} placeholder={`Search ${all.length} exercises`} className="h-full flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-faint" />
          </label>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            <Chip active={!muscle} onClick={() => setMuscle(null)}>All</Chip>
            {MUSCLES.map((m) => (
              <Chip key={m} active={muscle === m} onClick={() => (setMuscle(muscle === m ? null : m), setLimit(60))}>{m}</Chip>
            ))}
          </div>
          <ul className="mt-2 flex-1">
            {shown.map((e) => {
              const on = picked.includes(e.id)
              return (
                <li key={e.id} className="flex items-center border-b border-line/50">
                  <button aria-label={`About ${e.name}`} onClick={() => setInfo(e.id)} className="-ml-1 mr-1 grid size-11 shrink-0 place-items-center rounded-xl active:bg-raised">
                    <MiniMove id={e.id} />
                  </button>
                  <button onClick={() => toggle(e.id)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left active:bg-raised/50">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[16px]">{e.name}</div>
                      <div className="text-[13px] text-mute">{e.muscle} · {e.equipment}{e.custom ? ' · yours' : ''}</div>
                    </div>
                    {multi && (
                      <span className={`grid size-7 shrink-0 place-items-center rounded-full border ${on ? 'border-accent bg-accent text-accent-ink' : 'border-line'}`}>
                        {on && <ICheck size={16} />}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            {list.length > shown.length && (
              <li>
                <button onClick={() => setLimit((l) => l + 120)} className="h-12 w-full text-[14px] text-mute">
                  Show more ({list.length - shown.length} left)
                </button>
              </li>
            )}
            {list.length === 0 && <li className="py-6 text-center text-[14px] text-mute">No exercise matches that.</li>}
            <li>
              <button onClick={() => setCreating(true)} className="flex w-full items-center gap-3 py-4 text-left text-accent">
                <IPlus size={20} /> {q ? `Create “${q}”` : 'Create your own exercise'}
              </button>
            </li>
          </ul>
          <ExerciseInfo id={info} onClose={() => setInfo(null)} />
          {multi && picked.length > 0 && (
            <div className="sticky bottom-0 -mx-5 border-t border-line bg-surface px-5 pt-3">
              <Button kind="primary" className="w-full" onClick={() => done()}>
                Add {picked.length} {picked.length === 1 ? 'exercise' : 'exercises'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}

function CreateExercise({ initialName, onCreate, onCancel }: { initialName: string; onCreate: (id: string) => void; onCancel: () => void }) {
  const save = useStore((s) => s.saveExercise)
  const [name, setName] = useState(initialName)
  const [muscle, setMuscle] = useState<Muscle>('Chest')
  const [equipment, setEquipment] = useState<Equipment>('Dumbbell')
  const submit = () => {
    const n = name.trim()
    if (!n) return
    const id = `my-${slug(n)}-${uid().slice(0, 6)}`
    save({ id, name: n, muscle, equipment, bodyweight: equipment === 'Bodyweight' || undefined })
    onCreate(id)
  }
  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => (e.preventDefault(), submit())}>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-mute">Name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl bg-raised px-3 text-[16px] outline-none" placeholder="e.g. Landmine Press" />
      </label>
      <fieldset>
        <legend className="mb-2 text-[13px] text-mute">Main muscle</legend>
        <div className="flex flex-wrap gap-2">
          {MUSCLES.map((m) => <Chip type="button" key={m} active={muscle === m} onClick={() => setMuscle(m)}>{m}</Chip>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[13px] text-mute">Equipment</legend>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((m) => <Chip type="button" key={m} active={equipment === m} onClick={() => setEquipment(m)}>{m}</Chip>)}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <Button type="button" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button kind="primary" className="flex-1" disabled={!name.trim()}>Create</Button>
      </div>
    </form>
  )
}

function MiniMove({ id }: { id: string }) {
  const { get } = useExercises()
  const e = get(id)
  return <MoveFigure pattern={e.pattern} equipment={e.equipment} size={36} animate={false} />
}
