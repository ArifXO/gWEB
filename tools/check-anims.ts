// Physics and anatomy checks for every exercise animation.
// Run: npx vite-node tools/check-anims.ts [clip-id ...]
// Flags: balance (centre of mass over the feet for standing lifts), joints bending the wrong way or past their range,
// limbs stretched longer than the bones, body parts through the floor, and bar paths that drift.
import { OWN } from '../src/components/anim/clips'
import type { Pose, Side } from '../src/components/anim/Figure'
import { BODY } from '../src/components/anim/rig'

type V = [number, number]
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]]
const len = (a: V) => Math.hypot(a[0], a[1])
const cross = (a: V, b: V) => a[0] * b[1] - a[1] * b[0]
const deg = (a: V, b: V) => (Math.atan2(cross(a, b), a[0] * b[0] + a[1] * b[1]) * 180) / Math.PI
const dir = (d: number): V => [Math.sin((d * Math.PI) / 180), -Math.cos((d * Math.PI) / 180)]
const GROUND = 104

// standing lifts whose balance must sit over the feet, and what the weight is
type Load = 'bar' | 'backbar' | 'bells' | 'none' | 'kb'
const STANDING: Record<string, Load> = {
  
  'back-squat': 'backbar', 'front-squat': 'bar', 'goblet-squat': 'bells', 'kettlebell-goblet-squat': 'kb', 'bodyweight-squat': 'none',
  deadlift: 'bar', 'romanian-deadlift': 'bar', 'stiff-leg-deadlift': 'bar', 'dumbbell-romanian-deadlift': 'bells', 'good-morning': 'backbar',
  'sumo-deadlift': 'bar', 'barbell-row': 'bar', 't-bar-row': 'none', 'overhead-press': 'bar', 'push-press': 'bar', 'lateral-raise': 'bells',
  'front-raise': 'bells', 'rear-delt-fly': 'bells', 'upright-row': 'bar', 'barbell-curl': 'bar', 'ez-bar-curl': 'bar', 'dumbbell-curl': 'bells',
  'hammer-curl': 'bells', 'reverse-curl': 'bar', 'overhead-dumbbell-triceps-extension': 'bells', shrug: 'bar',
  'dumbbell-shrug': 'bells', 'reverse-lunge': 'bells', 'walking-lunge': 'bells', 'kettlebell-swing': 'kb', 'power-clean': 'bar', thruster: 'bar',
  'bulgarian-split-squat': 'bells',
}
// barbell lifts whose bar should travel in a near-vertical line
const BARPATH: Record<string, number> = {
  'back-squat': 4, 'front-squat': 4, deadlift: 4, 'romanian-deadlift': 5, 'stiff-leg-deadlift': 6, 'sumo-deadlift': 4, 'overhead-press': 6,
  'push-press': 6, 'power-clean': 9, thruster: 6, 'bench-press': 10, 'smith-machine-bench-press': 1.5, 'good-morning': 30,
}

const grip = (s: Side): V => { const d = sub(s.wrist, s.elbow); const l = len(d) || 1; return [s.wrist[0] + (d[0] * 2.6) / l, s.wrist[1] + (d[1] * 2.6) / l] }
const torsoAngle = (p: Pose) => { const d = sub(p.neck, p.near.hip); return (Math.atan2(d[0], -d[1]) * 180) / Math.PI }
function backBar(p: Pose): V { const t = torsoAngle(p); const a = dir(t), b = dir(t - 90); return [p.near.hip[0] + a[0] * 26.3 + b[0] * 3.2, p.near.hip[1] + a[1] * 26.3 + b[1] * 3.2] }
function loadPoint(id: string, p: Pose): V {
  return STANDING[id] === 'backbar' ? backBar(p) : grip(p.near)
}
function com(p: Pose, load: Load, id: string): number {
  const mid = (a: V, b: V, k = 0.45): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  const head = [p.neck[0] + dir(p.headUp)[0] * 9.6, p.neck[1] + dir(p.headUp)[1] * 9.6] as V
  const parts: [V, number][] = [[head, 0.081], [mid(p.near.hip, p.neck, 0.5), 0.497]]
  for (const s of [p.near, p.far]) parts.push([mid(s.shoulder, s.elbow), 0.028], [mid(s.elbow, s.wrist), 0.022], [mid(s.hip, s.knee), 0.1], [mid(s.knee, s.ankle), 0.061])
  if (load === 'bar' || load === 'backbar') parts.push([loadPoint(id, p), 0.7])
  if (load === 'bells') parts.push([grip(p.near), 0.12], [grip(p.far), 0.12])
  if (load === 'kb') parts.push([grip(p.near), 0.2])
  let m = 0, x = 0
  for (const [pt, w] of parts) { m += w; x += pt[0] * w }
  return x / m
}
function sole(s: Side): V[] {
  const a = ((s.toe ?? 0) * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a)
  return ([[-3.8, 4], [4, 4], [12, 4]] as V[]).map(([x, y]) => [s.ankle[0] + x * c - y * sn, s.ankle[1] + x * sn + y * c] as V)
}

