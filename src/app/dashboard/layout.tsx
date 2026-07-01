'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Workflow, Phone, LogOut } from 'lucide-react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    // Ideally we hit /api/auth/logout, but here we can just redirect to login for prototype
    router.push('/login')
  }

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Unified Inbox', href: '/dashboard/inbox', icon: MessageSquare },
    { name: 'CRM Module', href: '/dashboard/crm', icon: Workflow },
    { name: 'AI Chat', href: '/dashboard/ai', icon: MessageSquare },
    { name: 'Workflows', href: '/dashboard/workflows', icon: Workflow },
    { name: 'WhatsApp Settings', href: '/dashboard/whatsapp', icon: Phone },
  ]

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col z-10">
        {/* Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-900">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-500/10">
            Ω
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Antigravity
          </span>
        </div>

        {/* Tenant Indicator */}
        <div className="px-4 py-4 border-b border-slate-900">
          <div className="px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Tenant Workspace</span>
            <span className="text-sm font-semibold text-slate-200 truncate">acme-business.com</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border-l-2 border-cyan-500'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-slate-200 truncate">Demo Admin</span>
              <span className="text-[11px] text-slate-500 truncate">admin@acme-business.com</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-900 px-8 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
          <h2 className="font-semibold text-lg text-slate-100">
            {menuItems.find((item) => item.href === pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              Enterprise Account
            </span>
          </div>
        </header>

        {/* Page Inner Container */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
