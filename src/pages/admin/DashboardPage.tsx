import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { FileText, FolderOpen, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalArticles: 0, publishedArticles: 0, draftArticles: 0, totalCategories: 0 })
  const [recentArticles, setRecentArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const [publishedRes, draftRes, catRes, recentRes] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('articles').select('id, title, status, published_at, created_at, categories(name, color)').order('created_at', { ascending: false }).limit(5),
      ])
      setStats({ totalArticles: (publishedRes.count || 0) + (draftRes.count || 0), publishedArticles: publishedRes.count || 0, draftArticles: draftRes.count || 0, totalCategories: catRes.count || 0 })
      setRecentArticles(recentRes.data || [])
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-neutral-200 rounded" /></div>

  const statCards = [
    { label: 'Total Articles', value: stats.totalArticles, icon: FileText, color: 'bg-primary-50 text-primary-600' },
    { label: 'Published', value: stats.publishedArticles, icon: Eye, color: 'bg-success-50 text-success-600' },
    { label: 'Drafts', value: stats.draftArticles, icon: FileText, color: 'bg-warning-50 text-warning-600' },
    { label: 'Categories', value: stats.totalCategories, icon: FolderOpen, color: 'bg-neutral-100 text-neutral-600' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1><p className="text-neutral-500 text-sm mt-1">Overview of your news content</p></div>
        <Link to="/admin/articles/new" className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">+ New Article</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}><stat.icon size={20} /></div>
              <div><p className="text-2xl font-bold text-neutral-900">{stat.value}</p><p className="text-xs text-neutral-500">{stat.label}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Recent Articles</h2>
          <Link to="/admin/articles" className="text-sm text-primary-600 hover:text-primary-800 font-medium">View All &rarr;</Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {recentArticles.length === 0 && <div className="px-5 py-8 text-center text-neutral-400">No articles yet. Create your first article!</div>}
          {recentArticles.map((article: any) => (
            <div key={article.id} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{article.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {article.categories && <span className="px-1.5 py-0.5 text-[10px] font-semibold text-white rounded" style={{ backgroundColor: article.categories.color }}>{article.categories.name}</span>}
                  <span className="text-xs text-neutral-400">{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${article.status === 'published' ? 'bg-success-50 text-success-600' : article.status === 'draft' ? 'bg-warning-50 text-warning-600' : 'bg-neutral-100 text-neutral-500'}`}>
                {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
