// Dev page for checking animations: npm run dev, then open /review.html?only=bench-press,deadlift
// Each row shows key frames with the bar/hand path (dotted), the hip path, and the balance point (orange tick).
import { createRoot } from 'react-dom/client'
import { Body, type Clip } from './components/anim/Figure'
import { OWN } from './components/anim/clips'
import './index.css'

const q = new URLSearchParams(location.search)
const only = q.get('only')?.split(',')
const seen = new Set<Clip>()
const list = Object.entries(OWN).filter(([id, c]) => (only ? only.includes(id) : !seen.has(c) && seen.add(c)))
const grip = (p: ReturnType<Clip['pose']>) => {
  const s = p.near, d = [s.wrist[0] - s.elbow[0], s.wrist[1] - s.elbow[1]], l = Math.hypot(d[0], d[1]) || 1
  return [s.wrist[0] + (d[0] * 2.6) / l, s.wrist[1] + (d[1] * 2.6) / l]
}
function Row({ id, c }: { id: string; c: Clip }) {
  const total = (c.marks?.at(-1) ?? 3000) + 1
  const times = c.marks ? [0, ...c.marks.map((m, i) => (i ? (c.marks![i - 1] + m) / 2 : m / 2)), ...c.marks].sort((a, b) => a - b).slice(0, 8) : [0, total / 4, total / 2, (3 * total) / 4]
  const trail = Array.from({ length: 80 }, (_, i) => c.pose((total * i) / 80))
  const path = (f: (p: (typeof trail)[0]) => number[]) => trail.map((p, i) => `${i ? 'L' : 'M'}${f(p)[0].toFixed(1)} ${f(p)[1].toFixed(1)}`).join('')
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <div style={{ width: 120, color: '#8b8e94', font: '12px system-ui' }}>{id}</div>
      {times.map((ms) => {
        const p = c.pose(ms)
        const v = p.view ?? [0, 0, 120, 120]
        const com = c.com?.(ms)
        return (
          <svg key={ms} viewBox={v.join(' ')} width={150} height={150} style={{ background: '#151618' }}>
            <line x1={v[0]} x2={v[0] + v[2]} y1={104.6} y2={104.6} stroke="#2a2c30" />
            {p.back}
            <Body p={p} />
            {p.front}
            <path d={path(grip)} fill="none" stroke="#7d8087" strokeWidth={0.5} strokeDasharray="1 1.5" />
            <path d={path((t) => t.near.hip)} fill="none" stroke="#4ade80" strokeWidth={0.5} strokeDasharray="1 1.5" />
            {com !== undefined && <line x1={com} x2={com} y1={98} y2={106} stroke="#ff6b2c" strokeWidth={1.2} />}
          </svg>
        )
      })}
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<div style={{ display: 'grid', gap: 4, padding: 4 }}>{list.map(([id, c]) => <Row key={id} id={id} c={c} />)}</div>)
