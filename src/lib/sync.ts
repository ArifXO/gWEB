import { create } from 'zustand'
import { supabase } from './supabase'
import { recordFor, useStore, type RemoteRow } from './store'
import type { Kind } from './types'

export type SyncStatus = 'local' | 'idle' | 'syncing' | 'offline' | 'error'

export const useSync = create<{ status: SyncStatus; error: string | null; at: number | null }>(() => ({
  status: supabase ? 'idle' : 'local',
  error: null,
  at: null,
}))

const BATCH = 200
let running: Promise<void> | null = null
let again = false

/** Push local edits, then pull anything newer from the server. Safe to call often. */
export function syncNow(): Promise<void> {
  if (!supabase) return Promise.resolve()
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    do {
      again = false
      await once()
    } while (again)
  })().finally(() => (running = null))
  return running
}

async function once() {
  const sb = supabase!
  const { data: auth } = await sb.auth.getSession()
  const user = auth.session?.user
  if (!user) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    useSync.setState({ status: 'offline' })
    return
  }
  useSync.setState({ status: 'syncing' })
  try {
    const st = useStore.getState()
    if (st.owner !== user.id) st.claim(user.id)

    // Push
    const dirty = Object.entries(useStore.getState().dirty)
    for (let i = 0; i < dirty.length; i += BATCH) {
      const chunk = dirty.slice(i, i + BATCH)
      const sent: Record<string, number> = {}
      const items = chunk.flatMap(([k]) => {
        const [kind, ...rest] = k.split(':')
        const id = rest.join(':')
        const rec = recordFor(kind as Kind, id)
        if (!rec) return []
        sent[k] = rec.updatedAt
        const { id: _id, updatedAt: _u, deleted, ...data } = rec as typeof rec & Record<string, unknown>
        return [{ kind, id, data, updated_at: rec.updatedAt, deleted: !!deleted }]
      })
      if (items.length) {
        const { error } = await sb.rpc('push_records', { items })
        if (error) throw error
      }
      useStore.getState().markPushed(sent)
    }

    // Pull (with a minute of overlap so a slow concurrent write is never missed)
    const since = useStore.getState().lastPull
    let from = since ? new Date(new Date(since).getTime() - 60_000).toISOString() : '1970-01-01T00:00:00Z'
    let newest = since
    for (;;) {
      const { data, error } = await sb
        .from('records')
        .select('kind,id,data,updated_at,deleted,server_ts')
        .gt('server_ts', from)
        .order('server_ts', { ascending: true })
        .limit(1000)
      if (error) throw error
      const rows = (data ?? []) as RemoteRow[]
      if (rows.length) newest = rows[rows.length - 1].server_ts ?? newest
      useStore.getState().applyRemote(rows, newest)
      if (rows.length < 1000) break
      from = rows[rows.length - 1].server_ts!
    }
    useSync.setState({ status: 'idle', error: null, at: Date.now() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e)
    useSync.setState({ status: navigator.onLine === false ? 'offline' : 'error', error: msg })
  }
}

let timer: ReturnType<typeof setTimeout> | undefined

/** Starts background syncing: after edits, when the app comes back online or into view, and every minute. */
export function startAutoSync(): () => void {
  if (!supabase) return () => {}
  const soon = () => {
    clearTimeout(timer)
    timer = setTimeout(syncNow, 1500)
  }
  const unsub = useStore.subscribe((s, prev) => {
    if (s.dirty !== prev.dirty && Object.keys(s.dirty).length) soon()
  })
  const onVisible = () => document.visibilityState === 'visible' && syncNow()
  window.addEventListener('online', syncNow)
  document.addEventListener('visibilitychange', onVisible)
  const iv = setInterval(syncNow, 60_000)
  syncNow()
  return () => {
    unsub()
    window.removeEventListener('online', syncNow)
    document.removeEventListener('visibilitychange', onVisible)
    clearInterval(iv)
    clearTimeout(timer)
  }
}
