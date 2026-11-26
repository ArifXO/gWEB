// Equipment and gym furniture for the figure, all drawn from simple shapes.
import { add, blob, dir, sub, type V } from './rig'
import { KIT } from './Figure'
import type { Joints } from './engine'

const S = { fill: 'var(--fig-scene, #26282c)', edge: 'var(--fig-scene-edge, #3a3d43)', pad: 'var(--fig-pad, #303338)', cable: 'var(--fig-cable, #6c6f75)' }
export const SCENE = S
const BG = 'var(--color-bg, #0c0d0e)'

/** A weight plate seen face-on (side view of a barbell). */
export function Plate({ c, r = 9.6, dim = false }: { c: V; r?: number; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.85 : 1}>
      <circle cx={c[0]} cy={c[1]} r={r} fill={KIT.plate} stroke={KIT.rim} strokeWidth={r > 8 ? 1.4 : 1.1} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.64} fill="none" stroke={KIT.rim} strokeWidth={0.6} opacity={0.5} />
      <circle cx={c[0]} cy={c[1]} r={Math.min(2.1, r * 0.25)} fill={KIT.metal} />
    </g>
  )
}
export const Hub = ({ c, r = 2.2 }: { c: V; r?: number }) => <circle cx={c[0]} cy={c[1]} r={r} fill={KIT.metal} stroke={BG} strokeWidth={0.8} />

/** Barbell held in the hands: plates behind the body, the bar end in front. */
export const barbell = (r = 9.6) => ({
  back: (j: Joints) => (
    <g>
      <Plate c={add(j.grip, [-1.4, -0.6])} r={r} dim />
      <Plate c={j.grip} r={r} />
    </g>
  ),
  front: (j: Joints) => <Hub c={j.grip} r={Math.min(2.2, r * 0.25)} />,
})

/** A hex dumbbell seen end-on. */
export function Bell({ c, r = 4.4, far = false }: { c: V; r?: number; far?: boolean }) {
  const pts: V[] = Array.from({ length: 6 }, (_, i) => add(c, dir(i * 60 + 30), r))
  return (
    <g opacity={far ? 0.6 : 1}>
      <path d={blob(pts, 0.25)} fill={KIT.plate} stroke={KIT.rim} strokeWidth={1.1} strokeLinejoin="round" />
      <circle cx={c[0]} cy={c[1]} r={1.4} fill={KIT.metal} />
    </g>
  )
}
/** A dumbbell seen from the side (long axis across the view), for flys and kickbacks. */
export function BellSide({ c, angle = 0, far = false }: { c: V; angle?: number; far?: boolean }) {
  const u = dir(angle + 90)
  const end = (k: number) => add(c, u, k)
  const head = (p: V) => {
    const n = dir(angle)
    const a = add(add(p, u, -1.8), n, 4.2), b = add(add(p, u, 1.8), n, 4.2), cc = add(add(p, u, 1.8), n, -4.2), d = add(add(p, u, -1.8), n, -4.2)
    return `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${cc[0]} ${cc[1]}L${d[0]} ${d[1]}Z`
  }
  return (
    <g opacity={far ? 0.6 : 1} stroke={KIT.rim} strokeWidth={0.9} strokeLinejoin="round">
      <line x1={end(-5)[0]} y1={end(-5)[1]} x2={end(5)[0]} y2={end(5)[1]} stroke={KIT.metal} strokeWidth={1.6} />
      <path d={head(end(-5.5))} fill={KIT.plate} />
      <path d={head(end(5.5))} fill={KIT.plate} />
    </g>
  )
}
export const dumbbells = (r = 4.4) => ({
  back: (j: Joints) => <Bell c={j.grip2} r={r} far />,
  front: (j: Joints) => <Bell c={j.grip} r={r} />,
})

/** Kettlebell hanging from the hand (bell below the handle unless flipped). */
export function KB({ c, up = 180 }: { c: V; up?: number }) {
  const body = add(c, dir(up), 6.4)
  const h1 = add(c, dir(up - 60), 3.2), h2 = add(c, dir(up + 60), 3.2)
  return (
    <g>
      <path d={`M${h1[0]} ${h1[1]}Q${add(c, dir(up), -2.6)[0]} ${add(c, dir(up), -2.6)[1]} ${h2[0]} ${h2[1]}`} fill="none" stroke={KIT.metal} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={body[0]} cy={body[1]} r={5.6} fill={KIT.plate} stroke={KIT.rim} strokeWidth={1.2} />
    </g>
  )
}

