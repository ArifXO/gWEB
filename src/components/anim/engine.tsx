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
  shin?: number // place the hips from the ankle by shin and thigh angles (degrees from vertical) instead of `hip`
  thigh?: number
  fs?: number // how much the upper arm is turned towards the viewer (1 = side-on, smaller looks shorter)
  ff?: number // the same for the forearm
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
  arms?: 'ik' | 'swing' // swing: arms rotate freely at shoulder and elbow; ik: hands follow a path
  legs?: 'ik' | 'swing'
  support?: 'both' | 'near' // which feet carry the weight for balance (near: rear foot is up on a bench)
  balance?: true | number // solve the trunk lean so the body stays over the feet (number = aim this far ahead of the ankles)
  load?: { at: 'hand' | 'hands' | 'back' | 'front'; mass: number } // the weight, as a share of body weight
}

export const OFF: V = [-1.8, -0.7] // far side of the body, a little behind and above

function shoulderOf(hip: V, torso: number, shrug = 0): V {
  return add(add(hip, dir(torso), BODY.torso * 0.86 + shrug), dir(torso + 90), 0.6)
}
/** Offset in the trunk's frame (x forward, y down the spine) turned into screen units. */
export const inTorso = (t: number, v: V): V => add(dir(t + 90), dir(t + 180), 1).map((_, i) => dir(t + 90)[i] * v[0] + dir(t + 180)[i] * v[1]) as V
function handPoint(elbow: V, wrist: V): V {
  const d = sub(wrist, elbow)
  return add(wrist, d, 2.6 / (Math.hypot(d[0], d[1]) || 1))
}

// --- interpolation ---------------------------------------------------------------------------
// Joints rotate, they don't slide: a free-swinging limb is blended by angle and length around the joint above it,
// so a hand sweeps an arc and the arm never shrinks mid-move. A hand or foot fixed to something (a bar, a pedal,
// the floor) is blended in a straight line and the elbow or knee is solved to reach it.

const ang = (v: V) => Math.atan2(v[1], v[0])
const polar = (a: V, b: V, k: number, maxLen = Infinity): V => {
  const la = Math.hypot(a[0], a[1]), lb = Math.hypot(b[0], b[1])
  let d = ang(b) - ang(a)
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  const t = ang(a) + d * k, l = Math.min(maxLen, lerp(la, lb, k))
  return [Math.cos(t) * l, Math.sin(t) * l]
}
const rot = (v: V, deg: number): V => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r)
  return [v[0] * c - v[1] * sn, v[0] * sn + v[1] * c]
}

/** A key with everything worked out: hip, trunk, shoulders, and where each hand and elbow is. */
interface Solved { hip: V; torso: number; sh: V; sh2: V; wrist: V; wrist2: V; elbow: V; elbow2: V; ankle: V; ankle2: V; knee: V; knee2: V }

function hipOf(key: Key): V {
  return key.shin !== undefined && key.thigh !== undefined ? hipFrom(key.ankle, key.shin, key.thigh) : key.hip
}
function wristOf(key: Key, torso: number, sh: V, far: boolean): V {
  const t = (v: V) => inTorso(torso, v)
  if (far) {
    if (key.grip2) return key.grip2
    if (key.hand2T) return add(sh, t(key.hand2T))
    if (key.hand2) return add(sh, key.hand2)
    if (key.grip) return add(key.grip, OFF)
    if (key.handT) return add(sh, t(key.handT))
    return add(sh, key.hand ?? [0, 28])
  }
  return key.grip ?? (key.handT ? add(sh, t(key.handT)) : add(sh, key.hand ?? [0, 28]))
}
function solveKey(spec: Spec, key: Key): Solved {
  const hip = hipOf(key)
  const sh = shoulderOf(hip, key.torso, key.shrug ?? 0)
  const sh2 = add(sh, OFF)
  const wrist = wristOf(key, key.torso, sh, false), wrist2 = wristOf(key, key.torso, sh2, true)
  const elR = key.el ?? (key.elT ? inTorso(key.torso, key.elT) : undefined)
  const elR2 = key.el2 ?? elR
  const up = BODY.upper * (key.fs ?? 1), fo = BODY.fore * (key.ff ?? 1)
  const elbow = elR ? add(sh, elR) : ik(sh, wrist, up, fo, spec.elbow ?? 1)
  const elbow2 = elR2 ? add(sh2, elR2) : ik(sh2, wrist2, up, fo, spec.elbow2 ?? spec.elbow ?? 1)
  const ankle = key.ankle, ankle2 = key.ankle2 ?? add(key.ankle, OFF)
  const knee = ik(hip, ankle, BODY.thigh, BODY.shin, -(spec.knee ?? 1))
  const knee2 = ik(add(hip, OFF), ankle2, BODY.thigh, BODY.shin, -(spec.knee2 ?? spec.knee ?? 1))
  return { hip, torso: key.torso, sh, sh2, wrist, wrist2, elbow, elbow2, ankle, ankle2, knee, knee2 }
}

