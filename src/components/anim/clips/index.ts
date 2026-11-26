// Which animation each exercise shows. The top 100 or so have their own clip; every other exercise
// borrows the clip of the closest common lift (same movement and equipment).
import type { Clip } from '../Figure'
import type { Equipment, Exercise, Muscle, Pattern } from '../../../lib/catalogue'
import { squat as backSquat } from './squat'
import * as C from './chest'
import * as B from './back'
import * as U from './upper'
import * as L from './lower'

/** Exercises with an animation made just for them, by exercise id. */
export const OWN: Record<string, Clip> = {
  // chest
  'bench-press': C.benchPress, 'incline-bench-press': C.inclineBench, 'decline-bench-press': C.declineBench,
  'dumbbell-bench-press': C.dumbbellBench, 'incline-dumbbell-press': C.inclineDumbbellPress, 'dumbbell-fly': C.dumbbellFly,
  'cable-crossover': C.cableCrossover, 'machine-chest-press': C.machineChestPress, 'pec-deck': C.pecDeckClip,
  'smith-machine-bench-press': C.smithBench, 'push-up': C.pushUp, 'diamond-push-up': C.diamondPushUp,
  'chest-dip': C.chestDip, 'triceps-dip': C.tricepsDip,
  // back
  deadlift: B.deadlift, 'romanian-deadlift': B.romanianDeadlift, 'stiff-leg-deadlift': B.stiffLegDeadlift,
  'dumbbell-romanian-deadlift': B.dumbbellRDL, 'good-morning': B.goodMorning, 'sumo-deadlift': B.sumoDeadlift,
  'barbell-row': B.barbellRow, 't-bar-row': B.tBarRow, 'one-arm-dumbbell-row': B.oneArmDumbbellRow,
  'chest-supported-dumbbell-row': B.chestSupportedRow, 'lat-pulldown': B.latPulldown, 'seated-cable-row': B.seatedCableRow,
  'straight-arm-pulldown': B.straightArmPulldown, 'machine-row': B.machineRow, 'pull-up': B.pullUp, 'chin-up': B.chinUp,
  'dead-hang': B.deadHang, 'inverted-row': B.invertedRow, 'back-extension': B.backExtension, shrug: B.shrug,
  'dumbbell-shrug': B.dumbbellShrug,
  // shoulders
  'overhead-press': U.overheadPress, 'push-press': U.pushPress, 'seated-dumbbell-shoulder-press': U.seatedDumbbellPress,
  'arnold-press': U.arnoldPress, 'machine-shoulder-press': U.machineShoulderPress, 'lateral-raise': U.lateralRaise,
  'cable-lateral-raise': U.cableLateralRaise, 'front-raise': U.frontRaise, 'rear-delt-fly': U.rearDeltFly,
  'face-pull': U.facePull, 'upright-row': U.uprightRow,
  // arms
  'barbell-curl': U.barbellCurl, 'ez-bar-curl': U.ezBarCurl, 'dumbbell-curl': U.dumbbellCurl, 'hammer-curl': U.hammerCurl,
  'incline-dumbbell-curl': U.inclineDumbbellCurl, 'concentration-curl': U.concentrationCurl, 'preacher-curl': U.preacherCurl,
  'cable-curl': U.cableCurl, 'reverse-curl': U.reverseCurl, 'close-grip-bench-press': U.closeGripBench,
  'skull-crusher': U.skullCrusher, 'triceps-pushdown': U.tricepsPushdown, 'rope-pushdown': U.ropePushdown,
  'overhead-cable-triceps-extension': U.overheadCableExtension, 'overhead-dumbbell-triceps-extension': U.overheadDumbbellExtension,
  'dumbbell-kickback': U.dumbbellKickback, 'bench-dip': U.benchDip, 'farmer-s-carry': U.farmersCarry,
  // legs
  'back-squat': backSquat, 'front-squat': L.frontSquat, 'goblet-squat': L.gobletSquat, 'kettlebell-goblet-squat': L.kettlebellGobletSquat,
  'bodyweight-squat': L.bodyweightSquat, 'hack-squat': L.hackSquat, 'leg-press': L.legPress, 'leg-extension': L.legExtension,
  'seated-leg-curl': L.seatedLegCurl, 'lying-leg-curl': L.lyingLegCurl, 'nordic-curl': L.nordicCurl,
  'bulgarian-split-squat': L.bulgarianSplitSquat, 'reverse-lunge': L.reverseLunge, 'walking-lunge': L.walkingLunge,
  'step-up': L.stepUp, 'hip-thrust': L.hipThrust, 'glute-bridge': L.gluteBridge, 'cable-kickback': L.cableKickback,
  'kettlebell-swing': L.kettlebellSwing, 'standing-calf-raise': L.standingCalfRaise, 'single-leg-calf-raise': L.singleLegCalfRaise,
  'seated-calf-raise': L.seatedCalfRaise,
  // core
  plank: L.plank, crunch: L.crunch, 'hanging-leg-raise': L.hangingLegRaise, 'hanging-knee-raise': L.hangingKneeRaise,
  'cable-crunch': L.cableCrunch, 'ab-wheel-rollout': L.abWheelRollout, 'decline-sit-up': L.declineSitUp, 'dead-bug': L.deadBug,
  // full body and cardio
  'power-clean': L.powerClean, thruster: L.thruster, burpee: L.burpee,
  treadmill: L.treadmill, 'stationary-bike': L.stationaryBike, 'rowing-machine': L.rowingMachine, 'jump-rope': L.jumpRope,
}

