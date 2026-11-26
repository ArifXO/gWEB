import { useRef, useState } from 'react'
import { Button, Card, Header, NumberField, useToast } from '../components/ui'
import { signOut } from '../lib/auth'
import { downloadBackup, importFile } from '../lib/backup'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { syncNow, useSync } from '../lib/sync'
import type { Session } from '@supabase/supabase-js'

export default function Settings({ session }: { session: Session | null }) {
  const settings = useStore((s) => s.settings)
  const set = useStore((s) => s.setSettings)
  const pending = useStore((s) => Object.keys(s.dirty).length)
  const sync = useSync()
  const file = useRef<HTMLInputElement>(null)
  const [toast, show] = useToast()
  const [busy, setBusy] = useState(false)

  const status =
    sync.status === 'local' ? 'Saved on this device only'
    : sync.status === 'syncing' ? 'Syncing…'
    : sync.status === 'offline' ? `Offline. ${pending} changes will sync when you're back online.`
    : sync.status === 'error' ? `Couldn't sync: ${sync.error}`
    : pending ? `${pending} changes waiting to sync`
    : sync.at ? `Synced ${new Date(sync.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : 'Up to date'

  return (
    <div className="mx-auto max-w-[560px] pb-28">
      <Header title="Settings" back="/" />
      <div className="flex flex-col gap-6 px-4 pt-2">
        <Section title="Account">
          <Card className="p-4">
            {session ? (
              <>
                <div className="text-[15px]">{session.user.email}</div>
                <div className={`mt-1 text-[13px] ${sync.status === 'error' ? 'text-[#ff6b6b]' : 'text-mute'}`}>{status}</div>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" disabled={sync.status === 'syncing'} onClick={() => syncNow().then(() => show(useSync.getState().status === 'error' ? 'Sync failed' : 'Synced'))}>Sync now</Button>
                  <Button kind="ghost" className="flex-1" onClick={() => signOut()}>Sign out</Button>
                </div>
              </>
            ) : (
              <div className="text-[14px] text-mute">{supabase ? 'Not signed in.' : 'Accounts are switched off in this build, so your data stays on this device. Export a backup now and then.'}</div>
            )}
          </Card>
        </Section>

        <Section title="Units">
          <div className="grid grid-cols-2 gap-2">
            {(['kg', 'lb'] as const).map((u) => (
              <button key={u} aria-pressed={settings.unit === u} onClick={() => set({ unit: u })} className={`h-12 rounded-xl text-[15px] font-medium ${settings.unit === u ? 'bg-ink text-bg' : 'bg-raised text-mute'}`}>
                {u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Default rest between sets">
          <div className="flex items-center gap-3">
            <div className="w-44"><NumberField label="Default rest seconds" value={settings.defaultRest} step={15} onChange={(v) => set({ defaultRest: Math.round(v) })} /></div>
            <span className="text-[14px] text-mute">seconds</span>
          </div>
        </Section>

        <Section title="Backup">
          <div className="flex gap-2">
            <Button className="flex-1" onClick={downloadBackup}>Export</Button>
            <Button className="flex-1" disabled={busy} onClick={() => file.current?.click()}>Import</Button>
          </div>
          <p className="mt-2 text-[13px] text-mute">Export saves everything to one file. Import adds a file's routines and workouts to what you have.</p>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              setBusy(true)
              try {
                await importFile(f)
                show('Backup imported')
              } catch (err) {
                show(err instanceof Error ? err.message : 'Import failed')
              } finally {
                setBusy(false)
              }
            }}
          />
        </Section>
        <p className="text-center text-[12px] text-faint">gWEB · version 0.1</p>
      </div>
      {toast}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-mute">{title}</h2>
      {children}
    </section>
  )
}
