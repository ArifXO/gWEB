// Builds an animation clip from a few hand-placed key poses.
// A key says where the hips are, how the trunk leans and where hands and feet go; knees and elbows are
// solved (two-joint IK), so limbs keep their length and bend the right way between keys.
import type { ReactNode } from 'react'
import { BODY, add, clamp, dir, ik, lerp, lerpV, sub, type V } from './rig'
import type { Clip, Muscle, Pose, Side } from './Figure'
import { ease as E, type Ease } from './timeline'

export const GROUND = 104
export const ANK = GROUND - BODY.ankle // ankle height when the foot is flat on the floor

export interface Key {
  hip: V
  torso: number // trunk angle, degrees from straight up, clockwise (90 = leaning fully forward)
  tilt?: number // head tilt relative to the trunk
  ankle: V
  ankle2?: V // far foot (defaults to just behind the near one)
  toe?: number // foot angle, positive = toes down
  toe2?: number
  hand?: V // near hand, relative to the shoulder
  grip?: V // near hand, absolute (use one of hand/grip)
  hand2?: V // far hand, relative to the far shoulder
  grip2?: V // far hand, absolute
  handT?: V // near hand in the trunk's own frame: x forward, y down the spine from the shoulder (moves with the trunk)
  hand2T?: V
  elT?: V // near elbow in the trunk's frame
  shrug?: number // lift the shoulders up the trunk
  el?: V // place the near elbow directly (relative to the shoulder) instead of solving it; for arms pointing at the viewer
  el2?: V
  load?: number // how hard the working muscles are working in this key (0..1)
}

export interface Joints {
  near: Side
  far: Side
  neck: V
  head: number
  torso: number
  grip: V // centre of the near hand
  grip2: V
  t: number // ms into the loop
}

export interface Step { to: number; ms: number; ease?: Ease; push?: boolean }

export interface Spec {
  keys: Key[]
  steps: Step[] // starts at key 0
  hot: Partial<Record<Muscle, number>>
  knee?: 1 | -1 // 1 = knees bend forward (default)
  knee2?: 1 | -1
  elbow?: 1 | -1 // 1 = elbows bend back/down (default)
  elbow2?: 1 | -1
  back?: (j: Joints) => ReactNode // equipment behind the body
  mid?: (j: Joints) => ReactNode // between the far limbs and the body
  front?: (j: Joints) => ReactNode // over the body
  view?: [number, number, number, number]
  still?: number
  chest?: number
}

const OFF: V = [-1.8, -0.7] // far side of the body, a little behind and above

function shoulderOf(hip: V, torso: number, shrug = 0): V {
  return add(add(hip, dir(torso), BODY.torso * 0.86 + shrug), dir(torso + 90), 0.6)
}
/** Offset in the trunk's frame (x forward, y down the spine) turned into screen units. */
export const inTorso = (t: number, v: V): V => add(dir(t + 90), dir(t + 180), 1).map((_, i) => dir(t + 90)[i] * v[0] + dir(t + 180)[i] * v[1]) as V
function handPoint(elbow: V, wrist: V): V {
  const d = sub(wrist, elbow)
  return add(wrist, d, 2.6 / (Math.hypot(d[0], d[1]) || 1))
}

