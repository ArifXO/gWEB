// Shoulders and arms.
import { ANK, FRONTRACK, STAND, all, cycle, ease, key, liftFirst, lowerFirst, makeClip, type Joints, type Key, type Step } from '../engine'
import { Bell, BellSide, Bench, Cable, Column, Pad, Stack, Tube, barbell, dumbbells, along } from '../kit'
import { LIE } from './chest'
import type { V } from '../rig'

const DOWN: V = [0.3, 27.4] // arm hanging by the side

// --- shoulders -------------------------------------------------------------------------
export const overheadPress = makeClip({
  keys: [key(STAND, { ...FRONTRACK, tilt: -4 }), key(STAND, { hand: [0.4, -27.2], el: [0.3, -14.6], tilt: 4 })],
  steps: liftFirst(1000, 1400, 500, 250),
  hot: { delts: 1, triceps: 0.7, traps: 0.35, abs: 0.25 },
  back: barbell().back,
  front: barbell().front,
})
const PP_DIP = key(STAND, { ...FRONTRACK, hip: [52.5, 61], tilt: -4, load: 0.4 })
export const pushPress = makeClip({
  keys: [key(STAND, { ...FRONTRACK, tilt: -4 }), PP_DIP, key(STAND, { hand: [0.4, -27.2], el: [0.3, -14.6], tilt: 4 })],
  steps: [
    { to: 0, ms: 500, ease: ease.linear }, { to: 1, ms: 450, ease: ease.lower }, { to: 2, ms: 650, ease: ease.drive, push: true },
    { to: 2, ms: 350, ease: ease.linear }, { to: 0, ms: 1200, ease: ease.lower },
  ],
  hot: { delts: 1, triceps: 0.7, quads: 0.5, glutes: 0.4 },
  back: barbell().back,
  front: barbell().front,
})

// seated on an upright bench
const SIT: Key = { hip: [50, 78], torso: -4, ankle: [70, ANK], hand: DOWN }
const uprightBench = () => (
  <g>
    <Pad a={[42, 82]} b={[60, 82]} />
    <Tube pts={[[50, 104], [50, 84]]} />
    <Pad a={[43, 80]} b={[39, 46]} w={5} />
  </g>
)
export const seatedDumbbellPress = makeClip({
  keys: [key(SIT, { hand: [2.5, -1.5], el: [0.6, 9.5], fs: 0.62 }), key(SIT, { hand: [0.6, -28.6], el: [1.6, -14.5] })],
  steps: liftFirst(1000, 1400, 450, 250),
  arms: 'ik', // dumbbells travel straight up
  hot: { delts: 1, triceps: 0.6 },
  back: all(uprightBench, dumbbells().back),
  front: dumbbells().front,
})
export const arnoldPress = makeClip({
  keys: [key(SIT, { hand: [10, -2], el: [6.5, 9.5] }), key(SIT, { hand: [3, -1.5], el: [0.6, 9.5] }), key(SIT, { hand: [1, -27.4], el: [0.5, -14.6] })],
  steps: [
    { to: 0, ms: 400, ease: ease.linear }, { to: 1, ms: 450 }, { to: 2, ms: 750, push: true }, { to: 2, ms: 250, ease: ease.linear },
    { to: 1, ms: 900, ease: ease.lower }, { to: 0, ms: 500 },
  ],
  hot: { delts: 1, triceps: 0.5, chest: 0.25 },
  back: all(uprightBench, dumbbells().back),
  front: dumbbells().front,
})
const machine = (j: Joints) => (
  <g>
    <Stack x={20} y={30} h={44} />
    <Tube pts={[[30, 104], [30, 8], [52, 8]]} />
    <Tube pts={[[52, 8], j.grip]} w={2} color="var(--fig-scene-edge, #3a3d43)" />
    {uprightBench()}
  </g>
)
export const machineShoulderPress = makeClip({
  keys: [key(SIT, { hand: [4, -1.5], el: [-0.5, 9.5] }), key(SIT, { hand: [3, -27], el: [1.5, -14.5] })],
  steps: liftFirst(1000, 1400),
  hot: { delts: 1, triceps: 0.6 },
  back: machine,
})

