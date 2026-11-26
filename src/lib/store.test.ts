import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

describe('store merge', () => {
  beforeEach(() => useStore.getState().resetLocal())

  it('tracks edits for upload and clears them once pushed', () => {
    useStore.getState().saveRoutine({ id: 'r1', name: 'Push', days: [0], items: [] })
    const d = useStore.getState().dirty
    expect(Object.keys(d)).toEqual(['routine:r1'])
    useStore.getState().markPushed(d)
    expect(useStore.getState().dirty).toEqual({})
  })

  it('keeps an edit made while a push was in flight', () => {
    useStore.getState().saveRoutine({ id: 'r1', name: 'Push', days: [0], items: [] })
    const sent = { ...useStore.getState().dirty }
    useStore.getState().saveRoutine({ id: 'r1', name: 'Push 2', days: [0], items: [] })
    useStore.getState().markPushed(sent)
    expect(Object.keys(useStore.getState().dirty)).toEqual(['routine:r1'])
  })

  it('newest edit wins when merging server rows', () => {
    useStore.getState().saveRoutine({ id: 'r1', name: 'Local', days: [], items: [] })
    const local = useStore.getState().routines.r1.updatedAt
    useStore.getState().applyRemote([{ kind: 'routine', id: 'r1', data: { name: 'Old' }, updated_at: local - 10, deleted: false }], null)
    expect(useStore.getState().routines.r1.name).toBe('Local')
    useStore.getState().applyRemote([{ kind: 'routine', id: 'r1', data: { name: 'Newer' }, updated_at: local + 10, deleted: false }], null)
    expect(useStore.getState().routines.r1.name).toBe('Newer')
    useStore.getState().applyRemote([{ kind: 'routine', id: 'r1', data: { name: 'Newer' }, updated_at: local + 20, deleted: true }], 'x')
    expect(useStore.getState().routines.r1.deleted).toBe(true)
    expect(useStore.getState().lastPull).toBe('x')
  })

  it('moves signed-out data into the first account, but not into a second one', () => {
    useStore.getState().saveRoutine({ id: 'r1', name: 'Push', days: [], items: [] })
    useStore.getState().markPushed(useStore.getState().dirty)
    useStore.getState().claim('u1')
    expect(Object.keys(useStore.getState().dirty)).toEqual(['routine:r1'])
    useStore.getState().claim('u2')
    expect(useStore.getState().routines).toEqual({})
    expect(useStore.getState().owner).toBe('u2')
  })

  it('finishing keeps only ticked sets', () => {
    useStore.getState().setActive({
      id: 'w1', name: 'Pull', startedAt: 1, updatedAt: 0,
      entries: [
        { exerciseId: 'a', rest: 60, sets: [{ w: 10, r: 5, done: true }, { w: 10, r: 5, done: false }] },
        { exerciseId: 'b', rest: 60, sets: [{ w: 10, r: 5, done: false }] },
      ],
    })
    useStore.getState().finishActive()
    const w = useStore.getState().workouts.w1
    expect(w.entries).toHaveLength(1)
    expect(w.entries[0].sets).toHaveLength(1)
    expect(useStore.getState().active).toBeNull()
  })
})
