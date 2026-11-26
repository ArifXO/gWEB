// Legs, core, full body and cardio.
import { ANK, FRONTRACK, GROUND, STAND, all, cycle, ease, hold, hipFrom, inTorso, key, liftFirst, lowerFirst, makeClip, type Joints, type Key } from '../engine'
import { Bell, Bench, Box, Cable, Column, KB, Pad, Plate, Hub, Roller, Stack, Tube, barbell, dumbbells } from '../kit'
import { add, dir, type V } from '../rig'

const DOWN: V = [0.3, 27.4]
const LEGS = { quads: 1, glutes: 0.8 }

// --- squats -------------------------------------------------------------------------------
const squatBottom = (torso: number, depth = 1): Key => {
  const hip = hipFrom([56, ANK], 4 + 31 * depth, -3 - 98 * depth)
  return { hip, torso, tilt: -torso * 0.5, ankle: [56, ANK] }
}
export const frontSquat = makeClip({
  keys: [key(STAND, { ...FRONTRACK, tilt: -2 }), { ...squatBottom(22), ...FRONTRACK }],
  steps: lowerFirst(1600, 1150, 600, 220),
  hot: { quads: 1, glutes: 0.7, abs: 0.35 },
  back: barbell().back,
  front: barbell().front,
})
export const gobletSquat = makeClip({
  keys: [key(STAND, { handT: [8, 5], elT: [3, 14.5] }), { ...squatBottom(28), handT: [8, 5], elT: [3, 14.5] }],
  steps: lowerFirst(1600, 1150, 600, 220),
  hot: LEGS,
  front: (j) => <Bell c={j.grip} r={5.4} />,
})
export const kettlebellGobletSquat = makeClip({
  keys: [key(STAND, { handT: [8, 5], elT: [3, 14.5] }), { ...squatBottom(28), handT: [8, 5], elT: [3, 14.5] }],
  steps: lowerFirst(1600, 1150, 600, 220),
  hot: LEGS,
  front: (j) => <KB c={j.grip} up={180} />,
})
export const bodyweightSquat = makeClip({
  keys: [key(STAND, { hand: DOWN }), { ...squatBottom(36), hand: [27, 2], el: [14, 0.5] }],
  steps: lowerFirst(1300, 900, 400, 150),
  hot: LEGS,
})
// hack squat: back on a sled that rides up and down a slope
const HACK: Key = { hip: [50, 54], torso: -18, ankle: [70, 92], toe: -18, handT: [0, -2], elT: [-6, 12] }
export const hackSquat = makeClip({
  keys: [HACK, key(HACK, { hip: [44, 76], torso: -16 })],
  steps: lowerFirst(1600, 1100),
  hot: LEGS,
  back: (j) => (
    <g>
      <Tube pts={[[30, 104], [44, 20]]} w={3.4} />
      <Pad a={add(j.near.hip, [-7, 2])} b={add(j.neck, [-7, -4])} w={5} />
      <Pad a={[62, 98]} b={[84, 90]} w={3} />
    </g>
  ),
})
// leg press: reclined seat, feet push a sled up and away
const LP: Key = { hip: [44, 82], torso: -62, tilt: 10, ankle: [80, 48], toe: -50, grip: [42, 90] }
export const legPress = makeClip({
  keys: [LP, key(LP, { ankle: [62, 58] })],
  steps: lowerFirst(1600, 1100),
  hot: LEGS,
  knee: -1,
  back: (j) => {
    const a = j.near.ankle
    const u = dir(-30)
    const p1 = add(add(a, u, -14), dir(60), 4.5), p2 = add(add(a, u, 14), dir(60), 4.5)
    return (
      <g>
        <Tube pts={[[30, 104], [96, 30]]} w={3} />
        <Pad a={[34, 92]} b={[58, 92]} />
        <Pad a={[36, 90]} b={[20, 64]} w={5} />
        <Tube pts={[p1, p2]} w={3.4} color="var(--fig-pad, #303338)" />
      </g>
    )
  },
})
export const legPressCalfRaise = legPress
// leg extension: seated, shins lift a roller until the knees are straight
const LE: Key = { hip: [46, 74], torso: -6, ankle: [70, 97], toe: 10, grip: [48, 84] }
const extSeat = (j: Joints) => (
  <g>
    <Stack x={18} y={40} h={40} />
    <Pad a={[40, 79]} b={[66, 79]} />
    <Pad a={[38, 77]} b={[33, 48]} w={5} />
    <Tube pts={[[56, 104], [56, 82]]} />
    <Tube pts={[[66, 80], add(j.near.ankle, [2, 3])]} w={2} color="var(--fig-scene-edge, #3a3d43)" />
    <Roller c={add(j.near.ankle, [3, 1])} />
  </g>
)
export const legExtension = makeClip({
  keys: [LE, key(LE, { ankle: [89, 76], toe: -40 })],
  steps: liftFirst(900, 1500, 400, 400),
  hot: { quads: 1 },
  back: extSeat,
})
// seated leg curl: legs start straight on a roller and pull it down and back
export const seatedLegCurl = makeClip({
  keys: [key(LE, { ankle: [89, 76], toe: -40 }), key(LE, { ankle: [66, 98], toe: 20 })],
  steps: liftFirst(900, 1500, 400, 400),
  hot: { hams: 1, calves: 0.3 },
  back: (j) => (
    <g>
      <Stack x={18} y={40} h={40} />
      <Pad a={[40, 79]} b={[66, 79]} />
      <Pad a={[38, 77]} b={[33, 48]} w={5} />
      <Tube pts={[[56, 104], [56, 82]]} />
      <Roller c={add(j.near.ankle, [-2, 4])} />
      <Roller c={[62, 66]} r={3} />
    </g>
  ),
})
// lying leg curl: face down, heels curl a roller up towards the glutes
const LLC: Key = { hip: [54, 74], torso: 90, tilt: -8, ankle: [10, 76], toe: 60, grip: [84, 78] }
export const lyingLegCurl = makeClip({
  keys: [LLC, key(LLC, { ankle: [40, 52], toe: 20 })],
  steps: liftFirst(900, 1500, 400, 400),
  hot: { hams: 1, glutes: 0.3, calves: 0.3 },
  knee: -1,
  back: (j) => (
    <g>
      <Bench x0={30} x1={90} y={80} />
      <Roller c={add(j.near.ankle, [-1, -4.6])} />
    </g>
  ),
})
// nordic curl: kneeling with heels held, lower the body forward as slowly as possible
const NC: Key = { hip: [56, 79], torso: 0, ankle: [34, 99], toe: 70, handT: [7, 4], elT: [4, 14] }
export const nordicCurl = makeClip({
  keys: [NC, key(NC, { hip: [70, 86], torso: 64, tilt: -10, handT: [12, -8], elT: [10, 6] })],
  steps: [{ to: 0, ms: 500 }, { to: 1, ms: 2200, ease: ease.lower }, { to: 1, ms: 200 }, { to: 0, ms: 1200, push: true }],
  hot: { hams: 1, glutes: 0.4 },
  back: () => <Roller c={[30, 94]} r={3} />,
})

