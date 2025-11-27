'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppShellProps {
  children: React.ReactNode
  user?: {
    email?: string
    name?: string
  }
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="md:pl-64 transition-all duration-300">
        <Header user={user} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
