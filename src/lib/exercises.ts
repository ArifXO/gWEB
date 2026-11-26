import { useMemo } from 'react'
import { CATALOGUE, type Exercise } from './catalogue'
import { useStore } from './store'

const BY_ID = new Map(CATALOGUE.map((e) => [e.id, e]))

export function useExercises(): { all: Exercise[]; get: (id: string) => Exercise } {
  const custom = useStore((s) => s.exercises)
  return useMemo(() => {
    const mine = Object.values(custom).filter((e) => !e.deleted)
    const map = new Map(BY_ID)
    for (const e of mine) map.set(e.id, e)
    const all = [...mine.sort((a, b) => a.name.localeCompare(b.name)), ...CATALOGUE]
    return {
      all,
      get: (id: string) => map.get(id) ?? custom[id] ?? { id, name: 'Unknown exercise', muscle: 'Full body', equipment: 'Other' },
    }
  }, [custom])
}

export const stepFor = (unit: 'kg' | 'lb', ex?: Exercise) => (unit === 'lb' ? 5 : ex?.equipment === 'Dumbbell' || ex?.equipment === 'Kettlebell' ? 2 : 2.5)
