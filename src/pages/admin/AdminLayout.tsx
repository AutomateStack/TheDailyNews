import { Navigate, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, FileText, FolderOpen, LogOut, ArrowLeft, Shield } from 'lucide-react'

export default function AdminLayout() {
  const { isAdmin, loading, signOut, profile, user } = useAuth()

  if (loading || (user && !profile)) return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" /></div>
  if (!isAdmin) return <Navigate to="/auth" replace />

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/articles', icon: FileText, label: 'Articles', end: false },
    { to: '/admin/categories', icon: FolderOpen, label: 'Categories', end: false },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-64 bg-neutral-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-neutral-800">
          <h2 className="text-lg font-bold"><Shield size={18} className="inline mr-2 text-primary-400" />Admin Panel</h2>
          <p className="text-xs text-neutral-400 mt-1">{profile?.full_name || 'Admin'}</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-primary-600/20 text-primary-300 border-r-2 border-primary-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
              <item.icon size={18} />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800 space-y-2">
          <a href="/" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-1"><ArrowLeft size={16} />Back to Site</a>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 transition-colors px-1"><LogOut size={16} />Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-8"><Outlet /></div></main>
    </div>
  )
}
