import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BODY, add, blob, dir, frame, glutePatch, headShape, patch, segment, shoeShape, torsoShape, PROFILE, type V } from './rig'

export type Muscle = 'quads' | 'glutes' | 'hams' | 'calves' | 'chest' | 'delts' | 'triceps' | 'biceps' | 'lats' | 'traps' | 'abs' | 'lowback' | 'forearms'

export interface Side { ankle: V; knee: V; hip: V; shoulder: V; elbow: V; wrist: V; toe?: number }
export interface Pose {
  ground: number
  near: Side
  far: Side
  neck: V // base of the neck (top of the torso)
  headUp: number // head axis, degrees from vertical
  chest?: number // 1 = normal; a little more while bracing
  hot: Partial<Record<Muscle, number>> // working muscles and how hard (0..1)
  back?: ReactNode // drawn behind the body (equipment, far plate)
  mid?: ReactNode // between far limbs and the body
  front?: ReactNode // drawn over the body (near plate, handle)
  shadowX?: number
  view?: [number, number, number, number] // viewBox crop for this clip
}
export interface Clip {
  pose: (ms: number) => Pose
  still: number // ms at which to freeze for a still thumbnail
  marks?: number[] // ms where each step ends (key poses), for previews
}

const C = {
  near: 'var(--fig-near, #dedbd4)',
  far: 'var(--fig-far, #55585e)',
  edge: 'var(--color-bg, #0c0d0e)',
  hot: 'var(--color-accent, #ff6b2c)',
  shoe: 'var(--fig-shoe, #8e9197)',
  shoeFar: 'var(--fig-shoe-far, #3e4045)',
  line: 'var(--color-line, #2a2c30)',
}
export const KIT = { metal: 'var(--fig-metal, #a3a6ac)', plate: 'var(--fig-plate, #2a2c31)', rim: 'var(--fig-rim, #7d8087)', scene: C.line }

function heat(h: number | undefined) {
  return h ? 0.35 + 0.65 * Math.min(1, h) : 0
}

function Leg({ s, fill, shoe, hot, near }: { s: Side; ground?: number; fill: string; shoe: string; hot: Pose['hot']; near: boolean }) {
  const thigh = segment(s.hip, s.knee, PROFILE.thigh)
  const shin = segment(s.knee, s.ankle, PROFILE.shin)
  const q = near ? heat(hot.quads) : 0
  const hm = near ? heat(hot.hams) : 0
  const cv = near ? heat(hot.calves) : 0
  return (
    <g>
      {fill !== 'none' && <path d={shin} fill={fill} />}
      {cv > 0 && <path d={patch(s.knee, s.ankle, [[0.1, -1.5], [0.24, -4.5], [0.5, -3.6], [0.66, -1.2], [0.35, -0.4]])} fill={C.hot} opacity={cv} />}
      <path d={shoeShape(s.ankle, s.toe ?? 0)} fill={shoe} stroke={C.edge} strokeWidth={0.8} paintOrder="stroke" />
      {fill !== 'none' && <path d={thigh} fill={fill} />}
      {q > 0 && <path d={patch(s.hip, s.knee, [[0.1, 2.6], [0.24, 6.3], [0.55, 5.4], [0.86, 3.9], [0.94, 1.2], [0.6, 0.6], [0.3, 0.4]])} fill={C.hot} opacity={q} />}
      {hm > 0 && <path d={patch(s.hip, s.knee, [[0.12, -2.5], [0.3, -5.6], [0.62, -4.6], [0.88, -3.2], [0.85, -0.8], [0.4, -0.6]])} fill={C.hot} opacity={hm} />}
    </g>
  )
}

function Arm({ s, fill, hot, near }: { s: Side; fill: string; hot: Pose['hot']; near: boolean }) {
  const P = frame(s.elbow, s.wrist)
  const d = heat(near ? hot.delts : 0), b = heat(near ? hot.biceps : 0), t = heat(near ? hot.triceps : 0), fa = heat(near ? hot.forearms : 0)
  return (
    <g>
      <path d={segment(s.shoulder, s.elbow, PROFILE.upper)} fill={fill} />
      {d > 0 && <path d={patch(s.shoulder, s.elbow, [[-0.14, 0], [-0.02, 3.9], [0.32, 3.4], [0.36, -0.2], [0.3, -3.2], [-0.04, -3.6]])} fill={C.hot} opacity={d} />}
      {b > 0 && <path d={patch(s.shoulder, s.elbow, [[0.3, 2.2], [0.5, 3.5], [0.86, 2.6], [0.9, 0.8], [0.55, 0.6]])} fill={C.hot} opacity={b} />}
      {t > 0 && <path d={patch(s.shoulder, s.elbow, [[0.22, -2.2], [0.42, -3.4], [0.86, -2.6], [0.9, -0.8], [0.5, -0.6]])} fill={C.hot} opacity={t} />}
      <path d={segment(s.elbow, s.wrist, PROFILE.fore)} fill={fill} />
      {fa > 0 && <path d={patch(s.elbow, s.wrist, [[0.08, 1], [0.25, 2.9], [0.65, 2], [0.7, -1.8], [0.25, -2.6]])} fill={C.hot} opacity={fa} />}
      <path d={segment(s.wrist, P(1.3, 0), [[0, 1.9, 1.7], [1, 1.6, 1.6]])} fill={fill} />
    </g>
  )
}