// split stances
const SPLIT: Key = key(STAND, { ankle: [66, ANK], ankle2: [36, 87], toe2: 10, hand: DOWN })
export const bulgarianSplitSquat = makeClip({
  keys: [key(SPLIT, { hip: [52, 59] }), key(SPLIT, { hip: [47, 77], torso: 10, ankle2: [36, 87], toe2: 30 })],
  steps: lowerFirst(1500, 1050),
  hot: { quads: 1, glutes: 0.9 },
  back: (j) => <g><Bench x0={16} x1={44} y={87} />{dumbbells().back(j)}</g>,
  front: dumbbells().front,
})
const LUNGE: Key = key(STAND, { hand: DOWN })
export const reverseLunge = makeClip({
  keys: [LUNGE, key(LUNGE, { hip: [50, 76], torso: 6, ankle: [58, ANK], ankle2: [24, 99], toe2: 50 })],
  steps: lowerFirst(1300, 1000),
  hot: { quads: 1, glutes: 0.9 },
  back: dumbbells().back,
  front: dumbbells().front,
})
export const walkingLunge = makeClip({
  keys: [
    key(LUNGE, { ankle: [56, ANK], ankle2: [52, ANK] }),
    key(LUNGE, { hip: [60, 76], torso: 6, ankle: [78, ANK], ankle2: [40, 99], toe2: 50 }),
    key(LUNGE, { hip: [70, 57], ankle: [78, ANK], ankle2: [74, ANK] }),
  ],
  steps: [{ to: 0, ms: 300 }, { to: 1, ms: 1100, ease: ease.lower }, { to: 1, ms: 150 }, { to: 2, ms: 900, push: true }, { to: 0, ms: 1, ease: ease.linear }],
  hot: { quads: 1, glutes: 0.9 },
  back: dumbbells().back,
  front: dumbbells().front,
})
// step-up onto a box
export const stepUp = makeClip({
  keys: [
    key(STAND, { hip: [48, 58], torso: 14, ankle: [64, 79], ankle2: [42, ANK], hand: DOWN }),
    key(STAND, { hip: [62, 35], torso: 2, ankle: [64, 79], ankle2: [60, 72], toe2: 20, hand: DOWN }),
  ],
  steps: liftFirst(1000, 1300, 400, 300),
  hot: { quads: 1, glutes: 0.9 },
  back: (j) => <g><Box x={52} w={32} h={21} />{dumbbells().back(j)}</g>,
  front: dumbbells().front,
})

