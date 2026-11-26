import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { IHistory, IHome, IPlan, IProgress } from './components/icons'
import { useSession } from './lib/auth'
import { useStore } from './lib/store'
import { supabase } from './lib/supabase'
import { startAutoSync } from './lib/sync'
import Auth from './views/Auth'
import { History, WorkoutDetail } from './views/History'
import Home from './views/Home'
import { Plan, RoutineEdit } from './views/Plan'
import Progress from './views/Progress'
import Settings from './views/Settings'
import Workout from './views/Workout'

export default function App() {
  const session = useSession()
  const loc = useLocation()
  const signedIn = !!session

  useEffect(() => (signedIn ? startAutoSync() : undefined), [signedIn])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])

  if (session === undefined) return <div className="min-h-full bg-bg" />
  if (supabase && !session) return <Auth />

  const inWorkout = loc.pathname === '/workout'
  const hideTabs = inWorkout || /^\/plan\/.+/.test(loc.pathname) || loc.pathname === '/settings'

  return (
    <div className="min-h-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/plan/:id" element={<RoutineEdit />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<WorkoutDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideTabs && <TabBar />}
    </div>
  )
}

function TabBar() {
  const active = useStore((s) => !!s.active)
  const tabs = [
    { to: '/', label: 'Home', icon: IHome, end: true },
    { to: '/plan', label: 'Plan', icon: IPlan },
    { to: '/history', label: 'History', icon: IHistory },
    { to: '/progress', label: 'Progress', icon: IProgress },
  ]
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/95 backdrop-blur" aria-label="Main">
      {active && (
        <NavLink to="/workout" className="flex h-10 items-center justify-center gap-2 border-b border-line/70 bg-accent/10 text-[14px] font-medium text-accent">
          <span className="size-1.5 rounded-full bg-accent" /> Workout in progress, tap to resume
        </NavLink>
      )}
      <ul className="mx-auto grid max-w-[560px] grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-faint'}`}>
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.1 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