export function Body({ p }: { p: Pose }) {
  const n = p.near
  const torso = torsoShape(n.hip, p.neck, p.chest ?? 1)
  const ax = dir(p.headUp)
  const neckTop = add(p.neck, ax, BODY.neck)
  const head = add(neckTop, ax, 4.6)
  const T = frame(n.hip, p.neck)
  const pt = (t: number, fwd: number) => T(t, -fwd)
  const thighD = segment(n.hip, n.knee, PROFILE.thigh)
  const sil = [torso, segment(p.neck, neckTop, PROFILE.neck), headShape(head, p.headUp), thighD, segment(n.knee, n.ankle, PROFILE.shin)]
  const g = heat(p.hot.glutes), ch = heat(p.hot.chest), ab = heat(p.hot.abs), lt = heat(p.hot.lats), lb = heat(p.hot.lowback), tr = heat(p.hot.traps)
  return (
    <g strokeLinejoin="round">
      {/* far limbs */}
      <g>
        <Arm s={p.far} fill={C.far} hot={p.hot} near={false} />
        <Leg s={p.far} ground={p.ground} fill={C.far} shoe={C.shoeFar} hot={p.hot} near={false} />
      </g>
      {p.mid}
      {/* near body: one silhouette (outline pass, then fill pass) so joints merge cleanly */}
      <g stroke={C.edge} strokeWidth={2} fill="none">{sil.map((d, i) => <path key={i} d={d} />)}</g>
      <g fill={C.near}>{sil.map((d, i) => <path key={i} d={d} />)}</g>
      <path d={thighD} fill="none" stroke={C.edge} strokeWidth={0.6} opacity={0.45} />
      <Leg s={n} ground={p.ground} fill="none" shoe={C.shoe} hot={p.hot} near />
      <g>
        {g > 0 && <path d={glutePatch(n.hip, p.neck)} fill={C.hot} opacity={g} />}
        {ch > 0 && <path d={patchPts([pt(0.86, 5.8), pt(0.66, 6.8), pt(0.56, 4.8), pt(0.62, 1.2), pt(0.84, 1.4)])} fill={C.hot} opacity={ch} />}
        {ab > 0 && <path d={patchPts([pt(0.5, 5.2), pt(0.28, 4.9), pt(0.1, 4.6), pt(0.12, 2.4), pt(0.48, 2.6)])} fill={C.hot} opacity={ab} />}
        {lt > 0 && <path d={patchPts([pt(0.78, -5.6), pt(0.5, -5.4), pt(0.36, -3.6), pt(0.6, -1.6), pt(0.78, -2.6)])} fill={C.hot} opacity={lt} />}
        {lb > 0 && <path d={patchPts([pt(0.42, -4.8), pt(0.2, -5.4), pt(0.14, -3), pt(0.4, -2.6)])} fill={C.hot} opacity={lb} />}
        {tr > 0 && <path d={patchPts([pt(1.0, -2.6), pt(0.9, -6.2), pt(0.78, -5.4), pt(0.84, -2), pt(0.98, -0.6)])} fill={C.hot} opacity={tr} />}
      </g>
      <g stroke={C.edge} strokeWidth={1.1} paintOrder="stroke">
        <Arm s={n} fill={C.near} hot={p.hot} near />
      </g>
    </g>
  )
}
const patchPts = (pts: V[]) => blob(pts)

export function Scene({ p, size, label }: { p: Pose; size: number; label: string }) {
  return (
    <svg viewBox={(p.view ?? [0, 0, 120, 120]).join(' ')} width={size} height={size} role="img" aria-label={label}>
      <ellipse cx={p.shadowX ?? 60} cy={p.ground + 0.6} rx={22} ry={2.2} fill={C.line} opacity={0.8} />
      <line x1={4} y1={p.ground + 0.6} x2={116} y2={p.ground + 0.6} stroke={C.line} strokeWidth={1} strokeLinecap="round" />
      {p.back}
      <Body p={p} />
      {p.front}
    </svg>
  )
}

/** Plays a clip on a loop (or shows its still frame), honouring reduced motion. */
export function ClipPlayer({ clip, size = 160, animate = true, label = 'How the movement looks' }: { clip: Clip; size?: number; animate?: boolean; label?: string }) {
  const [ms, setMs] = useState(clip.still)
  const raf = useRef(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!animate || reduce) {
      setMs(clip.still)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      setMs(now - start)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [clip, animate])
  return <Scene p={clip.pose(ms)} size={size} label={label} />
}