// --- glutes and hips ---------------------------------------------------------------------------
const hipBar = (j: Joints): V => add(j.near.hip, dir(j.torso + 90), 8)
export const hipThrust = makeClip({
  keys: [
    { hip: [60, 92], torso: -70, tilt: 20, ankle: [80, ANK], grip: [60, 84] },
    { hip: [62, 75], torso: -96, tilt: 30, ankle: [80, ANK], grip: [60, 67] },
  ],
  steps: liftFirst(900, 1300, 400, 500),
  hot: { glutes: 1, hams: 0.4, quads: 0.3 },
  back: (j) => (
    <g>
      <Bench x0={14} x1={42} y={80} />
      <Plate c={add(hipBar(j), [-1.4, -0.6])} r={9.6} dim />
      <Plate c={hipBar(j)} />
    </g>
  ),
  front: (j) => <Hub c={hipBar(j)} />,
})
export const gluteBridge = makeClip({
  keys: [
    { hip: [62, 97], torso: -88, tilt: 0, ankle: [82, ANK], grip: [60, 99] },
    { hip: [62, 85], torso: -58, tilt: -10, ankle: [82, ANK], grip: [56, 99] },
  ],
  steps: liftFirst(800, 1200, 400, 600),
  hot: { glutes: 1, hams: 0.4 },
})
export const cableKickback = makeClip({
  keys: [
    key(STAND, { hip: [56, 57], torso: 18, tilt: -8, ankle: [58, 95], toe: 10, ankle2: [54, ANK], grip: [76, 50], grip2: [76, 50] }),
    key(STAND, { hip: [56, 57], torso: 24, tilt: -8, ankle: [26, 84], toe: 40, ankle2: [54, ANK], grip: [76, 50], grip2: [76, 50] }),
  ],
  steps: liftFirst(800, 1300, 400, 400),
  hot: { glutes: 1, hams: 0.4 },
  back: (j) => (
    <g>
      <Column x={80} top={6} />
      <Cable from={[78, 100]} to={add(j.near.ankle, [0, 1])} handle="none" />
    </g>
  ),
})
// kettlebell swing: snap the hips forward and let the bell float to chest height
export const kettlebellSwing = makeClip({
  keys: [
    { hip: [42, 64], torso: 64, tilt: -20, ankle: [56, ANK], ankle2: [52, ANK], grip: [46, 90] },
    key(STAND, { hip: [55, 56], torso: -4, ankle: [56, ANK], ankle2: [52, ANK], hand: [27.5, 0], el: [14.5, 0.5] }),
  ],
  steps: [{ to: 1, ms: 620, ease: ease.drive, push: true }, { to: 1, ms: 160, ease: ease.linear }, { to: 0, ms: 700, ease: ease.in }, { to: 0, ms: 80, ease: ease.linear }],
  hot: { glutes: 1, hams: 0.8, lowback: 0.4, delts: 0.3 },
  front: (j) => <KB c={j.grip} up={angle(j.near.shoulder, j.grip)} />,
})

