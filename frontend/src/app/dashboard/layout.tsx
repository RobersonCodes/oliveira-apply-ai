'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Zap, FileText, BarChart3, Settings,
  Bell, LogOut, ChevronRight, Bot, Shield, Users,
  Menu, X, Briefcase, Brain, Globe, TrendingUp,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/apply', icon: Zap, label: 'Auto Apply' },
  { href: '/dashboard/neural', icon: Brain, label: 'Job Match Neural', badge: 'NEW' },
  { href: '/dashboard/indeed', icon: Globe, label: 'Indeed Global', badge: 'NEW' },
  { href: '/dashboard/geekhunter', icon: Zap, label: 'GeekHunter', badge: 'NEW' },
  { href: '/dashboard/platforms', icon: TrendingUp, label: 'Busca Global', badge: 'NEW' },
  { href: '/dashboard/resume', icon: FileText, label: 'Currículo IA' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/applications', icon: Briefcase, label: 'Candidaturas' },
];

const bottomItems = [
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080812] flex">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 flex flex-col
        bg-[#0a0a18] border-r border-white/[0.06]
        transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold shadow-glow-sm">
              OA
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-none">Oliveira Apply</div>
              <div className="text-[10px] text-white/40 mt-0.5">AI Platform</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-none">
          <div className="text-[10px] text-white/25 font-medium uppercase tracking-widest px-3 py-2">Menu</div>
          {navItems.map(({ href, icon: Icon, label, badge }: any) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
              >
                <Icon size={16} className={active ? 'text-brand-400' : 'text-white/40 group-hover:text-white/70'} />
                {label}
                {badge && !active && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    {badge}
                  </span>
                )}
                {active && <ChevronRight size={12} className="ml-auto text-brand-400/60" />}
              </Link>
            );
          })}

          <div className="text-[10px] text-white/25 font-medium uppercase tracking-widest px-3 py-2 mt-4">Sistema</div>
          {bottomItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.05] transition-all duration-200 group"
            >
              <Icon size={16} className="text-white/40 group-hover:text-white/70" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center text-xs font-bold text-brand-300">
              OL
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">Oliveira</div>
              <div className="text-xs text-white/40 truncate">Plano Pro</div>
            </div>
            <LogOut size={14} className="text-white/30 hover:text-white/60 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#080812]/80 backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2">
            <Menu size={18} />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistema ativo
            </div>
            <button className="relative btn-ghost p-2">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