const only = process.argv.slice(2)
const seen = new Set()
let issues = 0
for (const [id, clip] of Object.entries(OWN)) {
  if (seen.has(clip) || (only.length && !only.includes(id))) continue
  seen.add(clip)
  const total = (clip.marks?.at(-1) ?? 4000) + 1
  const out = new Map<string, string>()
  const flag = (k: string, msg: string) => { if (!out.has(k)) out.set(k, msg) }
  let bx0 = 1e9, bx1 = -1e9
  for (let ms = 0; ms < total; ms += total / 60) {
    const p = clip.pose(ms)
    const t = Math.round(ms)
    for (const [name, s] of [['near', p.near], ['far', p.far]] as const) {
      const thigh = sub(s.knee, s.hip), shin = sub(s.ankle, s.knee), up = sub(s.elbow, s.shoulder), fore = sub(s.wrist, s.elbow)
      const knee = deg(thigh, shin) // + means flexed the right way
      if (Math.abs(knee) > 160) flag(`${name}-knee-fold`, `${name} knee folded past its range @${t}`)
      if (knee < -4 && knee > -160) flag(`${name}-knee`, `${name} knee bends backwards (${knee.toFixed(0)}°) @${t}`)
      const elbow = -deg(up, fore) // flexion, + is the normal way
      const fore3d = len(up) > BODY.upper * 0.85 && len(fore) > BODY.fore * 0.85 // arm in the side plane, not pointing at the viewer
      if (fore3d && elbow < -6 && elbow > -150) flag(`${name}-elbow`, `${name} elbow bends backwards (${elbow.toFixed(0)}°) @${t}`)
      if (fore3d && Math.abs(elbow) > 152) flag(`${name}-elbow-fold`, `${name} elbow folded past its range (${elbow.toFixed(0)}°) @${t}`)
      if (len(thigh) > BODY.thigh * 1.035 || len(shin) > BODY.shin * 1.035) flag(`${name}-leg`, `${name} leg stretched (${len(thigh).toFixed(1)}/${len(shin).toFixed(1)}) @${t}`)
      if (len(up) > BODY.upper * 1.04 || len(fore) > BODY.fore * 1.04) flag(`${name}-arm`, `${name} arm stretched (${len(up).toFixed(1)}/${len(fore).toFixed(1)}) @${t}`)
      if (len(up) < BODY.upper * 0.22) flag(`${name}-arm-short`, `${name} upper arm very foreshortened (${len(up).toFixed(1)}) @${t}`)
      // ankle range: shin vs foot
      const foot = dir(90 + (s.toe ?? 0))
      const shinUp = sub(s.knee, s.ankle)
      const ang = Math.acos((shinUp[0] * foot[0] + shinUp[1] * foot[1]) / len(shinUp)) * 180 / Math.PI
      if (90 - ang > ((s.toe ?? 0) > 40 && (s.toe ?? 0) < 120 ? 50 : 42)) // on the toes, the toe joints take some of the bend flag(`${name}-ankle-df`, `${name} ankle bent too far forward (${(90 - ang).toFixed(0)}° dorsiflexion) @${t}`)
      if (ang - 90 > 76) flag(`${name}-ankle-pf`, `${name} ankle pointed too far (${(ang - 90).toFixed(0)}°) @${t}`)
      for (const pt of sole(s)) if (pt[1] > GROUND + 0.8) flag(`${name}-sole`, `${name} foot through the floor (${pt[1].toFixed(1)}) @${t}`)
      if (s.knee[1] > GROUND - 1) flag(`${name}-kneefloor`, `${name} knee through the floor @${t}`)
      if (s.wrist[1] > GROUND - 1.5) flag(`${name}-wristfloor`, `${name} hand through the floor @${t}`)
    }
    // hip: torso vs thigh, flexion positive
    const hip = deg(sub(p.near.hip, p.near.knee), sub(p.neck, p.near.hip))
    if (hip < -30) flag('hip-hyper', `hips bent backwards (${hip.toFixed(0)}°) @${t}`)
    if (hip > 150) flag('hip-flex', `hips folded past their range (${hip.toFixed(0)}°) @${t}`)
    const tilt = p.headUp - torsoAngle(p)
    if (Math.abs(tilt) > 45) flag('neck', `neck bent ${tilt.toFixed(0)}° @${t}`)
    if (p.near.hip[1] > GROUND - 5.5) flag('hipfloor', `hips through the floor @${t}`)
    if (p.neck[1] > GROUND - 5) flag('neckfloor', `shoulders through the floor @${t}`)
    const load = STANDING[id]
    // explosive lifts: while up on the toes, momentum carries the body, so static balance is not expected
    const explosive = id === 'power-clean' && (p.near.toe ?? 0) > 2
    if (load && !explosive) {
      const feet = [...sole(p.near), ...(clip.meta?.support === 'near' ? [] : sole(p.far))].filter((q) => q[1] > GROUND - 1.5)
      if (feet.length) {
        const x0 = Math.min(...feet.map((q) => q[0])), x1 = Math.max(...feet.map((q) => q[0]))
        const c = com(p, load, id)
        if (c < x0 - 0.5 || c > x1 + 0.5) flag('balance', `falls over: balance at x=${c.toFixed(1)}, feet ${x0.toFixed(1)}..${x1.toFixed(1)} @${t}`)
      }
    }
    if (BARPATH[id] !== undefined) { const b = loadPoint(id, p); bx0 = Math.min(bx0, b[0]); bx1 = Math.max(bx1, b[0]) }
  }
  if (BARPATH[id] !== undefined && bx1 - bx0 > BARPATH[id]) flag('barpath', `bar drifts ${(bx1 - bx0).toFixed(1)} sideways (allowed ${BARPATH[id]})`)
  if (out.size) { issues += out.size; console.log(`\n${id}`); for (const m of out.values()) console.log('  - ' + m) }
}
console.log(`\n${issues} issues`)