// --- calves ---------------------------------------------------------------------------------------
const toes = (base: Key, rise = 5.2): Key => key(base, { hip: [base.hip[0] + 2.8, base.hip[1] - rise], ankle: [base.ankle[0] + 2.8, base.ankle[1] - rise], toe: 28, ...(base.ankle2 ? { ankle2: [base.ankle2[0] + 2.8, base.ankle2[1] - rise], toe2: 28 } : {}) })
const CALF: Key = key(STAND, { handT: [-3.2, -2.3], elT: [-5.3, 10.8] })
export const standingCalfRaise = makeClip({
  keys: [CALF, toes(CALF)],
  steps: liftFirst(700, 1100, 300, 600),
  hot: { calves: 1 },
  back: (j) => (
    <g>
      <Stack x={22} y={40} h={44} />
      <Tube pts={[[32, 104], [32, 14], [48, 14]]} />
      <Pad a={add(j.near.shoulder, [-9, -4])} b={add(j.near.shoulder, [5, -4])} w={4} />
    </g>
  ),
})
const SLC: Key = key(STAND, { ankle2: [42, 82], toe2: 40, grip: [76, 46], grip2: [76, 46] })
export const singleLegCalfRaise = makeClip({
  keys: [SLC, { ...toes(SLC), ankle2: [44.8, 77], toe2: 40 }],
  steps: liftFirst(700, 1100, 300, 600),
  hot: { calves: 1 },
  back: () => <rect x={80} y={4} width={6} height={100} fill="var(--fig-scene, #26282c)" />,
})
const SCR: Key = { hip: [48, 78], torso: -2, ankle: [68, ANK], grip: [64, 74] }
export const seatedCalfRaise = makeClip({
  keys: [SCR, key(SCR, { ankle: [70.8, 94.8], toe: 28 })],
  steps: liftFirst(700, 1100, 300, 600),
  hot: { calves: 1 },
  back: (j) => (
    <g>
      <Pad a={[38, 83]} b={[58, 83]} />
      <Tube pts={[[48, 104], [48, 85]]} />
      <Pad a={add(j.near.knee, [-8, -5])} b={add(j.near.knee, [4, -5])} w={4} />
    </g>
  ),
})