const cache = new WeakMap<Spec, Solved[]>()
const solvedKeys = (spec: Spec) => {
  let v = cache.get(spec)
  if (!v) cache.set(spec, (v = spec.keys.map((k) => solveKey(spec, k))))
  return v
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

const MASS = { head: 0.081, torso: 0.497, upper: 0.028, fore: 0.022, thigh: 0.1, shin: 0.061 }

export function joints(spec: Spec, ms: number) {
  const { from, to, k, raw, push } = locate(spec, ms)
  const A = spec.keys[from], B = spec.keys[to]
  const a = solvedKeys(spec)[from], b = solvedKeys(spec)[to]
  // hands gripping something fixed follow their path (ik); otherwise arms with placed elbows swing from the joints
  const armMode = spec.arms ?? (A.grip && B.grip ? 'ik' : A.el || A.elT || B.el || B.elT ? 'swing' : 'ik')
  const legMode = spec.legs ?? 'ik'

  // legs and hips
  let ankle: V, ankle2: V, knee: V, knee2: V, hip: V
  if (legMode === 'swing') {
    hip = lerpV(a.hip, b.hip, k)
    const hip2 = add(hip, OFF)
    knee = add(hip, polar(sub(a.knee, a.hip), sub(b.knee, b.hip), k, BODY.thigh))
    ankle = add(knee, polar(sub(a.ankle, a.knee), sub(b.ankle, b.knee), k, BODY.shin))
    knee2 = add(hip2, polar(sub(a.knee2, add(a.hip, OFF)), sub(b.knee2, add(b.hip, OFF)), k, BODY.thigh))
    ankle2 = add(knee2, polar(sub(a.ankle2, a.knee2), sub(b.ankle2, b.knee2), k, BODY.shin))
  } else {
    // a foot never sinks into the floor: if the lowest point of the sole would, the foot lifts
    const onFloor = (p: V, toe: number): V => {
      const r = (toe * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r)
      const low = Math.max(...[-3.8, 4, 12].map((x) => p[1] + x * sn + 4 * c))
      return low > GROUND ? [p[0], p[1] - (low - GROUND)] : p
    }
    ankle = onFloor(lerpV(a.ankle, b.ankle, k), lerp(A.toe ?? 0, B.toe ?? 0, k))
    ankle2 = onFloor(lerpV(a.ankle2, b.ankle2, k), lerp(A.toe2 ?? A.toe ?? 0, B.toe2 ?? B.toe ?? 0, k))
    const angles = A.shin !== undefined && B.shin !== undefined && A.thigh !== undefined && B.thigh !== undefined
    hip = angles ? hipFrom(ankle, lerp(A.shin!, B.shin!, k), lerp(A.thigh!, B.thigh!, k)) : lerpV(a.hip, b.hip, k)
    knee = ik(hip, ankle, BODY.thigh, BODY.shin, -(spec.knee ?? 1))
    knee2 = ik(add(hip, OFF), ankle2, BODY.thigh, BODY.shin, -(spec.knee2 ?? spec.knee ?? 1))
  }
  const hip2 = add(hip, OFF)
  const shrug = lerp(A.shrug ?? 0, B.shrug ?? 0, k)
  const fs = lerp(A.fs ?? 1, B.fs ?? 1, k), ff = lerp(A.ff ?? 1, B.ff ?? 1, k)

  // arms for a given trunk angle
  const arms = (torso: number) => {
    const sh = shoulderOf(hip, torso, shrug), sh2 = add(sh, OFF)
    if (armMode === 'swing') {
      // blend in the trunk's frame so the arms ride along with the body
      const loc = (s: Solved, p: V, base: V) => rot(sub(p, base), -s.torso)
      const e = rot(polar(loc(a, a.elbow, a.sh), loc(b, b.elbow, b.sh), k, BODY.upper), torso)
      const f = rot(polar(loc(a, a.wrist, a.elbow), loc(b, b.wrist, b.elbow), k, BODY.fore), torso)
      const e2 = rot(polar(loc(a, a.elbow2, a.sh2), loc(b, b.elbow2, b.sh2), k, BODY.upper), torso)
      const f2 = rot(polar(loc(a, a.wrist2, a.elbow2), loc(b, b.wrist2, b.elbow2), k, BODY.fore), torso)
      const elbow = add(sh, e), elbow2 = add(sh2, e2)
      return { sh, sh2, elbow, wrist: add(elbow, f), elbow2, wrist2: add(elbow2, f2) }
    }
    // hands follow a path (straight between keys); elbows solved, on the side the keys put them
    const tk = (key: Key, far: boolean) => {
      const rel = far ? key.hand2 ?? (key.grip || key.grip2 || key.hand2T || key.handT ? undefined : key.hand) : key.hand
      const relT = far ? key.hand2T ?? (key.grip || key.grip2 || key.hand2 ? undefined : key.handT) : key.handT
      if (!far && key.grip) return { abs: key.grip }
      if (far && key.grip2) return { abs: key.grip2 }
      if (far && key.grip && !key.hand2 && !key.hand2T) return { abs: add(key.grip, OFF) }
      if (relT) return { t: relT }
      return { r: rel ?? [0, 28] }
    }
    const target = (far: boolean, base: V) => {
      const p = tk(A, far), q = tk(B, far)
      if (p.t && q.t) return add(base, inTorso(torso, lerpV(p.t, q.t, k)))
      if (p.r && q.r) return add(base, lerpV(p.r, q.r, k))
      // mixed: place each end with today's shoulder and trunk, then blend
      const at = (x: typeof p): V => (x.abs ? x.abs : x.t ? add(base, inTorso(torso, x.t)) : add(base, x.r!))
      return lerpV(at(p), at(q), k)
    }
    const up = BODY.upper * fs, fo = BODY.fore * ff
    const solveArm = (s: V, w: V, ea: V, eb: V, sa: V, sb: V, side: number) => {
      const d = sub(w, s), l = Math.hypot(d[0], d[1]), max = up + fo - 0.02
      const wr = l > max ? add(s, d, max / l) : w
      const hint = add(s, polar(sub(ea, sa), sub(eb, sb), k))
      const e1 = ik(s, wr, up, fo, side), e2 = ik(s, wr, up, fo, -side)
      const pick = Math.hypot(e1[0] - hint[0], e1[1] - hint[1]) <= Math.hypot(e2[0] - hint[0], e2[1] - hint[1]) ? e1 : e2
      return { elbow: pick, wrist: wr }
    }
    const n = solveArm(sh, target(false, sh), a.elbow, b.elbow, a.sh, b.sh, spec.elbow ?? 1)
    const f = solveArm(sh2, target(true, sh2), a.elbow2, b.elbow2, a.sh2, b.sh2, spec.elbow2 ?? spec.elbow ?? 1)
    return { sh, sh2, elbow: n.elbow, wrist: n.wrist, elbow2: f.elbow, wrist2: f.wrist }
  }

  // trunk: blended, or solved so the body (and the weight) stays balanced over the feet
  let torso = lerp(a.torso, b.torso, k)
  const loadAt = (r: ReturnType<typeof arms>, t: number): V[] => {
    const L = spec.load
    if (!L) return []
    if (L.at === 'back') return [add(add(hip, dir(t), BODY.torso * 0.93 + 1.2), dir(t - 90), 3.2)]
    if (L.at === 'front') return [add(add(hip, dir(t), BODY.torso * 0.9), dir(t + 90), 6.4)]
    if (L.at === 'hands') return [handPoint(r.elbow, r.wrist), handPoint(r.elbow2, r.wrist2)]
    return [handPoint(r.elbow, r.wrist)]
  }
  const comX = (t: number) => {
    const r = arms(t)
    const neck = add(hip, dir(t), BODY.torso)
    const head = add(neck, dir(t), BODY.neck + 4.6)
    const m = (p: V, q: V, w: number): [number, number] => [((p[0] + q[0]) / 2) * w, w]
    const parts: [number, number][] = [
      [head[0] * MASS.head, MASS.head], m(hip, neck, MASS.torso),
      m(r.sh, r.elbow, MASS.upper), m(r.elbow, r.wrist, MASS.fore), m(r.sh2, r.elbow2, MASS.upper), m(r.elbow2, r.wrist2, MASS.fore),
      m(hip, knee, MASS.thigh), m(knee, ankle, MASS.shin), m(hip2, knee2, MASS.thigh), m(knee2, ankle2, MASS.shin),
    ]
    const pts = loadAt(r, t)
    for (const p of pts) parts.push([p[0] * ((spec.load?.mass ?? 0) / pts.length), (spec.load?.mass ?? 0) / pts.length])
    const w = parts.reduce((s, p) => s + p[1], 0)
    return parts.reduce((s, p) => s + p[0], 0) / w
  }
  if (spec.balance) {
    // the base of support: the feet that are on the floor (heel to toe), aim a little ahead of the ankles
    const mid = spec.support === 'near' ? ankle[0] : (Math.min(ankle[0], ankle2[0]) + Math.max(ankle[0], ankle2[0])) / 2
    // up on the toes the support moves forward to the balls of the feet
    const toe = (lerp(A.toe ?? 0, B.toe ?? 0, k) * Math.PI) / 180
    const ball = mid + 10 * Math.cos(toe) - 4 * Math.sin(toe)
    const target = lerp(mid + (spec.balance === true ? 3 : spec.balance), ball, clamp(toe / 0.07))
    let lo = -20, hi = 100
    if (comX(lo) > target) torso = lo
    else if (comX(hi) < target) torso = hi
    else {
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2
        if (comX(mid) < target) lo = mid
        else hi = mid
      }
      torso = (lo + hi) / 2
    }
  }
  const r = arms(torso)
  const neck = add(hip, dir(torso), BODY.torso)
  const tilt = lerp(A.tilt ?? 0, B.tilt ?? 0, k)
  const load = lerp(A.load ?? (from ? 1 : 0), B.load ?? (to ? 1 : 0), k)
  const effort = clamp(load + (push ? 0.25 * Math.sin(raw * Math.PI) : 0))
  const j: Joints = {
    near: { ankle, knee, hip, shoulder: r.sh, elbow: r.elbow, wrist: r.wrist, toe: lerp(A.toe ?? 0, B.toe ?? 0, k) },
    far: { ankle: ankle2, knee: knee2, hip: hip2, shoulder: r.sh2, elbow: r.elbow2, wrist: r.wrist2, toe: lerp(A.toe2 ?? A.toe ?? 0, B.toe2 ?? B.toe ?? 0, k) },
    neck, head: torso + tilt, torso,
    grip: handPoint(r.elbow, r.wrist), grip2: handPoint(r.elbow2, r.wrist2), t: ms,
  }
  return { j, effort, com: comX(torso) }
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
    meta: { balance: !!spec.balance, load: spec.load, support: spec.support },
    com: (ms: number) => joints(spec, ms).com,
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
