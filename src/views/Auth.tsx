import { useState } from 'react'
import { Button } from '../components/ui'
import { resetPassword, signIn, signUp } from '../lib/auth'

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

function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  if (/invalid login/i.test(m)) return 'That email and password don’t match.'
  if (/not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link.'
  if (/already registered/i.test(m)) return 'There’s already an account with that email. Try signing in.'
  if (/fetch|network/i.test(m)) return 'Can’t reach the server. Check your connection.'
  return m
}
