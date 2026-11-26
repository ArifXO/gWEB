import { ANK, BACKBAR, STAND, backBarPoint, ease, hipFrom, key, liftFirst, lowerFirst, makeClip, type Joints, type Key, type Step } from '../engine'
import { Bench, Cable, Column, Pad, Plate, Stack, Tube, barAt, barbell, dumbbells, Roller, along } from '../kit'
import type { V } from '../rig'

const PULL = { lats: 1, biceps: 0.55, traps: 0.4, delts: 0.3 }

// Hinges. Legs are set by shin and thigh angles from the ankle; the trunk lean is solved each frame so the body
// plus the bar stays balanced over the middle of the foot. Arms hang straight down, so the bar rides close to
// the legs in a vertical line, the way a good deadlift moves.
const PLUMB: V = [0, 27.6]
const hinge = (shin: number, thigh: number, extra: Partial<Key> = {}): Key => ({ hip: hipFrom([56, ANK], shin, thigh), shin, thigh, torso: 40, tilt: -10, ankle: [56, ANK], hand: PLUMB, ...extra })
const DL_STEPS: Step[] = [
  { to: 0, ms: 550, ease: ease.linear },
  { to: 1, ms: 650, ease: ease.in, push: true }, // off the floor: knees straighten, back angle holds
  { to: 2, ms: 650, ease: ease.out, push: true }, // past the knees: hips drive forward to lockout
  { to: 2, ms: 350, ease: ease.linear },
  { to: 1, ms: 700, ease: ease.in }, // hips back first
  { to: 0, ms: 600, ease: ease.out }, // then knees bend to set it down
]
export const deadlift = makeClip({
  keys: [hinge(20, -80, { tilt: -16 }), hinge(5, -44, { tilt: -14 }), hinge(2, -1, { tilt: 0 })],
  steps: DL_STEPS,
  hot: { glutes: 1, hams: 0.8, lowback: 0.85, quads: 0.5, traps: 0.4, forearms: 0.4 },
  balance: true,
  load: { at: 'hand', mass: 0.9 },
  back: barbell().back,
  front: barbell().front,
})
export const sumoDeadlift = makeClip({
  keys: [hinge(24, -85, { tilt: -14, ankle2: [54, ANK] }), hinge(8, -50, { tilt: -12, ankle2: [54, ANK] }), hinge(2, -1, { tilt: 0, ankle2: [54, ANK] })],
  steps: DL_STEPS,
  hot: { glutes: 1, quads: 0.7, hams: 0.6, lowback: 0.6, forearms: 0.35 },
  balance: true,
  load: { at: 'hand', mass: 0.9 },
  back: barbell().back,
  front: barbell().front,
})
// Romanian / stiff-leg: start standing, push the hips back with soft (or straight) knees, bar slides down the thighs
export const romanianDeadlift = makeClip({
  keys: [hinge(2, -1, { tilt: 0 }), hinge(8, -50, { tilt: -14 })],
  steps: lowerFirst(1700, 1100),
  hot: { hams: 1, glutes: 0.85, lowback: 0.55, forearms: 0.3 },
  balance: true,
  load: { at: 'hand', mass: 0.6 },
  back: barbell().back,
  front: barbell().front,
})
export const stiffLegDeadlift = makeClip({
  keys: [hinge(2, -1, { tilt: 0 }), hinge(4, -45, { tilt: -14 })],
  steps: lowerFirst(1800, 1100),
  hot: { hams: 1, glutes: 0.7, lowback: 0.7 },
  balance: true,
  load: { at: 'hand', mass: 0.5 },
  back: barbell().back,
  front: barbell().front,
})
export const dumbbellRDL = makeClip({
  keys: [hinge(2, -1, { tilt: 0 }), hinge(8, -50, { tilt: -14 })],
  steps: lowerFirst(1700, 1100),
  hot: { hams: 1, glutes: 0.85, lowback: 0.5 },
  balance: true,
  load: { at: 'hands', mass: 0.4 },
  back: dumbbells().back,
  front: dumbbells().front,
})
export const goodMorning = makeClip({
  keys: [hinge(2, -1, { tilt: 0, ...BACKBAR, hand: undefined }), hinge(6, -50, { tilt: -16, ...BACKBAR, hand: undefined })],
  steps: lowerFirst(1700, 1100),
  hot: { hams: 1, lowback: 0.85, glutes: 0.7 },
  balance: true,
  load: { at: 'back', mass: 0.4 },
  back: barAt(backBarPoint).back,
  front: barAt(backBarPoint).front,
})