function mix(a: Key, b: Key, k: number, la: number, lb: number) {
  const hip = lerpV(a.hip, b.hip, k)
  const torso = lerp(a.torso, b.torso, k)
  const sh = shoulderOf(hip, torso, lerp(a.shrug ?? 0, b.shrug ?? 0, k))
  const sh2 = add(sh, OFF)
  const abs = (key: Key, far: boolean): V => {
    const h = shoulderOf(key.hip, key.torso)
    const t = (v: V) => inTorso(key.torso, v)
    if (far) return key.grip2 ?? (key.hand2T ? add(add(h, OFF), t(key.hand2T)) : key.hand2 ? add(add(h, OFF), key.hand2) : key.grip ? add(key.grip, OFF) : key.handT ? add(add(h, OFF), t(key.handT)) : add(add(h, OFF), key.hand ?? [0, 28]))
    return key.grip ?? (key.handT ? add(h, t(key.handT)) : add(h, key.hand ?? [0, 28]))
  }
  const relBoth = (x?: V, y?: V) => x && y
  const elOf = (key: Key) => key.el ?? (key.elT ? inTorso(key.torso, key.elT) : undefined)
  if (a.handT && b.handT) a = { ...a, grip: undefined, hand: undefined }, b = { ...b, grip: undefined, hand: undefined }
  const wristT = a.handT && b.handT ? add(sh, inTorso(torso, lerpV(a.handT, b.handT, k))) : undefined
  const wrist2T = (a.hand2T ?? a.handT) && (b.hand2T ?? b.handT) ? add(sh2, inTorso(torso, lerpV((a.hand2T ?? a.handT)!, (b.hand2T ?? b.handT)!, k))) : undefined
  const wristX = relBoth(a.hand, b.hand) && !a.grip && !b.grip ? add(sh, lerpV(a.hand!, b.hand!, k)) : lerpV(abs(a, false), abs(b, false), k)
  const farRel = (key: Key) => !key.grip2 && !key.hand2T && (key.hand2 || (!key.grip && !key.handT && key.hand))
  const wrist = wristT ?? wristX
  const wrist2X = farRel(a) && farRel(b)
    ? add(sh2, lerpV(a.hand2 ?? a.hand!, b.hand2 ?? b.hand!, k))
    : lerpV(abs(a, true), abs(b, true), k)
  const wrist2 = wrist2T ?? wrist2X
  const ankle = lerpV(a.ankle, b.ankle, k)
  const ankle2 = lerpV(a.ankle2 ?? add(a.ankle, OFF), b.ankle2 ?? add(b.ankle, OFF), k)
  return {
    hip, torso, sh, sh2, wrist, wrist2, ankle, ankle2,
    tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, k),
    toe: lerp(a.toe ?? 0, b.toe ?? 0, k),
    toe2: lerp(a.toe2 ?? a.toe ?? 0, b.toe2 ?? b.toe ?? 0, k),
    load: lerp(a.load ?? la, b.load ?? lb, k),
    el: a.elT && b.elT ? inTorso(torso, lerpV(a.elT, b.elT, k)) : elOf(a) && elOf(b) ? lerpV(elOf(a)!, elOf(b)!, k) : undefined,
    el2: a.el2 && b.el2 ? lerpV(a.el2, b.el2, k) : a.elT && b.elT && !a.el2 && !b.el2 ? inTorso(torso, lerpV(a.elT, b.elT, k)) : elOf(a) && elOf(b) && !a.el2 && !b.el2 ? lerpV(elOf(a)!, elOf(b)!, k) : undefined,
  }
}

/** Where in the loop we are: the two keys being blended, how far, and whether it is a lifting step. */
function locate(spec: Spec, ms: number) {
  const total = spec.steps.reduce((s, x) => s + x.ms, 0)
  let x = ((ms % total) + total) % total
  let from = 0
  for (const st of spec.steps) {
    if (x < st.ms) return { from, to: st.to, k: (st.ease ?? E.inOut)(x / st.ms), raw: x / st.ms, push: !!st.push }
    x -= st.ms
    from = st.to
  }
  return { from, to: from, k: 1, raw: 1, push: false }
}

export function joints(spec: Spec, ms: number) {
  const { from, to, k, raw, push } = locate(spec, ms)
  const m = mix(spec.keys[from], spec.keys[to], k, from ? 1 : 0, to ? 1 : 0)
  const kn = spec.knee ?? 1, kn2 = spec.knee2 ?? kn
  const el = spec.elbow ?? 1, el2 = spec.elbow2 ?? el
  const hip2 = add(m.hip, OFF)
  const knee = ik(m.hip, m.ankle, BODY.thigh, BODY.shin, -kn)
  const knee2 = ik(hip2, m.ankle2, BODY.thigh, BODY.shin, -kn2)
  const elbow = m.el ? add(m.sh, m.el) : ik(m.sh, m.wrist, BODY.upper, BODY.fore, el)
  const elbow2 = m.el2 ? add(m.sh2, m.el2) : ik(m.sh2, m.wrist2, BODY.upper, BODY.fore, el2)
  // wrists can't reach past the arm's length: pull them in to what the IK found
  const reach = (sh: V, w: V) => {
    const d = sub(w, sh), l = Math.hypot(d[0], d[1]), max = BODY.upper + BODY.fore - 0.02
    return l > max ? add(sh, d, max / l) : w
  }
  const wrist = m.el ? m.wrist : reach(m.sh, m.wrist), wrist2 = m.el2 ? m.wrist2 : reach(m.sh2, m.wrist2)
  const neck = add(m.hip, dir(m.torso), BODY.torso)
  const effort = clamp(m.load + (push ? 0.25 * Math.sin(raw * Math.PI) : 0))
  const j: Joints = {
    near: { ankle: m.ankle, knee, hip: m.hip, shoulder: m.sh, elbow, wrist, toe: m.toe },
    far: { ankle: m.ankle2, knee: knee2, hip: hip2, shoulder: m.sh2, elbow: elbow2, wrist: wrist2, toe: m.toe2 },
    neck, head: m.torso + m.tilt, torso: m.torso,
    grip: handPoint(elbow, wrist), grip2: handPoint(elbow2, wrist2), t: ms,
  }
  return { j, effort }
}

