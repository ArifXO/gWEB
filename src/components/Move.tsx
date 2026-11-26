// Original animated figure for showing how an exercise moves.
// One side-view figure is posed by a few numbers (hip, torso angle, hand and foot targets);
// arms and legs are solved with two-joint IK, and each movement type tweens between two poses.
import { useEffect, useRef, useState } from 'react'
import type { Equipment, Pattern } from '../lib/catalogue'

type V = [number, number]
interface Pose {
  hip: V
  torso: number // degrees from straight up, clockwise (90 = facing forward/right)
  hand: V
  handRel?: boolean // hand is an offset from the shoulder
  foot: V
  foot2?: V
  toe?: V // where the toes rest (calf raises)
}
interface Move {
  a: Pose
  b: Pose
  knee?: 1 | -1 // which way knees bend (1 = forward)
  elbow?: 1 | -1
  prop?: 'bar' | 'bells' | 'cable' | 'none'
  scene?: 'bench' | 'pullbar' | 'seat' | 'dipbars' | 'floor'
  hold?: boolean // static exercise: barely moves
}

const L = { torso: 30, neck: 9, upper: 17, fore: 15, thigh: 21, shin: 20 }
const dir = (deg: number): V => [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)]
const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]

/** Middle joint of a two-bone limb from root to target; side picks which way it bends. */
function ik(root: V, target: V, a: number, b: number, side: number): V {
  const dx = target[0] - root[0], dy = target[1] - root[1]
  const d = Math.min(a + b - 0.01, Math.max(Math.abs(a - b) + 0.01, Math.hypot(dx, dy)))
  const base = Math.atan2(dy, dx)
  const off = Math.acos((a * a + d * d - b * b) / (2 * a * d)) * side
  return [root[0] + a * Math.cos(base + off), root[1] + a * Math.sin(base + off)]
}

const stand = (p: Partial<Pose> = {}): Pose => ({ hip: [60, 58], torso: 0, hand: [2, 30], handRel: true, foot: [61, 99], ...p })

