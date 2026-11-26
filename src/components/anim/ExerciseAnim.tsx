import { ClipPlayer } from './Figure'
import { clipFor } from './clips'
import type { Exercise } from '../../lib/catalogue'

/** The animated figure for an exercise (a still frame when animate is false). */
export function ExerciseAnim({ ex, size = 160, animate = true, className = '' }: { ex: Pick<Exercise, 'id' | 'pattern' | 'equipment' | 'muscle' | 'name'>; size?: number; animate?: boolean; className?: string }) {
  const { clip } = clipFor(ex)
  return (
    <span className={className} style={{ display: 'inline-block', lineHeight: 0 }}>
      <ClipPlayer clip={clip} size={size} animate={animate} label={`How to do ${ex.name}`} />
    </span>
  )
}