// --- core -------------------------------------------------------------------------------------------
const PLANK: Key = { hip: [50, 88], torso: 80, tilt: 6, ankle: [6, 95.6], toe: 70, el: [0.5, 15.5], hand: [13.9, 15.5] }
export const plank = makeClip({ keys: [PLANK, key(PLANK, { hip: [50, 87.4] })], steps: hold(), hot: { abs: 1, delts: 0.3, quads: 0.25 } })
export const sidePlank = plank
const FLOOR: Key = { hip: [62, 97], torso: -90, tilt: 0, ankle: [82, ANK], handT: [-1, -9], elT: [4, -4] }
export const crunch = makeClip({
  keys: [FLOOR, key(FLOOR, { torso: -60, tilt: 10 })],
  steps: liftFirst(800, 1200, 400, 400),
  hot: { abs: 1 },
})
const HLR: Key = { hip: [55, 44], torso: -3, tilt: 4, ankle: [53, 88], toe: 20, grip: [58, -1] }
const highBar = () => <Tube pts={[[26, -4], [94, -4]]} w={2.2} color="var(--fig-metal, #a3a6ac)" />
export const hangingLegRaise = makeClip({
  keys: [HLR, key(HLR, { hip: [51, 44], torso: -14, ankle: [95, 34], toe: -10 })],
  steps: liftFirst(1000, 1500, 400, 300),
  hot: { abs: 1, quads: 0.4, forearms: 0.4 },
  back: highBar,
})
export const hangingKneeRaise = makeClip({
  keys: [HLR, key(HLR, { hip: [52, 44], torso: -12, ankle: [66, 66], toe: 30 })],
  steps: liftFirst(900, 1300, 400, 300),
  hot: { abs: 1, quads: 0.3, forearms: 0.4 },
  back: highBar,
})
// cable crunch: kneeling, rope held by the head, curl down towards the knees
const CC: Key = { hip: [50, 78], torso: 12, tilt: 4, ankle: [28, 99], toe: 70, handT: [5, -7], elT: [8, 6] }
export const cableCrunch = makeClip({
  keys: [CC, key(CC, { torso: 74, tilt: 0 })],
  steps: liftFirst(900, 1400, 400, 400),
  hot: { abs: 1 },
  back: (j) => (
    <g>
      <Column x={94} top={4} />
      <Cable from={[90, 10]} to={j.grip} handle="rope" />
    </g>
  ),
})
// ab wheel: from kneeling, roll out until the body is long, then pull back
const AW: Key = { hip: [48, 80], torso: 54, tilt: -10, ankle: [24, 99], toe: 70, grip: [64, 97] }
export const abWheelRollout = makeClip({
  keys: [AW, key(AW, { hip: [62, 88], torso: 84, grip: [96, 97] })],
  steps: lowerFirst(1600, 1200, 400, 250),
  hot: { abs: 1, lats: 0.4, delts: 0.3 },
  front: (j) => (
    <g>
      <circle cx={j.grip[0]} cy={GROUND - 5} r={5} fill="var(--fig-plate, #2a2c31)" stroke="var(--fig-rim, #7d8087)" strokeWidth={1.2} />
      <circle cx={j.grip[0]} cy={GROUND - 5} r={1.4} fill="var(--fig-metal, #a3a6ac)" />
    </g>
  ),
})
// decline sit-up: feet hooked at the high end, sit all the way up
const DS: Key = { hip: [64, 70], torso: -112, tilt: 0, ankle: [86, 58], toe: 10, handT: [6, 6], elT: [3, 13] }
export const declineSitUp = makeClip({
  keys: [DS, key(DS, { torso: -18, tilt: 6 })],
  steps: liftFirst(1000, 1500, 300, 300),
  hot: { abs: 1, quads: 0.25 },
  knee: -1,
  back: () => (
    <g>
      <Pad a={[22, 86]} b={[74, 70]} w={4.5} />
      <Tube pts={[[40, 104], [40, 82]]} />
      <Tube pts={[[72, 104], [72, 72]]} />
      <Roller c={[88, 63]} />
    </g>
  ),
})
// dead bug: on the back, opposite arm and leg reach long while the back stays flat
const DB: Key = { hip: [62, 97], torso: -90, tilt: 0, ankle: [80, 74], toe: -20, grip: [42, 70], grip2: [42, 70] }
export const deadBug = makeClip({
  keys: [DB, key(DB, { ankle: [102, 92], toe: -10, grip2: [14, 92] })],
  steps: liftFirst(1000, 1200, 400, 300),
  hot: { abs: 1 },
  knee: -1,
})