// bent-over rows: hold a hinge with the bar hanging under the shoulders, then row it to the bottom of the ribs.
// The trunk is balanced each frame, so the body shifts a touch as the weight comes in.
const ROW_TOP = { hand: undefined, handT: [9.5, 11.5] as V }
export const barbellRow = makeClip({
  keys: [hinge(12, -50, { tilt: -12, torso: 58 }), hinge(12, -50, { tilt: -12, torso: 58, ...ROW_TOP })],
  steps: liftFirst(900, 1400),
  hot: PULL,
  back: barbell().back,
  front: barbell().front,
})
// landmine T-bar: one end of the bar is fixed to the floor behind
const tbar = (j: Joints) => {
  const pivot: V = [10, 102]
  const end = along(pivot, j.grip, 1.12)
  return (
    <g>
      <line x1={pivot[0]} y1={pivot[1]} x2={end[0]} y2={end[1]} stroke="var(--fig-metal, #a3a6ac)" strokeWidth={1.8} strokeLinecap="round" />
      <Plate c={end} r={8.4} />
    </g>
  )
}
export const tBarRow = makeClip({
  keys: [hinge(14, -56, { tilt: -12, torso: 52 }), hinge(14, -56, { tilt: -12, torso: 52, ...ROW_TOP })],
  steps: liftFirst(900, 1400),
  hot: PULL,
  back: tbar,
})
// one-arm row: free hand braced on a bench in front
const OAR: Key = { hip: [44, 62], torso: 76, tilt: -12, ankle: [58, ANK], ankle2: [36, ANK], hand: [-1, 27.4], grip2: [82, 77] }
export const oneArmDumbbellRow = makeClip({
  keys: [OAR, key(OAR, { hand: undefined, handT: [5, 17] })],
  steps: liftFirst(900, 1400),
  hot: PULL,
  back: (j) => <g><Bench x0={68} x1={104} y={80} />{dumbbells().back(j)}</g>,
  front: dumbbells().front,
})
// chest on an incline pad, both dumbbells pulled back
const CSR: Key = { hip: [46, 62], torso: 50, tilt: -6, ankle: [42, ANK], ankle2: [38, ANK], hand: [0.5, 27.4] }
export const chestSupportedRow = makeClip({
  keys: [CSR, key(CSR, { hand: undefined, handT: [7, 12] })],
  steps: liftFirst(900, 1400),
  hot: PULL,
  back: (j) => (
    <g>
      <Tube pts={[[64, 104], [64, 58]]} />
      <Pad a={[57, 64]} b={[71, 52]} w={4.5} />
      {dumbbells().back(j)}
    </g>
  ),
  front: dumbbells().front,
})

// lat pulldown: seated under a thigh pad, bar pulled to the top of the chest
const LPD: Key = { hip: [50, 78], torso: -6, ankle: [70, ANK], grip: [60, 24] }
const pulldown = (j: Joints) => (
  <g>
    <Stack x={30} y={30} h={44} />
    <Tube pts={[[40, 104], [40, 4], [62, 4]]} />
    <Cable from={[62, 6]} to={j.grip} handle="bar" />
    <Pad a={[42, 83]} b={[58, 83]} />
    <Roller c={[66, 71]} r={3} />
  </g>
)
export const latPulldown = makeClip({
  keys: [LPD, key(LPD, { torso: -16, grip: [57, 50] })],
  steps: liftFirst(1000, 1500),
  hot: PULL,
  back: pulldown,
})
export const closeGripPulldown = latPulldown

// seated cable row: feet on a platform, pull the handle to the stomach
const SCR: Key = { hip: [44, 86], torso: 24, tilt: -8, ankle: [82, 88], toe: -20, grip: [80, 70] }
const lowCable = (j: Joints) => (
  <g>
    <Stack x={96} y={56} h={44} />
    <Tube pts={[[92, 104], [92, 78]]} w={3} />
    <Cable from={[94, 82]} to={j.grip} />
    <Bench x0={18} x1={70} y={90} legs={false} />
  </g>
)
export const seatedCableRow = makeClip({
  keys: [SCR, key(SCR, { torso: 0, grip: [60, 71] })],
  steps: liftFirst(1000, 1500),
  hot: PULL,
  back: lowCable,
})

// straight-arm pulldown: arms stay long and sweep from overhead to the thighs
const SAP: Key = { hip: [52, 57], torso: 24, tilt: -6, ankle: [56, ANK], ankle2: [50, ANK] }
export const straightArmPulldown = makeClip({
  keys: [key(SAP, { hand: [22, -18], el: [11, -9] }), key(SAP, { hand: [3, 28], el: [1.5, 14] })],
  steps: liftFirst(1000, 1500),
  hot: { lats: 1, triceps: 0.4, abs: 0.3 },
  back: (j) => (
    <g>
      <Column x={98} top={4} />
      <Cable from={[96, 10]} to={j.grip} handle="bar" />
    </g>
  ),
})

