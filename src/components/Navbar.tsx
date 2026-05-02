import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Search, User, LogOut, Shield, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileOpen(false)
    }
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/category/politics', label: 'Politics' },
    { to: '/category/technology', label: 'Technology' },
    { to: '/category/business', label: 'Business' },
    { to: '/category/sports', label: 'Sports' },
    { to: '/category/entertainment', label: 'Entertainment' },
    { to: '/category/health', label: 'Health' },
    { to: '/category/science', label: 'Science' },
    { to: '/category/world', label: 'World' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="bg-neutral-900 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="font-medium tracking-wide">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-1.5 hover:text-primary-300 transition-colors">
                  <User size={14} />
                  <span>{profile?.full_name || user.email}</span>
                  <ChevronDown size={12} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-neutral-800 rounded-lg shadow-lg border border-neutral-200 py-1 animate-slide-down">
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-50 text-sm">
                        <Shield size={14} /> Admin Dashboard
                      </Link>
                    )}
                    <button onClick={() => { signOut(); setProfileOpen(false) }} className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-50 text-sm w-full text-left text-accent-600">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="hover:text-primary-300 transition-colors">Sign In</Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              The <span className="text-primary-600">Daily</span> Herald
            </h1>
          </Link>
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-sm bg-neutral-100 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </div>
          </form>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-neutral-600 hover:text-neutral-900">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <nav className="hidden md:block border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1 overflow-x-auto py-0">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}
                  className={`block px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    location.pathname === link.to ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-600 hover:text-primary-600 hover:border-primary-300'
                  }`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white animate-slide-down">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm bg-neutral-100 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </form>
            <ul className="space-y-0.5">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.to ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  )
}