// --- full body ---------------------------------------------------------------------------------------
const DL_START: Key = { hip: [41, 73], torso: 63, tilt: -18, ankle: [56, ANK], grip: [59, 92] }
export const powerClean = makeClip({
  keys: [
    DL_START,
    key(STAND, { hip: [59, 50], torso: -6, tilt: 6, ankle: [59, 95], toe: 28, hand: [1, 26.4], shrug: 3 }),
    { ...squatBottom(18, 0.45), ...FRONTRACK },
    key(STAND, { ...FRONTRACK }),
  ],
  steps: [
    { to: 0, ms: 500 }, { to: 1, ms: 650, ease: ease.drive, push: true }, { to: 2, ms: 300, ease: ease.out },
    { to: 3, ms: 700, push: true }, { to: 3, ms: 500, ease: ease.linear }, { to: 0, ms: 1100, ease: ease.lower },
  ],
  hot: { glutes: 1, hams: 0.8, quads: 0.7, traps: 0.8, delts: 0.4 },
  back: barbell().back,
  front: barbell().front,
})
export const thruster = makeClip({
  keys: [
    key(STAND, { ...FRONTRACK }),
    { ...squatBottom(22), ...FRONTRACK },
    key(STAND, { hand: [0.4, -27.2], el: [0.3, -14.6], tilt: 4 }),
  ],
  steps: [
    { to: 0, ms: 400 }, { to: 1, ms: 1200, ease: ease.lower }, { to: 2, ms: 1000, ease: ease.drive, push: true },
    { to: 2, ms: 300 }, { to: 0, ms: 800, ease: ease.lower },
  ],
  hot: { quads: 1, glutes: 0.8, delts: 0.9, triceps: 0.5 },
  back: barbell().back,
  front: barbell().front,
})
export const burpee = makeClip({
  keys: [
    key(STAND, { hand: DOWN }),
    { hip: [48, 82], torso: 50, tilt: -10, ankle: [52, ANK], grip: [70, 99] },
    { hip: [48, 79], torso: 76, tilt: 4, ankle: [6, 92.5], toe: 70, grip: [72, 99] },
    key(STAND, { hip: [56, 42], ankle: [56, 86], toe: 30, hand: [1, -27], el: [0.5, -14.6] }),
  ],
  steps: [
    { to: 1, ms: 450 }, { to: 2, ms: 380 }, { to: 2, ms: 250 }, { to: 1, ms: 380 }, { to: 3, ms: 420, ease: ease.out, push: true },
    { to: 0, ms: 380, ease: ease.in }, { to: 0, ms: 250 },
  ],
  hot: { quads: 0.8, chest: 0.6, delts: 0.4, abs: 0.4 },
})

