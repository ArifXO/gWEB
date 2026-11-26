// Print key frames of one animation: npx vite-node tools/probe-anim.ts deadlift
import { OWN } from '../src/components/anim/clips'
const id = process.argv[2]
const c = OWN[id]
const f = (v: number[]) => v.map((x) => x.toFixed(1)).join(',')
const deg = (a: number[], b: number[]) => (Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]) * 180) / Math.PI
for (const ms of [0, ...(c.marks ?? [])]) {
  const p = c.pose(ms)
  const s = p.near, d = [s.wrist[0] - s.elbow[0], s.wrist[1] - s.elbow[1]], l = Math.hypot(d[0], d[1])
  const grip = [s.wrist[0] + (d[0] * 2.6) / l, s.wrist[1] + (d[1] * 2.6) / l]
  const t = (Math.atan2(p.neck[0] - s.hip[0], -(p.neck[1] - s.hip[1])) * 180) / Math.PI
  const up = [s.elbow[0] - s.shoulder[0], s.elbow[1] - s.shoulder[1]]
  const sw = Math.hypot(s.wrist[0] - s.shoulder[0], s.wrist[1] - s.shoulder[1])
  console.log(`@${Math.round(ms)} hip ${f(s.hip)} knee ${f(s.knee)} torso ${t.toFixed(0)} sh ${f(s.shoulder)} el ${f(s.elbow)} grip ${f(grip)} elbowFlex ${(-deg(up, d)).toFixed(0)} sh-wr ${sw.toFixed(1)} com ${c.com?.(ms)?.toFixed(1)} ankle ${f(s.ankle)}`)
}