// machine row: chest against a pad, handles pulled back
const MR: Key = { hip: [46, 80], torso: 8, ankle: [66, ANK], grip: [74, 56] }
export const machineRow = makeClip({
  keys: [MR, key(MR, { torso: 4, grip: [58, 58] })],
  steps: liftFirst(1000, 1500),
  hot: PULL,
  back: (j) => (
    <g>
      <Stack x={90} y={36} h={40} />
      <Tube pts={[[86, 104], [86, 30], [78, 30]]} />
      <Tube pts={[[78, 30], j.grip]} w={2} color="var(--fig-scene-edge, #3a3d43)" />
      <Pad a={[40, 84]} b={[56, 84]} />
      <Pad a={[66, 50]} b={[66, 70]} w={5} />
    </g>
  ),
})

// pull-ups and chin-ups hang from a bar; knees bent so the feet clear the floor
const bar = (y = 8) => () => <Tube pts={[[26, y], [94, y]]} w={2.2} color="var(--fig-metal, #a3a6ac)" />
const HANG: Key = { hip: [54, 58], torso: -6, tilt: 4, ankle: [44, 94], toe: 30, grip: [61, 11] }
export const pullUp = makeClip({
  keys: [HANG, key(HANG, { hip: [52, 38], torso: -14, tilt: 12, ankle: [42, 74] })],
  steps: liftFirst(1000, 1500, 500, 300),
  hot: PULL,
  back: bar(),
})
export const chinUp = makeClip({
  keys: [key(HANG, { torso: -2, grip: [59, 11] }), key(HANG, { hip: [53, 38], torso: -6, tilt: 8, ankle: [43, 74], grip: [59, 11] })],
  steps: liftFirst(1000, 1500, 500, 300),
  hot: { lats: 1, biceps: 0.8, traps: 0.3 },
  back: bar(),
})
export const deadHang = makeClip({
  keys: [HANG, key(HANG, { hip: [54, 57], shrug: -1 })],
  steps: [{ to: 1, ms: 1800 }, { to: 0, ms: 1800 }],
  hot: { forearms: 1, lats: 0.4 },
  back: bar(),
})

// inverted row: body straight under a bar, heels on the floor
const INV: Key = { hip: [52, 88.5], torso: -78, tilt: 0, ankle: [96, 98], toe: -55, grip: [33, 60] }
export const invertedRow = makeClip({
  keys: [INV, key(INV, { hip: [55, 79], torso: -65 })],
  steps: liftFirst(900, 1300),
  hot: PULL,
  back: () => (
    <g>
      <Tube pts={[[22, 104], [22, 50]]} w={3} />
      <Tube pts={[[16, 58], [44, 58]]} w={2.2} color="var(--fig-metal, #a3a6ac)" />
    </g>
  ),
})

// back extension on a 45° bench: hinge down over the pad and back up in line with the legs
const BE: Key = { hip: [58, 66], torso: 42, tilt: 0, ankle: [28, 92], toe: 40, handT: [6, 5], elT: [2, 14] }
export const backExtension = makeClip({
  keys: [BE, key(BE, { torso: 140, tilt: -20 })],
  steps: [{ to: 0, ms: 500 }, { to: 1, ms: 1500 }, { to: 1, ms: 200 }, { to: 0, ms: 1100, push: true }],
  hot: { lowback: 1, glutes: 0.8, hams: 0.6 },
  knee: 1,
  back: () => (
    <g>
      <Tube pts={[[34, 104], [62, 80]]} w={3} />
      <Pad a={[56, 74]} b={[66, 66]} w={5} />
      <Roller c={[24, 99]} r={2.6} />
    </g>
  ),
})

// shrugs: arms long, shoulders straight up to the ears
export const shrug = makeClip({
  keys: [key(STAND, { hand: [0.3, 27.4] }), key(STAND, { hand: [0.3, 27.4], shrug: 3.4 })],
  steps: liftFirst(700, 1000, 400, 600),
  hot: { traps: 1, forearms: 0.4 },
  back: barbell().back,
  front: barbell().front,
})
export const dumbbellShrug = makeClip({
  keys: [key(STAND, { hand: [0.3, 27.4] }), key(STAND, { hand: [0.3, 27.4], shrug: 3.4 })],
  steps: liftFirst(700, 1000, 400, 600),
  hot: { traps: 1, forearms: 0.4 },
  back: dumbbells().back,
  front: dumbbells().front,
})
