import type { Muscle } from '../lib/catalogue'

// A simple front/back figure drawn for this app. Each shape belongs to one muscle group.
type Shape = { m: Muscle | null; d: string }

const e = (cx: number, cy: number, rx: number, ry: number, rot = 0) =>
  rot
    ? ellipsePath(cx, cy, rx, ry, rot)
    : `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0z`

function ellipsePath(cx: number, cy: number, rx: number, ry: number, rot: number) {
  const pts: string[] = []
  const r = (rot * Math.PI) / 180
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 2
    const x = rx * Math.cos(t), y = ry * Math.sin(t)
    pts.push(`${(cx + x * Math.cos(r) - y * Math.sin(r)).toFixed(1)} ${(cy + x * Math.sin(r) + y * Math.cos(r)).toFixed(1)}`)
  }
  return `M${pts.join('L')}z`
}
const mirror = (m: Muscle | null, f: (s: 1 | -1) => string): Shape[] => [{ m, d: f(-1) }, { m, d: f(1) }]

const HEAD: Shape[] = [{ m: null, d: e(50, 14, 9, 10.5) }, { m: null, d: 'M45 23h10v6H45z' }]

const FRONT: Shape[] = [
  ...HEAD,
  ...mirror('Shoulders', (s) => e(50 + s * 19, 37, 7.5, 6.5, s * 25)),
  ...mirror('Chest', (s) => `M50 33 L${50 + s * 15} 33 Q${50 + s * 18} 42 ${50 + s * 13} 49 L50 50z`),
  ...mirror('Biceps', (s) => e(50 + s * 23, 53, 4.6, 9.5, s * -10)),
  ...mirror('Forearms', (s) => e(50 + s * 26.5, 75, 4, 11, s * -12)),
  { m: 'Core', d: 'M42.5 52h15l-1 30h-13z' },
  ...mirror('Core', (s) => `M${50 + s * 8.5} 53 L${50 + s * 12.5} 55 L${50 + s * 11.5} 78 L${50 + s * 8} 82z`),
  { m: null, d: 'M41 84h18l-3 9h-12z' },
  ...mirror('Quads', (s) => e(50 + s * 8.5, 110, 7, 19, s * 3)),
  ...mirror(null, (s) => e(50 + s * 8, 132, 4, 3.5)),
  ...mirror('Calves', (s) => e(50 + s * 8.5, 152, 4.5, 14, s * -2)),
  ...mirror(null, (s) => e(50 + s * 9, 170, 4.5, 2.5)),
]

const BACK: Shape[] = [
  ...HEAD,
  { m: 'Back', d: 'M50 26 L62 34 L50 48 L38 34z' },
  ...mirror('Shoulders', (s) => e(50 + s * 19, 37, 7.5, 6.5, s * 25)),
  ...mirror('Back', (s) => `M${50 + s * 2} 47 L${50 + s * 13} 38 Q${50 + s * 16} 52 ${50 + s * 10} 66 L${50 + s * 2} 70z`),
  { m: 'Back', d: 'M44 70h12v12H44z' },
  ...mirror('Triceps', (s) => e(50 + s * 23, 53, 4.6, 9.5, s * -10)),
  ...mirror('Forearms', (s) => e(50 + s * 26.5, 75, 4, 11, s * -12)),
  ...mirror('Glutes', (s) => e(50 + s * 7.5, 90, 7.5, 8)),
  ...mirror('Hamstrings', (s) => e(50 + s * 8.5, 114, 6.5, 16, s * 3)),
  ...mirror(null, (s) => e(50 + s * 8, 132, 4, 3.5)),
  ...mirror('Calves', (s) => e(50 + s * 8.5, 150, 5.5, 13, s * -2)),
  ...mirror(null, (s) => e(50 + s * 9, 170, 4.5, 2.5)),
]

interface Props {
  load: Partial<Record<Muscle, number>>
  /** load at which a muscle is shown at full strength */
  full?: number
  size?: number
  showLabels?: boolean
  className?: string
}

export function BodyMap({ load, full = 1, size = 80, showLabels, className }: Props) {
  const fill = (m: Muscle | null) => {
    if (!m) return { fill: 'var(--color-raised)', opacity: 1 }
    const v = Math.min(1, (load[m] ?? 0) / full)
    if (v <= 0) return { fill: 'var(--color-line)', opacity: 1 }
    return { fill: 'var(--color-accent)', opacity: 0.3 + 0.7 * v }
  }
  const fig = (shapes: Shape[], label: string) => (
    <figure className="m-0 flex flex-col items-center gap-1">
      <svg viewBox="17 0 66 176" width={(size * 66) / 176} height={size} role="img" aria-label={`${label} view`}>
        {shapes.map((s, i) => (
          <path key={i} d={s.d} {...fill(s.m)} />
        ))}
      </svg>
      {showLabels && <figcaption className="text-[11px] text-faint">{label}</figcaption>}
    </figure>
  )
  return (
    <div className={`flex items-end gap-1.5 ${className ?? ''}`}>
      {fig(FRONT, 'Front')}
      {fig(BACK, 'Back')}
    </div>
  )
}