const MOVES: Record<Pattern, Move> = {
  squat: { a: stand({ hand: [-4, 2] }), b: { hip: [47, 80], torso: 38, hand: [-4, 2], handRel: true, foot: [61, 99] }, prop: 'bar', elbow: -1 },
  hinge: { a: stand({ hand: [1, 31] }), b: { hip: [49, 64], torso: 76, hand: [0, 31], handRel: true, foot: [61, 99] }, prop: 'bar' },
  lunge: { a: stand({ foot2: [58, 99] }), b: { hip: [57, 76], torso: 4, hand: [1, 30], handRel: true, foot: [77, 99], foot2: [36, 99] }, prop: 'bells' },
  bench: { a: { hip: [78, 68], torso: -90, hand: [0, -31], handRel: true, foot: [96, 99] }, b: { hip: [78, 68], torso: -90, hand: [3, -6], handRel: true, foot: [96, 99] }, prop: 'bar', scene: 'bench', elbow: 1, knee: -1 },
  ohp: { a: stand({ hand: [7, 3] }), b: stand({ hand: [1, -31] }), prop: 'bar', elbow: 1 },
  pushup: { a: { hip: [72, 80], torso: -75, hand: [0, 27], handRel: true, foot: [110, 99] }, b: { hip: [72, 89], torso: -88, hand: [0, 9], handRel: true, foot: [110, 99] }, prop: 'none', scene: 'floor', elbow: -1 },
  row: { a: { hip: [50, 62], torso: 72, hand: [0, 31], handRel: true, foot: [60, 99] }, b: { hip: [50, 62], torso: 72, hand: [-12, 16], handRel: true, foot: [60, 99] }, prop: 'bar', elbow: 1 },
  pullup: { a: { hip: [60, 74], torso: 0, hand: [61, 13], foot: [53, 110] }, b: { hip: [60, 54], torso: 0, hand: [61, 13], foot: [53, 90] }, prop: 'none', scene: 'pullbar', elbow: 1 },
  curl: { a: stand({ hand: [3, 31] }), b: stand({ hand: [9, 7] }), prop: 'bells', elbow: 1 },
  triext: { a: stand({ torso: 8, hand: [9, 13] }), b: stand({ torso: 8, hand: [4, 31] }), prop: 'cable', elbow: 1 },
  raise: { a: stand({ hand: [3, 31] }), b: stand({ hand: [31, 2] }), prop: 'bells' },
  calf: { a: stand({ foot: [60, 99], toe: [68, 99] }), b: stand({ hip: [60, 52], foot: [61, 93], toe: [68, 99] }), prop: 'bells' },
  crunch: { a: { hip: [62, 95], torso: -90, hand: [-5, -6], handRel: true, foot: [86, 99] }, b: { hip: [62, 95], torso: -58, hand: [-5, -6], handRel: true, foot: [86, 99] }, prop: 'none', scene: 'floor', elbow: -1 },
  plank: { a: { hip: [70, 86], torso: -77, hand: [-14, 16], handRel: true, foot: [110, 99] }, b: { hip: [70, 85], torso: -77, hand: [-14, 16], handRel: true, foot: [110, 99] }, prop: 'none', scene: 'floor', hold: true, elbow: -1 },
  legraise: { a: { hip: [60, 74], torso: 0, hand: [60, 13], foot: [61, 115] }, b: { hip: [60, 72], torso: -6, hand: [60, 13], foot: [100, 70] }, prop: 'none', scene: 'pullbar' },
  hipthrust: { a: { hip: [58, 92], torso: -62, hand: [10, 12], handRel: true, foot: [86, 99] }, b: { hip: [62, 71], torso: -90, hand: [22, 2], handRel: true, foot: [86, 99] }, prop: 'none', scene: 'bench', elbow: -1 },
  legext: { a: { hip: [48, 72], torso: -4, hand: [2, 28], handRel: true, foot: [70, 93] }, b: { hip: [48, 72], torso: -4, hand: [2, 28], handRel: true, foot: [89, 72] }, prop: 'none', scene: 'seat' },
  legcurl: { a: { hip: [62, 69], torso: -90, hand: [-8, 10], handRel: true, foot: [103, 70] }, b: { hip: [62, 69], torso: -90, hand: [-8, 10], handRel: true, foot: [80, 48] }, prop: 'none', scene: 'bench', knee: -1, elbow: -1 },
  dip: { a: { hip: [60, 62], torso: 4, hand: [62, 62], foot: [50, 98] }, b: { hip: [60, 77], torso: 14, hand: [62, 62], foot: [48, 112] }, prop: 'none', scene: 'dipbars', elbow: 1 },
  jump: { a: { hip: [50, 78], torso: 32, hand: [-6, 28], handRel: true, foot: [61, 99] }, b: { hip: [60, 46], torso: 0, hand: [4, -30], handRel: true, foot: [61, 87] }, prop: 'none' },
  run: { a: { hip: [60, 59], torso: 10, hand: [12, 22], handRel: true, foot: [74, 98], foot2: [44, 86] }, b: { hip: [60, 59], torso: 10, hand: [-10, 22], handRel: true, foot: [46, 86], foot2: [74, 98] }, prop: 'none', elbow: 1 },
  carry: { a: stand({ hand: [1, 31], foot: [66, 99], foot2: [54, 99] }), b: stand({ hip: [60, 57], hand: [1, 31], foot: [54, 99], foot2: [66, 99] }), prop: 'bells' },
}

function solve(m: Move, t: number) {
  const P = (k: keyof Pose) => (m.a[k] as V)
  const hip = lerpV(m.a.hip, m.b.hip, t)
  const torso = lerp(m.a.torso, m.b.torso, t)
  const neck = add(hip, dir(torso), L.torso)
  const head = add(neck, dir(torso), L.neck)
  const handRaw = lerpV(P('hand'), m.b.hand, t)
  const hand = m.a.handRel ? add(neck, handRaw) : handRaw
  const kneeSide = m.knee ?? 1
  const foot = lerpV(m.a.foot, m.b.foot, t)
  const knee = ik(hip, foot, L.thigh, L.shin, -kneeSide)
  const f2a = m.a.foot2, f2b = m.b.foot2
  const foot2 = f2a && f2b ? lerpV(f2a, f2b, t) : undefined
  const knee2 = foot2 ? ik(hip, foot2, L.thigh, L.shin, -kneeSide) : undefined
  const elbow = ik(neck, hand, L.upper, L.fore, m.elbow ?? 1)
  const toe = m.a.toe ?? add(foot, [7, 0])
  return { hip, neck, head, hand, knee, foot, toe, foot2, knee2, elbow, torso }
}

const ease = (x: number) => 0.5 - Math.cos(x * Math.PI) / 2