// raises: lateral raises lift out to the sides (seen from the side, the arm points at you), front raises go forward
export const lateralRaise = makeClip({
  keys: [key(STAND, { hand: [1.5, 27], el: [0.5, 14] }), key(STAND, { hand: [9.5, 1.5], el: [4.8, 1.6], shrug: 0.3 })],
  steps: liftFirst(900, 1500, 400, 350),
  hot: { delts: 1, traps: 0.3 },
  back: dumbbells(4).back,
  front: dumbbells(4).front,
})
export const cableLateralRaise = makeClip({
  keys: [key(STAND, { hand: [3, 26], el: [1, 14] }), key(STAND, { hand: [9.5, 1.5], el: [4.8, 1.6] })],
  steps: liftFirst(900, 1500, 400, 350),
  hot: { delts: 1 },
  back: (j) => (
    <g>
      <Column x={44} top={60} w={8} />
      <Cable from={[46, 96]} to={j.grip} />
    </g>
  ),
})
export const frontRaise = makeClip({
  keys: [key(STAND, { hand: [2, 27.2], el: [0.8, 14] }), key(STAND, { hand: [27.5, -1], el: [14.5, 0.5] })],
  steps: liftFirst(900, 1500, 400, 350),
  hot: { delts: 1, chest: 0.25 },
  back: dumbbells(4).back,
  front: dumbbells(4).front,
})
const BENT: Key = { hip: [44, 60], torso: 78, tilt: -18, ankle: [56, ANK], hand: [0, 27], el: [0.5, 14] }
export const rearDeltFly = makeClip({
  keys: [BENT, key(BENT, { hand: [-5, 6], el: [-3, 3] })],
  steps: liftFirst(900, 1400, 400, 350),
  hot: { delts: 1, traps: 0.5, lats: 0.25 },
  back: dumbbells(4).back,
  front: dumbbells(4).front,
})
export const reversePecDeck = rearDeltFly
const ROPE_HIGH: V = [98, 26]
export const facePull = makeClip({
  keys: [key(STAND, { hip: [54, 56], torso: -4, ankle: [60, ANK], ankle2: [48, ANK], hand: [27, 4.5], el: [13.5, 3.5] }), key(STAND, { hip: [54, 56], torso: -6, ankle: [60, ANK], ankle2: [48, ANK], hand: [7, -8], el: [-4.8, -0.8] })],
  steps: liftFirst(900, 1400, 400, 350),
  hot: { delts: 1, traps: 0.6 },
  back: (j) => (
    <g>
      <Column x={102} top={4} />
      <Cable from={ROPE_HIGH} to={j.grip} handle="rope" />
    </g>
  ),
})
export const uprightRow = makeClip({
  keys: [key(STAND, { hand: [2, 27.2], el: [0.6, 14] }), key(STAND, { hand: [7, 4], el: [-2, 1], shrug: 1 })],
  steps: liftFirst(900, 1400),
  hot: { delts: 1, traps: 0.8, biceps: 0.3 },
  back: barbell().back,
  front: barbell().front,
})

