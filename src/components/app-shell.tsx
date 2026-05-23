'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CalendarDays, ClipboardList, FolderKanban, Home, LogOut, Menu, MessageSquare, PlusCircle, Stethoscope, Users, X } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import { logout } from '@/app/login/actions'

type AppShellProps = {
  children: React.ReactNode
  userLabel: string
  organizationName: string
  roleLabel: string
  isDoctor: boolean
}

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/contacts', label: 'Contatti', icon: Users },
  { href: '/cases', label: 'Pratiche', icon: FolderKanban },
  { href: '/tasks', label: 'Scadenze', icon: CalendarDays },
  { href: '/invalidita-civile', label: 'Invalidità Civile', icon: FolderKanban },
  { href: '/chat', label: 'Assistente AI', icon: MessageSquare },
]

const bottomNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cases', label: 'Pratiche', icon: FolderKanban },
  { href: '/tasks', label: 'Scadenze', icon: CalendarDays },
  { href: '/cases/new', label: 'Nuova', icon: PlusCircle },
]

export function AppShell({ children, userLabel, organizationName, roleLabel, isDoctor }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()


  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const navItems = isDoctor
    ? [...baseNavItems, { href: '/medico/dashboard', label: 'Dashboard Medico', icon: Stethoscope }]
    : baseNavItems

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-100">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg md:hidden"
        aria-label="Apri menu di navigazione"
        aria-expanded={isOpen}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
        aria-label="Chiudi menu di navigazione"
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6 pr-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ClipboardList size={21} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold leading-5 text-slate-950">Centro Flaiano</h1>
            <p className="truncate text-xs font-medium text-slate-500">{organizationName}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden"
            aria-label="Chiudi menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            const doctorClass = item.href.startsWith('/medico')
              ? 'text-purple-700 hover:bg-purple-50 hover:text-purple-900'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700' : doctorClass
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-3 rounded-md bg-slate-50 p-3">
            <div className="truncate text-sm font-semibold text-slate-800" title={userLabel}>
              {userLabel}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {roleLabel}
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut size={17} aria-hidden="true" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 pl-16 md:px-8 md:pl-8">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold uppercase tracking-wide text-slate-500">{organizationName}</h2>
            <p className="truncate text-xs text-slate-400">Gestione operativa pratiche, scadenze e clienti</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <NotificationBell />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-semibold ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