/** Close variations that share an animation. */
const SAME: Record<string, string> = {
  'pause-squat': 'back-squat', 'smith-machine-squat': 'back-squat', 'pendlay-row': 'barbell-row', 'rack-pull': 'deadlift',
  'close-grip-lat-pulldown': 'lat-pulldown', 'assisted-pull-up': 'pull-up', 'reverse-pec-deck': 'rear-delt-fly',
  'pike-push-up': 'push-up', 'machine-preacher-curl': 'preacher-curl', 'incline-dumbbell-fly': 'dumbbell-fly',
  'low-to-high-cable-fly': 'cable-crossover', 'wrist-curl': 'reverse-curl', 'reverse-wrist-curl': 'reverse-curl',
  'leg-press-calf-raise': 'leg-press', 'side-plank': 'plank', 'russian-twist': 'crunch', 'pallof-press': 'cable-crossover',
  'clean-and-jerk': 'power-clean', snatch: 'power-clean', 'turkish-get-up': 'burpee', elliptical: 'treadmill',
  'stair-climber': 'step-up', 'hip-abduction-machine': 'seated-calf-raise', 'hip-adduction-machine': 'seated-calf-raise',
}

type ByEq = Partial<Record<Equipment, string>> & { _: string }
const BY_PATTERN: Record<Pattern, ByEq> = {
  squat: { _: 'back-squat', Dumbbell: 'goblet-squat', Kettlebell: 'kettlebell-goblet-squat', Machine: 'hack-squat', Bodyweight: 'bodyweight-squat' },
  hinge: { _: 'romanian-deadlift', Dumbbell: 'dumbbell-romanian-deadlift', Kettlebell: 'kettlebell-swing', Bodyweight: 'back-extension' },
  lunge: { _: 'reverse-lunge' },
  bench: { _: 'bench-press', Dumbbell: 'dumbbell-bench-press', Machine: 'machine-chest-press', 'Smith machine': 'smith-machine-bench-press', Cable: 'cable-crossover' },
  ohp: { _: 'overhead-press', Dumbbell: 'seated-dumbbell-shoulder-press', Kettlebell: 'seated-dumbbell-shoulder-press', Machine: 'machine-shoulder-press' },
  pushup: { _: 'push-up' },
  row: { _: 'barbell-row', Dumbbell: 'one-arm-dumbbell-row', Kettlebell: 'one-arm-dumbbell-row', Cable: 'seated-cable-row', Machine: 'machine-row', Bodyweight: 'inverted-row' },
  pullup: { _: 'pull-up', Cable: 'lat-pulldown', Machine: 'lat-pulldown' },
  curl: { _: 'barbell-curl', 'EZ bar': 'ez-bar-curl', Dumbbell: 'dumbbell-curl', Kettlebell: 'hammer-curl', Cable: 'cable-curl', Machine: 'preacher-curl', Band: 'cable-curl' },
  triext: { _: 'triceps-pushdown', Dumbbell: 'overhead-dumbbell-triceps-extension', Barbell: 'skull-crusher', 'EZ bar': 'skull-crusher', Bodyweight: 'bench-dip' },
  raise: { _: 'lateral-raise', Cable: 'cable-lateral-raise', Barbell: 'front-raise' },
  calf: { _: 'standing-calf-raise', Bodyweight: 'single-leg-calf-raise', Dumbbell: 'single-leg-calf-raise' },
  crunch: { _: 'crunch', Cable: 'cable-crunch' },
  plank: { _: 'plank' },
  legraise: { _: 'hanging-leg-raise' },
  hipthrust: { _: 'hip-thrust', Bodyweight: 'glute-bridge', Cable: 'cable-kickback' },
  legext: { _: 'leg-extension' },
  legcurl: { _: 'lying-leg-curl' },
  dip: { _: 'chest-dip' },
  jump: { _: 'burpee' },
  run: { _: 'treadmill' },
  carry: { _: 'farmer-s-carry' },
}
const BY_MUSCLE: Record<Muscle, string> = {
  Chest: 'bench-press', Back: 'barbell-row', Shoulders: 'overhead-press', Biceps: 'dumbbell-curl', Triceps: 'triceps-pushdown',
  Forearms: 'reverse-curl', Quads: 'back-squat', Hamstrings: 'romanian-deadlift', Glutes: 'hip-thrust', Calves: 'standing-calf-raise',
  Core: 'crunch', 'Full body': 'burpee', Cardio: 'treadmill',
}

/** The animation for an exercise, and whether it was made for this exercise. */
export function clipFor(ex: Pick<Exercise, 'id' | 'pattern' | 'equipment' | 'muscle'>): { clip: Clip; own: boolean } {
  if (OWN[ex.id]) return { clip: OWN[ex.id], own: true }
  const same = SAME[ex.id]
  if (same) return { clip: OWN[same], own: false }
  const p = ex.pattern && BY_PATTERN[ex.pattern]
  const id = p ? (p[ex.equipment] ?? p._) : BY_MUSCLE[ex.muscle] ?? 'back-squat'
  return { clip: OWN[id] ?? backSquat, own: false }
}