export function MoveFigure({ pattern, equipment, size = 160, animate = true, className = '' }: { pattern?: Pattern; equipment?: Equipment; size?: number; animate?: boolean; className?: string }) {
  const m = MOVES[pattern ?? 'squat']
  const [t, setT] = useState(0.5)
  const raf = useRef(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!animate || reduce) {
      setT(m.hold ? 0 : 0.6)
      return
    }
    const start = performance.now()
    const period = m.hold ? 3200 : pattern === 'run' ? 900 : 2600
    const tick = (now: number) => {
      const p = ((now - start) % period) / period
      // down-and-up with a short pause at each end
      const tri = p < 0.5 ? p * 2 : 2 - p * 2
      setT(ease(Math.min(1, Math.max(0, (tri - 0.08) / 0.84))))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [m, animate, pattern])

  const s = solve(m, t)
  const prop = m.prop === 'bar' ? (equipment === 'Dumbbell' || equipment === 'Kettlebell' ? 'bells' : equipment === 'Cable' || equipment === 'Machine' ? 'cable' : equipment === 'Bodyweight' ? 'none' : 'bar') : m.prop === 'bells' && equipment === 'Barbell' ? 'bar' : m.prop === 'bells' && equipment === 'Cable' ? 'cable' : m.prop
  const line = (a: V, b: V, w: number, c: string) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
  const body = 'var(--color-ink)'
  const far = 'var(--color-faint)'
  const kit = 'var(--color-accent)'
  const scene = 'var(--color-line)'

  return (
    <svg viewBox="0 -8 120 122" width={size} height={(size * 122) / 120} className={className} role="img" aria-label="How the movement looks">
      {/* ground and equipment that stays put */}
      {m.scene !== 'pullbar' && m.scene !== 'dipbars' && line([8, 101.5], [112, 101.5], 1.5, scene)}
      {m.scene === 'bench' && (
        <g fill={scene}>
          <rect x={m.b.torso === -90 && pattern !== 'hipthrust' ? 22 : 18} y={73} width={pattern === 'hipthrust' ? 26 : 62} height={5} rx={2} />
          <rect x={pattern === 'hipthrust' ? 28 : 34} y={78} width={4} height={22} />
          {pattern !== 'hipthrust' && <rect x={70} y={78} width={4} height={22} />}
        </g>
      )}
      {m.scene === 'seat' && <g fill={scene}><rect x={34} y={76} width={30} height={5} rx={2} /><rect x={36} y={44} width={5} height={34} rx={2} /><rect x={46} y={81} width={4} height={20} /></g>}
      {m.scene === 'pullbar' && line([30, 12], [90, 12], 3, scene)}
      {m.scene === 'dipbars' && <g>{line([46, 64], [80, 64], 3, scene)}{line([76, 64], [76, 112], 3, scene)}</g>}
      {prop === 'cable' && line(s.hand, [96, 6], 1.2, kit)}

      {/* far leg */}
      {s.knee2 && s.foot2 && <g opacity={0.9}>{line(s.hip, s.knee2, 7, far)}{line(s.knee2, s.foot2, 6, far)}{line(s.foot2, add(s.foot2, [7, 0]), 4, far)}</g>}
      {/* near leg */}
      {line(s.hip, s.knee, 7.5, body)}
      {line(s.knee, s.foot, 6.5, body)}
      {line(s.foot, s.toe, 4.5, body)}
      {/* torso and head */}
      {line(s.hip, s.neck, 11, body)}
      <circle cx={s.head[0]} cy={s.head[1]} r={6.2} fill={body} />
      {/* arm */}
      {line(s.neck, s.elbow, 6, body)}
      {line(s.elbow, s.hand, 5, body)}
      {/* what's in the hands */}
      {prop === 'bar' && <g><circle cx={s.hand[0]} cy={s.hand[1]} r={8.5} fill="none" stroke={kit} strokeWidth={2.5} /><circle cx={s.hand[0]} cy={s.hand[1]} r={1.8} fill={kit} /></g>}
      {prop === 'bells' && <g>{line(add(s.hand, [-4, 0]), add(s.hand, [4, 0]), 2, kit)}<rect x={s.hand[0] - 6.5} y={s.hand[1] - 3.5} width={3} height={7} rx={1} fill={kit} /><rect x={s.hand[0] + 3.5} y={s.hand[1] - 3.5} width={3} height={7} rx={1} fill={kit} /></g>}
      {prop === 'cable' && <circle cx={s.hand[0]} cy={s.hand[1]} r={2.2} fill={kit} />}
    </svg>
  )
}
