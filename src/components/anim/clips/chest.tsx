import { ANK, all, key, liftFirst, lowerFirst, makeClip, type Joints, type Key } from '../engine'
import { Bench, Cable, Column, Pad, Tube, barbell, dumbbells, Stack, along } from '../kit'
import type { V } from '../rig'

// lying on a flat bench, head to the left, feet on the floor
export const LIE: Key = { hip: [68, 74], torso: -90, tilt: 0, ankle: [90, ANK], grip: [45, 46] }
const flat = () => <Bench x0={22} x1={76} />
const CHEST = { chest: 1, delts: 0.55, triceps: 0.6 }

export const benchPress = makeClip({
  keys: [key(LIE, { grip: [45.5, 45], el: [1, -14.8] }), key(LIE, { grip: [49.5, 65.5], el: [6, 8], fs: 0.62 })],
  steps: lowerFirst(1500, 1000),
  hot: CHEST,
  back: all(flat, barbell().back),
  front: barbell().front,
})

// incline: bench back raised about 35°
const INC: Key = { hip: [64, 77], torso: -56, ankle: [88, ANK], grip: [45, 36] }
const incline = () => (
  <g>
    <Tube pts={[[60, 104], [60, 84]]} />
    <Pad a={[54, 82]} b={[72, 82]} w={4.5} />
    <Pad a={[57, 80]} b={[30, 61]} w={4.5} />
  </g>
)
export const inclineBench = makeClip({
  keys: [key(INC, { grip: [44, 36] }), key(INC, { grip: [50, 54], el: [8, 6], fs: 0.62 })],
  steps: lowerFirst(1500, 1000),
  hot: { chest: 1, delts: 0.75, triceps: 0.55 },
  back: all(incline, barbell().back),
  front: barbell().front,
})

// decline: head lower than hips, legs hooked under a roller
const DEC: Key = { hip: [66, 70], torso: -108, ankle: [86, 88], toe: 20, grip: [44, 51] }
const decline = () => (
  <g>
    <Tube pts={[[50, 104], [50, 80]]} />
    <Tube pts={[[82, 104], [82, 80]]} />
    <Pad a={[24, 82]} b={[72, 68]} w={4.5} />
    <Pad a={[78, 85]} b={[90, 85]} w={4} />
  </g>
)
export const declineBench = makeClip({
  keys: [key(DEC, { grip: [44, 50] }), key(DEC, { grip: [49, 67], el: [6, 8], fs: 0.62 })],
  steps: lowerFirst(1500, 1000),
  hot: { chest: 1, triceps: 0.6, delts: 0.35 },
  back: all(decline, barbell().back),
  front: barbell().front,
})

export const dumbbellBench = makeClip({
  keys: [key(LIE, { grip: [45.5, 45], el: [1, -14.8] }), key(LIE, { grip: [47, 67.5], el: [5, 9], fs: 0.6 })],
  steps: lowerFirst(1500, 1000),
  hot: CHEST,
  back: all(flat, dumbbells().back),
  front: dumbbells().front,
})

export const inclineDumbbellPress = makeClip({
  keys: [key(INC, { grip: [44, 36] }), key(INC, { grip: [47, 57], el: [7, 7], fs: 0.58 })],
  steps: lowerFirst(1500, 1000),
  hot: { chest: 1, delts: 0.75, triceps: 0.5 },
  back: all(incline, dumbbells().back),
  front: dumbbells().front,
})

// flys: arms open out to the sides, so from the side the hands drop towards the shoulder
export const dumbbellFly = makeClip({
  keys: [key(LIE, { grip: [45, 46.5], el: [1.5, -15] }), key(LIE, { grip: [46, 70.5], el: [2, 1], fs: 0.32, ff: 0.45 })],
  steps: lowerFirst(1700, 1200),
  hot: { chest: 1, delts: 0.45 },
  back: all(flat, dumbbells().back),
  front: dumbbells().front,
})

// cable crossover: split stance between two high pulleys, hands sweep down and together
const xover = (j: Joints) => (
  <g>
    <Column x={36} top={4} />
    <Cable from={[38, 10]} to={j.grip} />
  </g>
)
const XO: Key = { hip: [54, 57], torso: 16, ankle: [64, ANK], ankle2: [42, ANK], toe: 0 }
export const cableCrossover = makeClip({
  keys: [key(XO, { hand: [0, 2], el: [-6, 9] }), key(XO, { hand: [18, 20], el: [4, 14] })],
  steps: liftFirst(1000, 1500),
  hot: { chest: 1, delts: 0.4 },
  back: xover,
})

