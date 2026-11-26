import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** The rest countdown: an end time, so it survives the screen locking or the page reloading. */
export const useRest = create<{ end: number | null; total: number; start: (s: number) => void; add: (s: number) => void; stop: () => void }>()(
  persist(
    (set) => ({
      end: null,
      total: 0,
      start: (s) => set(s > 0 ? { end: Date.now() + s * 1000, total: s } : { end: null }),
      add: (s) => set((st) => (st.end ? { end: Math.max(Date.now(), st.end + s * 1000), total: Math.max(1, st.total + s) } : {})),
      stop: () => set({ end: null }),
    }),
    { name: 'gweb-rest' },
  ),
)
