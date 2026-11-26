import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IChevronLeft, IMinus, IPlus, IX } from './icons'
import { useNavigate } from 'react-router-dom'

export function Header({ title, back, right, sub }: { title: ReactNode; back?: boolean | string; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="pt-safe sticky top-0 z-20 bg-bg/95 backdrop-blur">
      <div className="flex min-h-14 items-center gap-2 px-4 pt-2">
        {back && (
          <button aria-label="Back" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="-ml-2 grid size-10 place-items-center rounded-full text-mute active:bg-raised">
            <IChevronLeft />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-semibold tracking-tight">{title}</h1>
          {sub && <div className="text-[13px] text-mute">{sub}</div>}
        </div>
        {right}
      </div>
    </header>
  )
}

export function Card({ children, className = '', ...p }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl border border-line/60 bg-surface ${className}`} {...p}>
      {children}
    </div>
  )
}

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({ kind = 'secondary', className = '', children, ...p }: { kind?: BtnKind } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const k = {
    primary: 'bg-accent text-accent-ink font-semibold active:brightness-90',
    secondary: 'bg-raised text-ink active:bg-line',
    ghost: 'text-mute active:bg-raised',
    danger: 'bg-raised text-[#ff6b6b] active:bg-line',
  }[kind]
  return (
    <button className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] transition disabled:opacity-40 ${k} ${className}`} {...p}>
      {children}
    </button>
  )
}

export function Sheet({ open, onClose, title, children, full }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; full?: boolean }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`sheet-in pb-safe relative flex w-full max-w-[520px] flex-col rounded-t-3xl border-t border-line bg-surface ${full ? 'h-[92dvh]' : 'max-h-[88dvh]'}`}>
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <div className="flex-1 text-[17px] font-semibold">{title}</div>
          <button aria-label="Close" onClick={onClose} className="-mr-2 grid size-10 place-items-center rounded-full text-mute active:bg-raised">
            <IX />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}

/**
 * A number you can type into or nudge with − / +. Keeps a text draft while typing so "62." isn't lost.
 */
export function NumberField({ value, onChange, step, min = 0, label, dim, compact }: { value: number; onChange: (v: number) => void; step: number; min?: number; label: string; dim?: boolean; compact?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const shown = draft ?? (value ? fmt(value) : '')
  const nudge = (d: number) => {
    setDraft(null)
    onChange(Math.max(min, round(value + d)))
  }
  const btn = compact ? 'w-8' : 'w-9'
  return (
    <div className={`flex h-12 items-stretch overflow-hidden rounded-xl bg-raised ${dim ? 'opacity-60' : ''}`}>
      <button type="button" aria-label={`Less ${label}`} className={`${btn} grid shrink-0 place-items-center text-mute active:bg-line`} onClick={() => nudge(-step)}>
        <IMinus size={16} />
      </button>
      <input
        ref={ref}
        aria-label={label}
        inputMode="decimal"
        enterKeyHint="done"
        className="num w-full min-w-0 bg-transparent text-center text-[17px] font-semibold outline-none placeholder:text-faint"
        placeholder="0"
        value={shown}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const t = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '')
          setDraft(t)
          const n = parseFloat(t)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => e.key === 'Enter' && ref.current?.blur()}
      />
      <button type="button" aria-label={`More ${label}`} className={`${btn} grid shrink-0 place-items-center text-mute active:bg-line`} onClick={() => nudge(step)}>
        <IPlus size={16} />
      </button>
    </div>
  )
}

const round = (n: number) => Math.round(n * 100) / 100
const fmt = (n: number) => String(round(n))

export function Chip({ active, children, ...p }: { active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-9 shrink-0 rounded-full border px-3.5 text-[14px] transition ${active ? 'border-ink bg-ink text-bg' : 'border-line text-mute active:bg-raised'}`}
      {...p}
    >
      {children}
    </button>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="text-[17px] font-medium">{title}</div>
      {children && <div className="mt-1.5 text-[15px] text-mute">{children}</div>}
    </div>
  )
}

/** A short message at the bottom of the screen, e.g. "Saved". */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2200)
    return () => clearTimeout(t)
  }, [msg])
  const node = msg ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <div className="sheet-in rounded-full border border-line bg-raised px-4 py-2 text-[14px] shadow-lg">{msg}</div>
    </div>
  ) : null
  return [node, setMsg] as const
}