function autoView(spec: Spec): [number, number, number, number] {
  const total = spec.steps.reduce((s, x) => s + x.ms, 0)
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = GROUND + 2
  for (let i = 0; i < 16; i++) {
    const { j } = joints(spec, (total * i) / 16)
    const head = add(j.neck, dir(j.head), BODY.neck + 4.6)
    for (const p of [j.near.ankle, j.near.knee, j.near.hip, j.near.elbow, j.near.wrist, j.neck, head, j.far.ankle, j.far.wrist, j.grip]) {
      x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1])
    }
  }
  x0 -= 12; y0 -= 12; x1 += 14; y1 += 4
  const size = Math.max(x1 - x0, y1 - y0, 78)
  const cx = (x0 + x1) / 2
  // keep the floor near the bottom edge
  const top = Math.min(y0, y1 - size)
  return [cx - size / 2, top, size, size]
}

export function makeClip(spec: Spec): Clip {
  let view: Spec['view']
  const total = spec.steps.reduce((s, x) => s + x.ms, 0)
  const marks: number[] = []
  spec.steps.reduce((acc, st) => (marks.push(acc + st.ms - 1), acc + st.ms), 0)
  return {
    marks,
    still: spec.still ?? total * 0.42,
    pose(ms): Pose {
      view ??= spec.view ?? autoView(spec)
      const { j, effort } = joints(spec, ms)
      const hot: Pose['hot'] = {}
      for (const [m, v] of Object.entries(spec.hot)) hot[m as Muscle] = (v ?? 0) * (0.25 + 0.75 * effort)
      return {
        ground: GROUND,
        near: j.near, far: j.far, neck: j.neck, headUp: j.head,
        chest: spec.chest, hot,
        back: spec.back?.(j), mid: spec.mid?.(j), front: spec.front?.(j),
        shadowX: (j.near.ankle[0] + j.near.hip[0]) / 2 + 3,
        view,
      }
    },
  }
}

// --- quick helpers for authoring keys ---------------------------------------------------

/** Standing tall with feet under the hips. */
export const STAND: Key = { hip: [56, ANK - BODY.shin - BODY.thigh + 0.6], torso: 0, ankle: [56, ANK], hand: [0.5, 28.5] }
export const key = (base: Key, over: Partial<Key>): Key => ({ ...base, ...over })
/** Hip position for a given ankle, shin angle and thigh angle (both degrees from vertical). */
export function hipFrom(ankle: V, shin: number, thigh: number): V {
  return add(add(ankle, dir(shin), BODY.shin), dir(thigh), BODY.thigh)
}
export { E as ease }

/** Lift first (curls, rows, raises): rest, lift, squeeze, lower slowly. */
export const liftFirst = (up = 1000, down = 1500, top = 450, squeeze = 300): Step[] => [
  { to: 0, ms: top, ease: E.linear }, { to: 1, ms: up, push: true }, { to: 1, ms: squeeze, ease: E.linear }, { to: 0, ms: down, ease: E.lower },
]
/** Lower first (squats, presses lying down): brace, lower slowly, touch, drive back. */
export const lowerFirst = (down = 1500, up = 1050, top = 550, bottom = 200): Step[] => [
  { to: 0, ms: top, ease: E.linear }, { to: 1, ms: down, ease: E.lower }, { to: 1, ms: bottom, ease: E.linear }, { to: 0, ms: up, ease: E.drive, push: true },
]
/** Steady back-and-forth (cardio, carries). */
export const cycle = (ms = 900, n = 2): Step[] => Array.from({ length: n }, (_, i) => ({ to: (i + 1) % n, ms, ease: E.inOut }))
/** Static hold that breathes. */
export const hold = (): Step[] => [{ to: 1, ms: 1700, ease: E.inOut }, { to: 0, ms: 1700, ease: E.inOut }]
/** Combine several draw functions into one. */
export const all = (...fs: (((j: Joints) => ReactNode) | undefined)[]) => (j: Joints) => <>{fs.map((f, i) => <g key={i}>{f?.(j)}</g>)}</>

/** Bar resting on the upper back: where the hands and elbows go (in the trunk's frame). */
export const BACKBAR = { handT: [-3.2, -2.3] as V, elT: [-5.3, 10.8] as V }
export function backBarPoint(j: Joints): V {
  return add(add(j.near.hip, dir(j.torso), BODY.torso * 0.93 + 1.2), dir(j.torso - 90), 3.2)
}
/** Bar held across the front of the shoulders (front squat, push press). */
export const FRONTRACK = { handT: [5.6, -1.2] as V, elT: [11.5, 4] as V }
export function frontRackPoint(j: Joints): V {
  return add(add(j.near.hip, dir(j.torso), BODY.torso * 0.9), dir(j.torso + 90), 6.4)
}
