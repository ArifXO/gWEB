import { describe, expect, it } from 'vitest'
import { CATALOGUE, POPULAR } from '../../lib/catalogue'
import { OWN, clipFor } from './clips'

const finite = (v: number[]) => v.every((x) => Number.isFinite(x))

describe('exercise animations', () => {
  it('has its own animation for about 100 common exercises', () => {
    const own = new Set(Object.values(OWN))
    expect(own.size).toBeGreaterThanOrEqual(100)
  })
  it('gives every exercise in the library an animation', () => {
    for (const ex of CATALOGUE) expect(clipFor(ex).clip, ex.id).toBeTruthy()
  })
  it('every common exercise resolves to a clip', () => {
    for (const id of POPULAR) expect(clipFor(CATALOGUE.find((e) => e.id === id)!).clip).toBeTruthy()
  })
  it('poses stay valid through the whole loop', () => {
    for (const [id, clip] of Object.entries(OWN)) {
      for (let ms = 0; ms < 6000; ms += 97) {
        const p = clip.pose(ms)
        for (const s of [p.near, p.far]) for (const v of [s.ankle, s.knee, s.hip, s.shoulder, s.elbow, s.wrist]) expect(finite(v), `${id} @${ms}`).toBe(true)
        expect(finite(p.neck), id).toBe(true)
      }
    }
  })
})
