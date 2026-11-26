import { describe, expect, it } from 'vitest'
import { bests, e1rm, finished, lastPerformance, prsFor, suggest, weekStart, weeklyVolume, workoutVolume } from './training'
import type { Workout } from './types'

const w = (id: string, startedAt: number, sets: [number, number][], ex = 'bench-press'): Workout => ({
  id, name: 'W', startedAt, finishedAt: startedAt + 1, updatedAt: 1,
  entries: [{ exerciseId: ex, rest: 90, sets: sets.map(([w, r]) => ({ w, r, done: true })) }],
})

describe('training', () => {
  it('estimates strength from a set', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(e1rm(100, 0)).toBe(0)
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 1)
  })

  it('finds last performance, newest first, skipping deleted and unfinished', () => {
    const hist = finished({
      a: w('a', 1000, [[60, 10]]),
      b: w('b', 2000, [[65, 10]]),
      c: { ...w('c', 3000, [[70, 10]]), deleted: true },
      d: { ...w('d', 4000, [[75, 10]]), finishedAt: undefined },
    })
    expect(hist.map((x) => x.id)).toEqual(['b', 'a'])
    expect(lastPerformance(hist, 'bench-press')?.sets[0].w).toBe(65)
    expect(lastPerformance(hist, 'bench-press', 2000)?.sets[0].w).toBe(60)
    expect(lastPerformance(hist, 'squat')).toBeNull()
  })

  it('suggests more weight only when every target rep was hit', () => {
    expect(suggest([{ w: 60, r: 10, done: true }, { w: 60, r: 10, done: true }], 10, 2.5)).toMatchObject({ weight: 62.5, up: true })
    expect(suggest([{ w: 60, r: 10, done: true }, { w: 60, r: 8, done: true }], 10, 2.5)).toMatchObject({ weight: 60, up: false })
    expect(suggest(null, 10, 2.5)).toBeNull()
  })

  it('flags records only against existing history', () => {
    const b = bests([w('a', 1, [[60, 10]])], 'bench-press')
    expect(prsFor({ w: 62.5, r: 10, done: true }, b)).toEqual(['Heaviest', 'Strongest set', 'Biggest set'])
    expect(prsFor({ w: 60, r: 10, done: true }, b)).toEqual([])
    expect(prsFor({ w: 100, r: 1, done: true }, { e1rm: 0, weight: 0, volume: 0 })).toEqual([])
  })

  it('totals volume per Monday-based week', () => {
    const mon = new Date(2026, 10, 23, 18).getTime() // Monday 23 Nov 2026
    expect(new Date(weekStart(mon + 3 * 86400000)).getDate()).toBe(23)
    const hist = [w('a', mon, [[100, 5]]), w('b', mon - 7 * 86400000, [[50, 10]])]
    const wk = weeklyVolume(hist, 3, mon + 86400000)
    expect(wk.map((x) => x.volume)).toEqual([0, 500, 500])
    expect(workoutVolume(hist[0])).toBe(500)
  })
})