// seated machine press: handles beside the chest push straight forward
const SEAT: Key = { hip: [48, 76], torso: -6, ankle: [72, ANK], grip: [52, 53] }
const chestMachine = (j: Joints) => {
  const pivot: V = [44, 20]
  return (
    <g>
      <Stack x={22} y={40} h={40} />
      <Tube pts={[[30, 104], [30, 14], [44, 14]]} />
      <Pad a={[44, 82]} b={[60, 82]} />
      <Pad a={[42, 76]} b={[36, 44]} w={5} />
      <Tube pts={[pivot, along(pivot, j.grip, 1)]} w={2} color="var(--fig-scene-edge, #3a3d43)" />
    </g>
  )
}
export const machineChestPress = makeClip({
  keys: [key(SEAT, { grip: [55, 54] }), key(SEAT, { grip: [74, 52] })],
  steps: liftFirst(1000, 1500),
  hot: CHEST,
  elbow: 1,
  back: chestMachine,
})

// pec deck: forearms on pads, elbows sweep from beside the body to in front
const pecDeck = (j: Joints) => (
  <g>
    <Stack x={22} y={40} h={40} />
    <Tube pts={[[30, 104], [30, 14], [50, 14], [50, 22]]} />
    <Pad a={[44, 82]} b={[60, 82]} />
    <Pad a={[42, 76]} b={[36, 44]} w={5} />
    <Pad a={j.near.elbow} b={j.grip} w={3.6} />
  </g>
)
export const pecDeckClip = makeClip({
  keys: [key(SEAT, { grip: [41.5, 38.1], el: [-4.7, 1.4], fs: 0.32 }), key(SEAT, { grip: [61.5, 38.2], el: [15.3, 1.5] })],
  steps: liftFirst(1000, 1500),
  hot: { chest: 1, delts: 0.3 },
  back: pecDeck,
})

export const smithBench = makeClip({
  keys: [key(LIE, { grip: [49, 45.5], el: [4, -14.4] }), key(LIE, { grip: [49, 65.5], el: [6, 8], fs: 0.62 })],
  steps: lowerFirst(1500, 1000),
  hot: CHEST,
  back: all(flat, () => <g><Tube pts={[[46, 104], [46, 6]]} w={2} /><Tube pts={[[54, 104], [54, 6]]} w={2} /></g>, barbell(8).back),
  front: barbell(8).front,
})

// push-up: straight line from heels to head, chest to the floor
const PU: Key = { hip: [52, 76.5], torso: 73, tilt: 4, ankle: [9, 91.4], toe: 70, grip: [75, 99] }
export const pushUp = makeClip({
  keys: [key(PU, { el: [-2.5, 14.3] }), key(PU, { hip: [53, 85], torso: 82, el: [-8.5, 3.5], fs: 0.6 })],
  steps: lowerFirst(1300, 900, 400, 150),
  hot: { chest: 1, triceps: 0.7, delts: 0.5, abs: 0.3 },
  elbow: -1,
})
export const diamondPushUp = makeClip({
  keys: [key(PU, { grip: [72, 99], el: [-3, 14.2] }), key(PU, { hip: [53, 85], torso: 82, grip: [72, 99], el: [-8.5, 3], fs: 0.6 })],
  steps: lowerFirst(1300, 900, 400, 150),
  hot: { triceps: 1, chest: 0.7, delts: 0.4 },
  elbow: -1,
})

// dips between parallel bars; leaning forward works the chest, upright works the triceps
const bars = () => <Tube pts={[[46, 104], [46, 54], [80, 54], [80, 104]]} w={2.6} />
const nearBar = () => <Tube pts={[[40, 104], [40, 55], [84, 55]]} w={2.8} color="var(--fig-pad, #303338)" />
const DIP: Key = { hip: [55, 46], torso: 6, ankle: [44, 80], ankle2: [42, 78], toe: 30, grip: [60, 52] }
export const chestDip = makeClip({
  keys: [key(DIP, { hip: [55, 46], torso: 8 }), key(DIP, { hip: [49, 63], torso: 26, ankle: [38, 92], ankle2: [36, 90] })],
  steps: lowerFirst(1400, 1000),
  hot: { chest: 1, triceps: 0.75, delts: 0.45 },
  elbow: 1,
  back: bars,
  front: nearBar,
})
export const tricepsDip = makeClip({
  keys: [key(DIP, { hip: [57, 46], torso: 2 }), key(DIP, { hip: [55, 63], torso: 8, ankle: [44, 92], ankle2: [42, 90] })],
  steps: lowerFirst(1400, 1000),
  hot: { triceps: 1, chest: 0.5, delts: 0.35 },
  elbow: 1,
  back: bars,
  front: nearBar,
})

