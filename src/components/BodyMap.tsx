import type { Muscle } from '../lib/catalogue'

// Front and back figures drawn for this app. Shapes are drawn for the figure's right half
// (x ≥ 50) and mirrored, so both sides always match.
type Shape = { m: Muscle | null; d: string }

const SILHOUETTE =
  'M50 3.5C55.6 3.5 58.6 8 58.6 14C58.6 19.6 56.4 24 54.4 25.8L54.6 30C58.4 31.6 64 32.2 68.8 34.4C74.2 36.8 76.4 41.6 76.8 47.6L78.4 61C79.4 68.6 81.4 76.6 82.6 84.6L84.6 99.6C85 103.4 82.6 105.4 80.4 103.4L77.2 95.6C75.2 87.8 72.4 80 71.2 72L69.8 62.6C69 67 68 71.6 67.2 76.6C66.2 83 66.8 88.6 66.6 94.6C67.4 104.6 66.4 116.4 64.4 128.2C63.4 134.4 62.6 140.2 63.4 146.4C64.4 156.4 63.4 167.6 61.4 179.4L61.2 187.4C63.2 189.4 64.6 192.8 60.6 193.8L54.2 193.8C53 187.8 53.8 181.8 53.2 175.8C52.2 165.8 52.4 155.8 53.2 146C53.6 140 52.4 131.6 51.4 119.8L50 107.6Z'

const FRONT: Shape[] = [
  { m: 'Shoulders', d: 'M63.6 33.6C69.6 33.4 74.8 37.6 76 44.6C76.6 49.4 74 52.4 70.6 51.6C68.6 46.4 66.2 41 61.4 37Z' },
  { m: 'Chest', d: 'M51 37.6C55.8 35.6 61.8 35.8 66 39C69.2 42.6 69.4 47.8 66.6 52C61.6 55.4 55.4 55.6 51 53.4Z' },
  { m: 'Biceps', d: 'M70.4 53.4C73.4 53.2 76.2 57 77.2 62.8C78 68.6 76.4 72 73.4 72.2C71.2 68 69.4 62 69.2 56.2Z' },
  { m: 'Forearms', d: 'M74.2 74.4C77.2 75 79.4 80.2 81 86C82.2 91.6 82.2 96.8 80.4 99C78.2 96 75.4 88.4 73.4 80.4Z' },
  { m: 'Core', d: 'M51 57.4h4.6a1.6 1.6 0 0 1 1.6 1.6v4.8a1.6 1.6 0 0 1-1.6 1.6H51ZM51 67.2h4.8a1.6 1.6 0 0 1 1.6 1.6v5a1.6 1.6 0 0 1-1.6 1.6H51ZM51 77.2h4.8a1.6 1.6 0 0 1 1.6 1.6v5.2a1.6 1.6 0 0 1-1.6 1.6H51ZM51 87.4h4.6c1 0 1.6.8 1.6 1.6c-.4 5-2.4 9.4-6.2 12.4Z' },
  { m: 'Core', d: 'M58.8 57.2C62.2 59.4 64 65 64.4 72.6C64.6 80.4 62.8 87.6 59.6 92.4L58.8 92Z' },
  { m: 'Quads', d: 'M53 105.4C56.8 100.4 63.2 100.2 66.2 104.6C67.6 114.4 66.4 126.4 64 136C62.2 140.4 58.4 141.4 56.2 138.4C54.2 128.4 52.8 116.4 53 105.4Z' },
  { m: 'Calves', d: 'M56.4 150C59.2 146.6 62.4 147.6 63.2 152C63.4 160 62.2 168 60.2 174C58.4 174.2 57 170.2 56.2 164.2C55.4 158.6 55.4 154 56.4 150Z' },
]

const BACK: Shape[] = [
  { m: 'Back', d: 'M50 25.8C52.8 29 58 31.4 64.4 33.8C60.4 37 56.2 42.4 52.2 50.4L50 52.4Z' },
  { m: 'Shoulders', d: 'M64.6 33.8C70.2 33.8 74.8 38 76 44.6C76.6 49.4 74 52.4 70.6 51.6C68.4 46.6 66.2 41.4 62 37.4Z' },
  { m: 'Back', d: 'M52.4 52.6C56.2 44.6 61.6 39.6 66.8 40.8C68.2 49.8 66.6 60.2 62.4 69.8C58.6 75.6 54.4 78 51 79.2L51 56Z' },
  { m: 'Back', d: 'M51 81.2C54.4 80.2 58.4 77.8 61.4 75.4C61.6 82 60.6 88 58.4 92.4L51 92.4Z' },
  { m: 'Triceps', d: 'M70.4 53.2C73.4 53 76.2 56.8 77.2 62.6C78 68.4 76.4 71.8 73.4 72C71 67.4 69.4 61.4 69.2 55.6Z' },
  { m: 'Forearms', d: 'M74.2 74.4C77.2 75 79.4 80.2 81 86C82.2 91.6 82.2 96.8 80.4 99C78.2 96 75.4 88.4 73.4 80.4Z' },
  { m: 'Glutes', d: 'M51 96.4C55.8 93.2 62.8 93.8 66 99C67.8 105.2 66.2 112 62.2 114.2C57.4 115.4 53.2 113.6 51 110.4Z' },
  { m: 'Hamstrings', d: 'M53.2 118.4C57.2 115.4 63 116 65 120.4C66 128.4 64.4 136.4 62.2 140.4C59.2 141.6 56.2 140.4 55.2 136.4C54 130.4 53.2 124.4 53.2 118.4Z' },
  { m: 'Calves', d: 'M55.4 148.2C59 144.2 63.2 145.8 64.2 152C64.4 160 62.4 166.2 59.4 168.4C57.4 166.6 56.2 160.6 55.4 155.4Z' },
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
    const v = m ? Math.min(1, (load[m] ?? 0) / full) : 0
    if (v <= 0) return { fill: 'var(--color-line)', fillOpacity: 1 }
    return { fill: 'var(--color-accent)', fillOpacity: 0.35 + 0.65 * v }
  }
  const half = (shapes: Shape[]) => shapes.map((s, i) => <path key={i} d={s.d} {...fill(s.m)} />)
  const fig = (shapes: Shape[], label: string) => (
    <figure className="m-0 flex flex-col items-center gap-1">
      <svg viewBox="14 0 72 198" width={(size * 72) / 198} height={size} role="img" aria-label={`${label} view`}>
        <path d={SILHOUETTE} fill="var(--color-raised)" />
        <path d={SILHOUETTE} fill="var(--color-raised)" transform="translate(100 0) scale(-1 1)" />
        {half(shapes)}
        <g transform="translate(100 0) scale(-1 1)">{half(shapes)}</g>
      </svg>
      {showLabels && <figcaption className="text-[11px] text-faint">{label}</figcaption>}
    </figure>
  )
  return (
    <div className={`flex items-end gap-2 ${className ?? ''}`}>
      {fig(FRONT, 'Front')}
      {fig(BACK, 'Back')}
    </div>
  )
}
