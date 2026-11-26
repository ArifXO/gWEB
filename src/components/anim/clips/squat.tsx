// Barbell back squat. The bar rests on the upper back and stays over the middle of the foot the
// whole way down and up; the trunk lean is solved from that balance rule, not hand-placed.
import { BODY, add, dir, lerp, type V } from '../rig'
import { KIT, type Clip, type Pose, type Side } from '../Figure'
import { ease, play } from '../timeline'

const GROUND = 104
const ANKLE: V = [56, GROUND - BODY.ankle]
const MIDFOOT = ANKLE[0] + 2.6
const BAR_BACK = 3.2 // bar sits this far behind the shoulder line, on the upper back
const BAR_UP = 1.2

/** Trunk lean (degrees) that keeps the bar over mid-foot for a given hip position. */
function balance(hip: V): number {
  const barX = (t: number) => hip[0] + Math.sin((t * Math.PI) / 180) * (BODY.torso * 0.93 + BAR_UP) - Math.cos((t * Math.PI) / 180) * BAR_BACK
  let lo = -5, hi = 75
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (barX(mid) < MIDFOOT) lo = mid
    else hi = mid
  }
  return Math.max(2, (lo + hi) / 2)
}

function body(depth: number, brace: number, effort: number): Pose {
  // knees start forward a touch before the hips sit back
  const kd = Math.pow(depth, 0.85)
  const hd = Math.pow(depth, 1.08)
  const shin = lerp(4, 35, kd)
  const thigh = lerp(-3, -101, hd) // knee→hip direction; past -90 means hips just below knees
  const knee = add(ANKLE, dir(shin), BODY.shin)
  const hip = add(knee, dir(thigh), BODY.thigh)
  const lean = balance(hip)
  const neck = add(hip, dir(lean), BODY.torso)
  const shoulder = add(add(hip, dir(lean), BODY.torso * 0.86), dir(lean + 90), 0.6)
  const bar = add(add(hip, dir(lean), BODY.torso * 0.93 + BAR_UP), dir(lean - 90), BAR_BACK)
  // hands grip the bar just outside the shoulders, so the arm is seen foreshortened: elbows back and down
  const elbow = add(shoulder, dir(lean + 206), 12)
  const wrist = add(bar, dir(lean + 140), 1.4)
  const near: Side = { ankle: ANKLE, knee, hip, shoulder, elbow, wrist }
  const off: V = [-1.8, -0.7]
  const far: Side = {
    ankle: add(ANKLE, off), knee: add(knee, off), hip: add(hip, off),
    shoulder: add(shoulder, off), elbow: add(elbow, [-1.2, -0.4]), wrist: add(wrist, off),
  }
  const gaze = lerp(lean, 0, 0.6) // eyes a little down-forward, neck neutral
  const plate = (c: V, near: boolean) => (
    <g>
      <circle cx={c[0]} cy={c[1]} r={9.6} fill={KIT.plate} fillOpacity={1} stroke={KIT.rim} strokeWidth={near ? 1.5 : 1.1} />
      <circle cx={c[0]} cy={c[1]} r={6.2} fill="none" stroke={KIT.rim} strokeWidth={0.6} opacity={0.55} />
      <circle cx={c[0]} cy={c[1]} r={2.1} fill={KIT.metal} />
    </g>
  )
  return {
    ground: GROUND,
    near, far, neck, headUp: gaze,
    chest: 1 + brace * 0.07,
    hot: { quads: effort, glutes: effort * 0.95, lowback: effort * 0.3 },
    shadowX: ANKLE[0] + 3,
    view: [7, 8, 102, 102],
    back: (
      <g>
        {/* bar path cue: straight up and down over the middle of the foot */}
        <line x1={MIDFOOT} y1={10} x2={MIDFOOT} y2={GROUND - 1} stroke="var(--color-line, #2a2c30)" strokeWidth={0.7} strokeDasharray="1.6 2.4" />
        {plate(add(bar, [-1.4, -0.6]), false)}
        {plate(bar, true)}
      </g>
    ),
    front: <circle cx={bar[0]} cy={bar[1]} r={2.3} fill={KIT.metal} stroke="var(--color-bg, #0c0d0e)" strokeWidth={0.8} />,
  }
}

// one rep: brace at the top, lower under control, touch the bottom, drive up
const STEPS = [
  { ms: 700, to: 0, ease: ease.linear }, // stand tall and brace
  { ms: 1600, to: 1, ease: ease.lower }, // sit down and back
  { ms: 220, to: 1, ease: ease.linear }, // bottom
  { ms: 1150, to: 0, ease: ease.drive }, // stand up
]

export const squat: Clip = {
  still: 1650,
  pose(ms) {
    const { v: depth, step, k } = play(ms, 0, STEPS)
    const brace = step === 0 ? Math.sin(k * Math.PI) : 0
    const effort = step === 3 ? 0.55 + 0.45 * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5) * (1 - k * 0.6) : depth * 0.75
    return body(depth, brace, effort)
  },
}