// --- biceps -------------------------------------------------------------------------------
// upper arm stays pinned to the side; only the forearm moves
const curlKeys = (base: Key, e: V = [-0.5, 15.4], top: V = [8, -11]) => [
  key(base, { el: e, hand: [e[0] + 1.6, e[1] + 13.3] }),
  key(base, { el: [e[0] + 1, e[1] - 0.6], hand: [e[0] + 1 + top[0], e[1] - 0.6 + top[1]], tilt: 2 }),
]
const CURL = { biceps: 1, forearms: 0.5 }
export const barbellCurl = makeClip({ keys: curlKeys(STAND), steps: liftFirst(), hot: CURL, back: barbell().back, front: barbell().front })
export const ezBarCurl = makeClip({ keys: curlKeys(STAND), steps: liftFirst(), hot: CURL, back: barbell(7.2).back, front: barbell(7.2).front })
export const dumbbellCurl = makeClip({ keys: curlKeys(STAND), steps: liftFirst(), hot: CURL, back: dumbbells().back, front: dumbbells().front })
export const hammerCurl = makeClip({
  keys: curlKeys(STAND),
  steps: liftFirst(),
  hot: { biceps: 0.85, forearms: 0.9 },
  back: (j) => <BellSide c={j.grip2} angle={angleOf(j.far.elbow, j.far.wrist)} far />,
  front: (j) => <BellSide c={j.grip} angle={angleOf(j.near.elbow, j.near.wrist)} />,
})
export const reverseCurl = makeClip({ keys: curlKeys(STAND), steps: liftFirst(), hot: { forearms: 1, biceps: 0.7 }, back: barbell(7.2).back, front: barbell(7.2).front })
export const cableCurl = makeClip({
  keys: curlKeys(key(STAND, { ankle: [56, ANK] })),
  steps: liftFirst(),
  hot: CURL,
  back: (j) => (
    <g>
      <Column x={84} top={56} w={8} />
      <Cable from={[82, 98]} to={j.grip} handle="bar" />
    </g>
  ),
})
// incline bench: arms hang straight down behind the body for a long stretch
const INCL: Key = { hip: [56, 80], torso: -32, ankle: [78, ANK], hand: DOWN }
export const inclineDumbbellCurl = makeClip({
  keys: [key(INCL, { el: [0, 15.4], hand: [0.5, 28.8] }), key(INCL, { el: [1, 15], hand: [8, 3.2] })],
  steps: liftFirst(),
  hot: CURL,
  back: (j) => (
    <g>
      <Pad a={[48, 84]} b={[68, 84]} />
      <Tube pts={[[56, 104], [56, 86]]} />
      <Pad a={[50, 82]} b={[36, 54]} w={5} />
      {dumbbells().back(j)}
    </g>
  ),
  front: dumbbells().front,
})
// seated, elbow braced against the inside of the thigh
const CONC: Key = { hip: [46, 80], torso: 42, tilt: -12, ankle: [70, ANK], ankle2: [62, ANK], hand2: [10, 12], el2: [6, 12] }
export const concentrationCurl = makeClip({
  keys: [key(CONC, { el: [4, 14.8], hand: [9.5, 27] }), key(CONC, { el: [4.5, 14.6], hand: [9.8, 2.2] })],
  steps: liftFirst(),
  hot: CURL,
  back: () => <Bench x0={20} x1={60} y={84} />,
  front: (j) => <Bell c={j.grip} />,
})
// preacher: back of the upper arm flat on a sloped pad
const PREACH: Key = { hip: [48, 80], torso: 12, tilt: -6, ankle: [64, ANK] }
const preacherPad = () => (
  <g>
    <Tube pts={[[60, 104], [60, 72]]} />
    <Pad a={[58, 56]} b={[72, 72]} w={5} />
    <Pad a={[40, 84]} b={[56, 84]} />
  </g>
)
export const preacherCurl = makeClip({
  keys: [key(PREACH, { el: [11, 10.8], hand: [23, 17] }), key(PREACH, { el: [11, 10.6], hand: [9, -2.6] })],
  steps: liftFirst(1000, 1700),
  hot: CURL,
  back: all(preacherPad, barbell(7.2).back),
  front: barbell(7.2).front,
})
export const machinePreacherCurl = preacherCurl

