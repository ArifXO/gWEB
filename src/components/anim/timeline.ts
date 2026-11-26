// Keyframe timing for clips: a loop of steps, each easing one value from where the last left off.
export type Ease = (x: number) => number
export const ease = {
  linear: (x: number) => x,
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  in: (x: number) => x * x * x,
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  /** smooth lowering: slow start, steady middle, soft landing */
  lower: (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  /** driving up: quick out of the bottom, easing into lockout */
  drive: (x: number) => 1 - Math.pow(1 - x, 2.4),
}

export interface Step { ms: number; to: number; ease?: Ease }

/** Value along a looping list of steps; starts at `from`. Returns value and the index of the step. */
export function play(ms: number, from: number, steps: Step[]): { v: number; step: number; k: number } {
  const total = steps.reduce((a, s) => a + s.ms, 0)
  let x = ((ms % total) + total) % total
  let v = from
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]
    if (x < s.ms) {
      const k = x / s.ms
      return { v: v + (s.to - v) * (s.ease ?? ease.inOut)(k), step: i, k }
    }
    x -= s.ms
    v = s.to
  }
  return { v, step: steps.length - 1, k: 1 }
}
