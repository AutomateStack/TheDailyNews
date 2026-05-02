import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Article, Category } from '../types/database'
import ArticleCard from '../components/ArticleCard'
import { Zap } from 'lucide-react'

export default function HomePage() {
  const [heroArticle, setHeroArticle] = useState<Article | null>(null)
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [latestArticles, setLatestArticles] = useState<Article[]>([])
  const [breakingArticles, setBreakingArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [heroRes, featuredRes, latestRes, breakingRes, catRes] = await Promise.all([
        supabase.from('articles').select('*, categories(*), profiles(*)').eq('status', 'published').eq('is_featured', true).order('published_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('articles').select('*, categories(*), profiles(*)').eq('status', 'published').order('published_at', { ascending: false }).limit(6),
        supabase.from('articles').select('*, categories(*), profiles(*)').eq('status', 'published').order('published_at', { ascending: false }).range(6, 15),
        supabase.from('articles').select('*, categories(*), profiles(*)').eq('status', 'published').eq('is_breaking', true).order('published_at', { ascending: false }).limit(5),
        supabase.from('categories').select('*').order('sort_order'),
      ])
      setHeroArticle(heroRes.data)
      setFeaturedArticles(featuredRes.data || [])
      setLatestArticles(latestRes.data || [])
      setBreakingArticles(breakingRes.data || [])
      setCategories(catRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-80 bg-neutral-200 rounded-2xl" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-neutral-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  const topFeatured = heroArticle ? featuredArticles.filter(a => a.id !== heroArticle.id).slice(0, 5) : featuredArticles.slice(0, 5)
  const sidebarArticles = latestArticles.slice(0, 8)

  return (
    <div className="max-w-7xl mx-auto px-4">
      {breakingArticles.length > 0 && (
        <div className="bg-accent-600 text-white py-2 px-4 rounded-lg mt-6 flex items-center gap-3 animate-fade-in">
          <Zap size={16} className="flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0">Breaking:</span>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium truncate">{breakingArticles.map(a => a.title).join('  |  ')}</p>
          </div>
        </div>
      )}

      {heroArticle && <section className="mt-6"><ArticleCard article={heroArticle} variant="hero" /></section>}

      <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 rounded-full bg-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900">Top Stories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topFeatured.slice(0, 4).map((article) => <ArticleCard key={article.id} article={article} variant="featured" />)}
          </div>
        </div>
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 sticky top-36">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 pb-3 border-b border-neutral-100">Latest News</h3>
            <div className="space-y-0">
              {sidebarArticles.map((article) => <ArticleCard key={article.id} article={article} variant="compact" />)}
            </div>
          </div>
        </aside>
      </section>

      {categories.slice(0, 4).map((cat) => {
        const catArticles = [...featuredArticles, ...latestArticles].filter(a => a.category_id === cat.id)
        if (catArticles.length === 0) return null
        return (
          <section key={cat.id} className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: cat.color }} />
                <h2 className="text-xl font-bold text-neutral-900">{cat.name}</h2>
              </div>
              <a href={`/category/${cat.slug}`} className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors">View All &rarr;</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {catArticles.slice(0, 4).map((article) => <ArticleCard key={article.id} article={article} variant="featured" />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
