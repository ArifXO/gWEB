import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useStore } from './store'

/** undefined while loading; null when signed out. Without Supabase there is no account at all. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (session?.user) useStore.getState().claim(session.user.id)
  }, [session?.user?.id])
  return session
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase!.auth.signInWithPassword({ email, password })
  if (error) throw error
}

/** Returns true when the account needs its email confirmed before signing in. */
export async function signUp(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase!.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
  if (error) throw error
  return !data.session
}

export async function resetPassword(email: string) {
  const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  if (error) throw error
}

export async function signOut() {
  await supabase?.auth.signOut()
  useStore.getState().resetLocal()
}
