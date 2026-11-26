import { useState } from 'react'
import { Button } from '../components/ui'
import { resetPassword, signIn, signInWithGoogle, signUp } from '../lib/auth'

type Mode = 'in' | 'up' | 'reset'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'in') await signIn(email.trim(), password)
      else if (mode === 'up') {
        const confirm = await signUp(email.trim(), password)
        if (confirm) setInfo('Check your email for a link to confirm your account, then sign in.')
      } else {
        await resetPassword(email.trim())
        setInfo('If that email has an account, a reset link is on its way.')
      }
    } catch (err) {
      setError(friendly(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pt-safe pb-safe min-h-full">
    <div className="mx-auto flex min-h-full max-w-[420px] flex-col justify-center px-6 py-10">
      <div className="mb-10">
        <img src="/icon.svg" alt="" className="size-14 rounded-2xl" />
        <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-tight">
          {mode === 'up' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-[15px] text-mute">Log your lifts. See them add up. Works on every device you sign in on.</p>
      </div>
      {mode !== 'reset' && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError(null)
              setBusy(true)
              signInWithGoogle().catch((err) => {
                setError(friendly(err))
                setBusy(false)
              })
            }}
            className="flex min-h-12 items-center justify-center gap-3 rounded-xl border border-line bg-raised text-[15px] font-medium active:bg-line disabled:opacity-40"
          >
            <GoogleMark /> Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-[12px] text-faint">
            <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mute">Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-raised px-3 text-[16px] outline-none" />
        </label>
        {mode !== 'reset' && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-mute">Password</span>
            <input type="password" required minLength={6} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-raised px-3 text-[16px] outline-none" />
          </label>
        )}
        {error && <p role="alert" className="text-[14px] text-[#ff6b6b]">{error}</p>}
        {info && <p role="status" className="text-[14px] text-good">{info}</p>}
        <Button kind="primary" className="mt-2 min-h-13" disabled={busy}>
          {busy ? 'One moment…' : mode === 'up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
        </Button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-1 text-[14px]">
        {mode === 'in' ? (
          <>
            <button className="h-10 text-mute" onClick={() => setMode('up')}>New here? <span className="text-ink">Create an account</span></button>
            <button className="h-10 text-faint" onClick={() => setMode('reset')}>Forgot password?</button>
          </>
        ) : (
          <button className="h-10 text-mute" onClick={() => setMode('in')}>Have an account? <span className="text-ink">Sign in</span></button>
        )}
      </div>
    </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  )
}

function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  if (/invalid login/i.test(m)) return 'That email and password don’t match.'
  if (/not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link.'
  if (/already registered/i.test(m)) return 'There’s already an account with that email. Try signing in.'
  if (/provider is not enabled|unsupported provider/i.test(m)) return 'Google sign-in isn’t switched on yet. Use email for now.'
  if (/fetch|network/i.test(m)) return 'Can’t reach the server. Check your connection.'
  return m
}
