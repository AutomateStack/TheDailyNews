import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Article, Category } from '../../types/database'
import { Plus, Search, Trash2, Edit3, Eye, EyeOff } from 'lucide-react'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchArticles()
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []))
  }, [])

  async function fetchArticles() {
    setLoading(true)
    const { data } = await supabase.from('articles').select('*, categories(*), profiles(*)').order('created_at', { ascending: false })
    setArticles(data || [])
    setLoading(false)
  }

  async function deleteArticle(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return
    await supabase.from('articles').delete().eq('id', id)
    setArticles((prev) => prev.filter((a) => a.id !== id))
  }

  async function toggleStatus(article: Article) {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    const updates: any = { status: newStatus }
    if (newStatus === 'published' && !article.published_at) updates.published_at = new Date().toISOString()
    await supabase.from('articles').update(updates).eq('id', article.id)
    setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, ...updates } : a)))
  }

  const filtered = articles.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (filterCategory !== 'all' && a.category_id !== filterCategory) return false
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Articles</h1><p className="text-neutral-500 text-sm mt-1">{articles.length} total articles</p></div>
        <Link to="/admin/articles/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"><Plus size={16} />New Article</Link>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="all">All Status</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="all">All Categories</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-neutral-400">Loading...</div> : filtered.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">{searchQuery || filterStatus !== 'all' || filterCategory !== 'all' ? 'No articles match your filters.' : 'No articles yet. Create your first article!'}</div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((article) => (
                <tr key={article.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {article.is_breaking && <span className="px-1.5 py-0.5 bg-accent-600 text-white text-[9px] font-bold rounded">!</span>}
                      {article.is_featured && <span className="px-1.5 py-0.5 bg-warning-500 text-white text-[9px] font-bold rounded">F</span>}
                      <span className="text-sm font-medium text-neutral-900 truncate max-w-xs">{article.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {article.categories && <span className="px-2 py-0.5 text-[10px] font-semibold text-white rounded" style={{ backgroundColor: article.categories.color }}>{article.categories.name}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${article.status === 'published' ? 'bg-success-50 text-success-600' : article.status === 'draft' ? 'bg-warning-50 text-warning-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-400 hidden lg:table-cell">{new Date(article.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleStatus(article)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title={article.status === 'published' ? 'Unpublish' : 'Publish'}>
                        {article.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <Link to={`/admin/articles/edit/${article.id}`} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Edit3 size={16} /></Link>
                      <button onClick={() => deleteArticle(article.id)} className="p-1.5 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