// --- cardio --------------------------------------------------------------------------------------------
const RUN: Key = { hip: [56, 56], torso: 10, tilt: -6, ankle: [56, ANK] }
export const treadmill = makeClip({
  keys: [
    key(RUN, { hip: [56, 58], ankle: [66, 99], toe: -10, ankle2: [36, 86], toe2: 40, hand: [-6, 20], el: [-7, 12], hand2: [12, 8], el2: [3, 14] }),
    key(RUN, { hip: [56, 54], ankle: [50, 92], toe: 20, ankle2: [58, 82], toe2: 10, hand: [3, 16], el: [-3, 14], hand2: [3, 16], el2: [-3, 14] }),
    key(RUN, { hip: [56, 58], ankle: [36, 86], toe: 40, ankle2: [66, 99], toe2: -10, hand: [12, 8], el: [3, 14], hand2: [-6, 20], el2: [-7, 12] }),
    key(RUN, { hip: [56, 54], ankle: [58, 82], toe: 10, ankle2: [50, 92], toe2: 20, hand: [3, 16], el: [-3, 14], hand2: [3, 16], el2: [-3, 14] }),
  ],
  steps: cycle(190, 4).map((s) => ({ ...s, ease: ease.linear })),
  hot: { quads: 0.8, hams: 0.6, calves: 0.7, glutes: 0.5 },
  back: () => (
    <g>
      <Tube pts={[[86, 104], [92, 50], [80, 46]]} w={2.6} />
      <rect x={18} y={101} width={78} height={3} rx={1.5} fill="var(--fig-pad, #303338)" />
    </g>
  ),
})
// bike: feet go round the cranks
const CRANK: V = [70, 90]
const pedal = (a: number): V => add(CRANK, dir(a), 7)
const BIKE: Key = { hip: [52, 64], torso: 38, tilt: -16, ankle: [70, 90], grip: [86, 54] }
export const stationaryBike = makeClip({
  keys: [0, 90, 180, 270].map((a) => key(BIKE, { ankle: add(pedal(a), [-2, -3]), ankle2: add(pedal(a + 180), [-2, -3]), toe: 10, toe2: 10, load: 0.6 })),
  steps: cycle(230, 4).map((s) => ({ ...s, ease: ease.linear })),
  hot: { quads: 1, glutes: 0.5, calves: 0.4 },
  back: () => (
    <g>
      <Tube pts={[[46, 104], [52, 72]]} w={3} />
      <Pad a={[44, 70]} b={[56, 70]} w={3.4} />
      <Tube pts={[[52, 80], CRANK, [86, 56], [90, 54]]} w={2.6} />
      <circle cx={CRANK[0]} cy={CRANK[1]} r={7} fill="none" stroke="var(--fig-scene-edge, #3a3d43)" strokeWidth={1} />
      <Tube pts={[[60, 104], [96, 104]]} w={3} />
    </g>
  ),
})
// rowing machine: legs, then back, then arms; and back in reverse
const ROWER: Key = { hip: [40, 92], torso: 0, tilt: 0, ankle: [84, 94], toe: -30, grip: [88, 84] }
export const rowingMachine = makeClip({
  keys: [
    key(ROWER, { hip: [62, 92], torso: 26, grip: [92, 84], load: 0.3 }),
    key(ROWER, { hip: [40, 92], torso: 8, grip: [72, 82] }),
    key(ROWER, { hip: [40, 92], torso: -18, grip: [50, 78] }),
  ],
  steps: [{ to: 1, ms: 520, push: true, ease: ease.drive }, { to: 2, ms: 360 }, { to: 1, ms: 500 }, { to: 0, ms: 700, ease: ease.inOut }],
  hot: { quads: 0.8, lats: 0.8, glutes: 0.5, biceps: 0.4 },
  back: (j) => (
    <g>
      <Tube pts={[[10, 100], [104, 100]]} w={3} />
      <Pad a={[j.near.hip[0] - 7, 97]} b={[j.near.hip[0] + 6, 97]} w={3.4} />
      <circle cx={104} cy={86} r={9} fill="var(--fig-scene, #26282c)" stroke="var(--fig-scene-edge, #3a3d43)" strokeWidth={1} />
      <Cable from={[100, 84]} to={j.grip} handle="bar" />
      <Pad a={[82, 98]} b={[88, 90]} w={3} />
    </g>
  ),
})
export const jumpRope = makeClip({
  keys: [
    key(STAND, { hip: [56, 57], ankle: [56, 99], toe: 10, hand: [7, 23], el: [-1, 14], load: 0.5 }),
    key(STAND, { hip: [56, 51], ankle: [56, 94], toe: 26, hand: [8, 22], el: [-1, 14], load: 0.5 }),
  ],
  steps: cycle(230, 2),
  hot: { calves: 1, delts: 0.3 },
  back: (j) => {
    // the rope turns once per jump: over the head, then under the feet
    const a = ((j.t % 460) / 460) * 360
    const c: V = [(j.grip[0] + j.grip2[0]) / 2 - 3, (j.grip[1] + GROUND) / 2 - 4]
    const p = add(c, [Math.sin((a * Math.PI) / 180) * 20, -Math.cos((a * Math.PI) / 180) * 92])
    return <path d={`M${j.grip[0]} ${j.grip[1]}Q${p[0]} ${p[1]} ${j.grip2[0]} ${j.grip2[1]}`} fill="none" stroke="var(--fig-rim, #7d8087)" strokeWidth={0.9} />
  },
})

function angle(a: V, b: V) {
  return (Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180) / Math.PI
}
export { inTorso, all }