/** Cable from a pulley to the hand, with a handle. */
export function Cable({ from, to, handle = 'd' }: { from: V; to: V; handle?: 'd' | 'rope' | 'bar' | 'none' }) {
  return (
    <g>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={S.cable} strokeWidth={0.8} />
      <circle cx={from[0]} cy={from[1]} r={2.4} fill={S.fill} stroke={S.edge} strokeWidth={1} />
      {handle === 'rope' && <path d={`M${to[0] - 1} ${to[1] - 1}l-1 4M${to[0] + 1} ${to[1] - 1}l1 4`} stroke={KIT.rim} strokeWidth={1.4} strokeLinecap="round" />}
      {handle === 'bar' && <circle cx={to[0]} cy={to[1]} r={1.6} fill={KIT.metal} />}
    </g>
  )
}
/** A cable machine column standing at x. */
export function Column({ x, top = 6, w = 7 }: { x: number; top?: number; w?: number }) {
  return <rect x={x - w / 2} y={top} width={w} height={104 - top} rx={1.5} fill={S.fill} stroke={S.edge} strokeWidth={0.8} />
}

/** Flat bench pad from x0 to x1 with its top at y. */
export function Bench({ x0, x1, y = 80, legs = true }: { x0: number; x1: number; y?: number; legs?: boolean }) {
  return (
    <g>
      {legs && <rect x={x0 + 6} y={y + 4} width={3} height={104 - y - 4} fill={S.fill} stroke={S.edge} strokeWidth={0.6} />}
      {legs && <rect x={x1 - 9} y={y + 4} width={3} height={104 - y - 4} fill={S.fill} stroke={S.edge} strokeWidth={0.6} />}
      <rect x={x0} y={y} width={x1 - x0} height={4.5} rx={2} fill={S.pad} stroke={S.edge} strokeWidth={0.7} />
    </g>
  )
}
/** A pad as a thick rounded line from a to b. */
export function Pad({ a, b, w = 4.5 }: { a: V; b: V; w?: number }) {
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={S.edge} strokeWidth={w + 1.2} strokeLinecap="round" />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={S.pad} strokeWidth={w} strokeLinecap="round" />
    </g>
  )
}
/** A frame tube (machine frame). */
export function Tube({ pts, w = 2.6, color = S.fill }: { pts: V[]; w?: number; color?: string }) {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={S.edge} strokeWidth={w + 1} />
      <path d={d} stroke={color} strokeWidth={w} />
    </g>
  )
}
/** A round roller pad (leg extension, leg curl). */
export const Roller = ({ c, r = 3.4 }: { c: V; r?: number }) => <circle cx={c[0]} cy={c[1]} r={r} fill={S.pad} stroke={S.edge} strokeWidth={0.8} />
/** A weight stack box. */
export const Stack = ({ x, y, w = 10, h = 26 }: { x: number; y: number; w?: number; h?: number }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={1} fill={S.fill} stroke={S.edge} strokeWidth={0.8} />
    {Array.from({ length: Math.floor(h / 3.4) }, (_, i) => <line key={i} x1={x + 1.5} x2={x + w - 1.5} y1={y + 2.6 + i * 3.4} y2={y + 2.6 + i * 3.4} stroke={S.edge} strokeWidth={0.5} />)}
  </g>
)
export const Box = ({ x, w, h }: { x: number; w: number; h: number }) => <rect x={x} y={104 - h} width={w} height={h} rx={1.5} fill={S.pad} stroke={S.edge} strokeWidth={0.8} />

/** Point a fraction of the way from a to b. */
export const along = (a: V, b: V, k: number): V => add(a, sub(b, a), k)

/** Barbell resting on the upper back (or across the front of the shoulders). */
export const barAt = (point: (j: Joints) => V, r = 9.6) => ({
  back: (j: Joints) => (
    <g>
      <Plate c={add(point(j), [-1.4, -0.6])} r={r} dim />
      <Plate c={point(j)} r={r} />
    </g>
  ),
  front: (j: Joints) => <Hub c={point(j)} />,
})
