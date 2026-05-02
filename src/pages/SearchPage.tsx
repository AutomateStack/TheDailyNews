import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Article } from '../types/database'
import ArticleCard from '../components/ArticleCard'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setArticles([]); return }
    async function search() {
      setLoading(true)
      const { data } = await supabase.from('articles').select('*, categories(*), profiles(*)').eq('status', 'published').or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`).order('published_at', { ascending: false }).limit(20)
      setArticles(data || [])
      setLoading(false)
    }
    search()
  }, [query])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2"><Search size={24} className="text-primary-600" /><h1 className="text-2xl font-bold text-neutral-900">Search Results</h1></div>
        <p className="text-neutral-500">{loading ? 'Searching...' : `${articles.length} result${articles.length !== 1 ? 's' : ''} for "${query}"`}</p>
      </div>
      {loading && <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-neutral-200 rounded-lg" />)}</div>}
      {!loading && articles.length > 0 && <div className="space-y-0 divide-y divide-neutral-200">{articles.map((article) => <ArticleCard key={article.id} article={article} variant="standard" />)}</div>}
      {!loading && query && articles.length === 0 && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-neutral-300 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">No results found</h2>
          <p className="text-neutral-400">Try different keywords or browse categories.</p>
        </div>
      )}
    </div>
  )
}
