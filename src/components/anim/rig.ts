// Geometry for gWEB's own exercise figure. Everything is drawn from scratch: a side-view body
// (facing right) built from smooth closed shapes, posed by joint positions that each clip computes.
export type V = [number, number]

export const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k]
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]]
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
export const len = (a: V) => Math.hypot(a[0], a[1])
export const norm = (a: V): V => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l]
}
/** Unit vector for an angle in degrees measured from straight up, clockwise (90 = facing direction). */
export const dir = (deg: number): V => [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)]
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))

// body proportions (about 8 heads tall; 1 unit is roughly 1.9 cm)
export const BODY = { shin: 22, thigh: 23, torso: 27, neck: 5, upper: 15.5, fore: 13.5, ankle: 4 }

/** Middle joint of a two-bone limb; side (1 or -1) picks the bend direction. */
export function ik(root: V, target: V, a: number, b: number, side: number): V {
  const dx = target[0] - root[0], dy = target[1] - root[1]
  const d = Math.min(a + b - 0.01, Math.max(Math.abs(a - b) + 0.01, Math.hypot(dx, dy)))
  const base = Math.atan2(dy, dx)
  const off = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)) * side
  return [root[0] + a * Math.cos(base + off), root[1] + a * Math.sin(base + off)]
}

const f = (v: V) => `${v[0].toFixed(2)} ${v[1].toFixed(2)}`

/** Closed smooth shape through points (Catmull-Rom turned into cubic Béziers). */
export function blob(pts: V[], tension = 1): string {
  const n = pts.length
  let d = `M${f(pts[0])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    const c1: V = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension]
    const c2: V = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension]
    d += `C${f(c1)} ${f(c2)} ${f(p2)}`
  }
  return d + 'Z'
}

/** A local frame along a bone from a to b: t runs 0..1 along it, w is the sideways offset.
 *  Positive w is to the right when the bone points down (the front of a standing body). */
export function frame(a: V, b: V) {
  const d = sub(b, a)
  const l = len(d) || 1
  const u: V = [d[0] / l, d[1] / l]
  const n: V = [u[1], -u[0]]
  return (t: number, w: number): V => [a[0] + d[0] * t + n[0] * w, a[1] + d[1] * t + n[1] * w]
}

/** Outline of a limb from a to b. Profile rows are [t, front width, back width]. */
export function segment(a: V, b: V, profile: [number, number, number][], flip = false): string {
  const P = frame(a, b)
  const s = flip ? -1 : 1
  const front = profile.map(([t, fw]) => P(t, fw * s))
  const back = profile.map(([t, , bw]) => P(t, -bw * s)).reverse()
  // round off the ends with a point past each joint
  const endB = P(1 + profile[profile.length - 1][1] / (len(sub(b, a)) || 1) * 0.9, 0)
  const endA = P(-profile[0][1] / (len(sub(b, a)) || 1) * 0.9, 0)
  return blob([...front, endB, ...back, endA])
}

/** A muscle patch on a bone, given as (t, w) points in that bone's frame. */
export function patch(a: V, b: V, pts: [number, number][], flip = false): string {
  const P = frame(a, b)
  const s = flip ? -1 : 1
  return blob(pts.map(([t, w]) => P(t, w * s)))
}

// --- body part shapes ------------------------------------------------------------

export const PROFILE = {
  thigh: [[0, 5.4, 5.8], [0.22, 5.6, 5.1], [0.5, 4.9, 4.3], [0.8, 3.9, 3.5], [1, 3.3, 3.2]] as [number, number, number][],
  shin: [[0, 3.2, 3.1], [0.22, 2.9, 4.3], [0.45, 2.5, 3.7], [0.78, 1.8, 2.0], [1, 1.9, 1.9]] as [number, number, number][],
  upper: [[0, 3.3, 3.4], [0.3, 3.4, 3.1], [0.75, 2.9, 2.8], [1, 2.6, 2.6]] as [number, number, number][],
  fore: [[0, 2.6, 2.6], [0.25, 3.0, 2.8], [0.7, 2.1, 2.1], [1, 1.7, 1.7]] as [number, number, number][],
  neck: [[0, 3.2, 3.0], [1, 2.6, 2.6]] as [number, number, number][],
}

/** Torso from hip to neck base. Points are (t along the spine, forward offset). */
export function torsoShape(hip: V, neck: V, chest = 1): string {
  const P = frame(hip, neck)
  // in this frame positive w is to the right of the hip→neck direction, which is the back when facing right,
  // so forward offsets are negated
  const pt = (t: number, fwd: number) => P(t, -fwd)
  return blob([
    pt(1.0, 2.6), // front of neck base
    pt(0.86, 7.4 * chest), // upper chest
    pt(0.66, 8.0 * chest), // chest
    pt(0.5, 5.9), // lower ribs
    pt(0.3, 5.4), // belly
    pt(0.08, 5.6), // front of hip
    pt(-0.1, 2.8), // groin
    pt(-0.12, -4.5), // under the glutes
    pt(-0.02, -8.2), // glutes
    pt(0.16, -6.6),
    pt(0.34, -5.2), // lower back curve
    pt(0.62, -6.4), // mid back
    pt(0.84, -7.0), // upper back / traps
    pt(1.0, -2.8), // back of neck base
  ])
}
export function glutePatch(hip: V, neck: V): string {
  const P = frame(hip, neck)
  const pt = (t: number, fwd: number) => P(t, -fwd)
  return blob([pt(0.2, -5.6), pt(0.06, -2.6), pt(-0.09, -3.0), pt(-0.06, -7.6), pt(0.08, -8.1)])
}

/** Head facing right; up is the direction of the head's axis (degrees from vertical). */
export function headShape(c: V, up: number, r = 5.6): string {
  const u = dir(up), fw = dir(up + 90)
  const p = (a: number, b: number): V => [c[0] + u[0] * a * r + fw[0] * b * r, c[1] + u[1] * a * r + fw[1] * b * r]
  return blob([p(1.02, -0.05), p(0.75, 0.68), p(0.3, 0.92), p(0.02, 1.0), p(-0.12, 1.1), p(-0.3, 0.92), p(-0.55, 0.78), p(-0.92, 0.38), p(-0.88, -0.1), p(-0.5, -0.62), p(0.2, -0.95), p(0.75, -0.7)])
}

/** A trainer seen from the side. The sole sits 4 units below the ankle; angle tips the toes down (degrees). */
export function shoeShape(ankle: V, angle = 0): string {
  const a = (angle * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a)
  const p = (x: number, y: number): V => [ankle[0] + x * c - y * sn, ankle[1] + x * sn + y * c]
  return blob([p(-3.6, -1.2), p(0.6, -2.0), p(4.8, -0.2), p(9.4, 1.4), p(12.2, 2.6), p(12.0, 4), p(4, 4), p(-3.8, 4), p(-4.6, 2.4)])
}
