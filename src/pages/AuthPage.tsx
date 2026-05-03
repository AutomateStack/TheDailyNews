import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Shield } from 'lucide-react'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const { signIn, signUp, user, isAdmin, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (user && isAdmin) navigate('/admin', { replace: true })
  }, [user, loading, isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    if (isSignUp) {
      const { error } = await signUp(email, password, fullName)
      if (error) setError(error)
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    }
    setSubmitting(false)
  }

  const handleClaimAdmin = async () => {
    if (!user) return
    setPromoting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setError('Not authenticated'); setPromoting(false); return }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/promote-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (result.error) setError(result.error)
      else await supabase.auth.refreshSession()
    } catch { setError('Failed to claim admin role') }
    setPromoting(false)
  }

  if (user && !isAdmin && profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">The <span className="text-primary-600">Daily</span> Herald</h1>
            <p className="text-neutral-500">Welcome, {profile.full_name || user.email}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 space-y-5">
            <div className="text-center">
              <Shield size={40} className="mx-auto text-primary-600 mb-4" />
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Become an Admin</h2>
              <p className="text-sm text-neutral-500 mb-6">No admin exists yet. Claim the admin role to manage articles, categories, and the entire site.</p>
              {error && <div className="mb-4 p-3 bg-accent-50 border border-accent-200 rounded-lg text-sm text-accent-700 text-left">{error}</div>}
              <button onClick={handleClaimAdmin} disabled={promoting} className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
                {promoting ? 'Claiming...' : 'Claim Admin Role'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">The <span className="text-primary-600">Daily</span> Herald</h1>
          <p className="text-neutral-500">{isSignUp ? 'Create your account' : 'Sign in to your account'}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm" placeholder="John Doe" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm" placeholder="Min. 6 characters" minLength={6} required />
          </div>
          {error && <div className="p-3 bg-accent-50 border border-accent-200 rounded-lg text-sm text-accent-700">{error}</div>}
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-neutral-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError('') }} className="text-primary-600 hover:text-primary-800 font-medium">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