// --- triceps -----------------------------------------------------------------------------------
export const closeGripBench = makeClip({
  keys: [key(LIE, { grip: [46, 45], el: [2.5, -14.6] }), key(LIE, { grip: [55.5, 64], el: [11.5, 6], fs: 0.84 })],
  steps: lowerFirst(1500, 1000),
  hot: { triceps: 1, chest: 0.65, delts: 0.45 },
  back: all(() => <Bench x0={22} x1={76} />, barbell().back),
  front: barbell().front,
})
// skull crusher: upper arms still, forearms fold back towards the forehead
export const skullCrusher = makeClip({
  keys: [key(LIE, { el: [-3, -15.2], grip: [36.6, 43] }), key(LIE, { el: [-3.4, -15.1], grip: [30.6, 64] })],
  steps: lowerFirst(1500, 1000),
  arms: 'swing', // upper arms stay still; only the forearms move
  hot: { triceps: 1 },
  back: all(() => <Bench x0={22} x1={76} />, barbell(7.2).back),
  front: barbell(7.2).front,
})
const PD: Key = { hip: [54, 56], torso: 10, tilt: -8, ankle: [58, ANK], ankle2: [52, ANK] }
const highCable = (handle: 'bar' | 'rope') => (j: Joints) => (
  <g>
    <Column x={86} top={4} />
    <Cable from={[82, 10]} to={j.grip} handle={handle} />
  </g>
)
const pushdownKeys = [key(PD, { el: [1, 15.4], hand: [9, 4.4] }), key(PD, { el: [1.5, 15.3], hand: [3.5, 28.5] })]
export const tricepsPushdown = makeClip({ keys: pushdownKeys, steps: liftFirst(800, 1300, 400, 300), hot: { triceps: 1 }, back: highCable('bar') })
export const ropePushdown = makeClip({ keys: pushdownKeys, steps: liftFirst(800, 1300, 400, 300), hot: { triceps: 1 }, back: highCable('rope') })
// overhead extensions: elbows point up, hands drop behind the head and press up
export const overheadCableExtension = makeClip({
  keys: [
    key(STAND, { torso: 22, hip: [52, 56], ankle: [62, ANK], ankle2: [42, ANK], el: [9, -12.4], hand: [-3.8, -8] }),
    key(STAND, { torso: 22, hip: [52, 56], ankle: [62, ANK], ankle2: [42, ANK], el: [9, -12.4], hand: [17.5, -23.4] }),
  ],
  steps: liftFirst(900, 1400),
  hot: { triceps: 1 },
  back: (j) => (
    <g>
      <Column x={20} top={4} />
      <Cable from={[22, 12]} to={j.grip} handle="rope" />
    </g>
  ),
})
export const overheadDumbbellExtension = makeClip({
  keys: [key(STAND, { el: [2.5, -15.2], hand: [-7, -4.8], tilt: 4 }), key(STAND, { el: [2.5, -15.2], hand: [4, -28.6] })],
  steps: lowerFirst(1400, 1000),
  hot: { triceps: 1 },
  front: (j) => <Bell c={j.grip} r={5} />,
})
// kickback: torso flat, upper arm along the body, forearm swings back
const KB: Key = { hip: [44, 62], torso: 76, tilt: -15, ankle: [58, ANK], ankle2: [36, ANK], grip2: [82, 77] }
export const dumbbellKickback = makeClip({
  keys: [key(KB, { el: [-15, 3.7], hand: [-15, 17.2] }), key(KB, { el: [-15, 3.7], hand: [-28.2, 6.5] })],
  steps: liftFirst(800, 1300, 400, 400),
  hot: { triceps: 1 },
  back: () => <Bench x0={68} x1={104} y={80} />,
  front: (j) => <BellSide c={j.grip} angle={angleOf(j.near.elbow, j.near.wrist)} />,
})
// bench dip: hands on a bench behind, heels on the floor in front
const BD: Key = { hip: [55, 70], torso: 2, tilt: 0, ankle: [88, 99], toe: -40, grip: [49, 78] }
export const benchDip = makeClip({
  keys: [BD, key(BD, { hip: [54, 84], torso: 6 })],
  steps: lowerFirst(1300, 900),
  hot: { triceps: 1, delts: 0.4, chest: 0.3 },
  back: () => <Bench x0={20} x1={52} y={80} />,
})

// --- forearms -----------------------------------------------------------------------------------
// walking in place with a heavy dumbbell in each hand
const W: Key = key(STAND, { hand: DOWN, el: [0.3, 14] })
export const walkSteps = (ms = 360): Step[] => cycle(ms, 4)
export const walkKeys = (base: Key): Key[] => [
  key(base, { ankle: [66, ANK], ankle2: [46, ANK], toe: -14, toe2: 18, hip: [base.hip[0], base.hip[1] + 1.4] }),
  key(base, { ankle: [57, ANK], ankle2: [52, 93], toe: 0, toe2: 10 }),
  key(base, { ankle: [46, ANK], ankle2: [66, ANK], toe: 18, toe2: -14, hip: [base.hip[0], base.hip[1] + 1.4] }),
  key(base, { ankle: [52, 93], ankle2: [57, ANK], toe: 10, toe2: 0 }),
]
export const farmersCarry = makeClip({
  keys: walkKeys(W).map((k) => ({ ...k, load: 0.8 })),
  steps: walkSteps(),
  hot: { forearms: 1, traps: 0.7, abs: 0.4 },
  back: dumbbells(4.8).back,
  front: dumbbells(4.8).front,
})

function angleOf(a: V, b: V) {
  const d = [b[0] - a[0], b[1] - a[1]]
  return (Math.atan2(d[0], -d[1]) * 180) / Math.PI
}
export { along }
