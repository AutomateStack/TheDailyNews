import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Article, Category } from '../types/database'
import ArticleCard from '../components/ArticleCard'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: cat } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle()
      setCategory(cat)
      if (cat) {
        const { data } = await supabase.from('articles').select('*, categories(*), profiles(*)').eq('status', 'published').eq('category_id', cat.id).order('published_at', { ascending: false }).limit(20)
        setArticles(data || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [slug])

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12"><div className="animate-pulse space-y-6"><div className="h-10 w-48 bg-neutral-200 rounded" /><div className="h-80 bg-neutral-200 rounded-xl" /></div></div>

  if (!category) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><h2 className="text-2xl font-bold text-neutral-900 mb-2">Category Not Found</h2><p className="text-neutral-500">The category you're looking for doesn't exist.</p></div>

  const hero = articles[0]
  const rest = articles.slice(1)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: category.color }} />
          <h1 className="text-3xl font-bold text-neutral-900">{category.name}</h1>
        </div>
        {category.description && <p className="text-neutral-500 ml-5">{category.description}</p>}
      </div>
      {hero && <section className="mb-10"><ArticleCard article={hero} variant="hero" /></section>}
      {rest.length > 0 && <section><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{rest.map((article) => <ArticleCard key={article.id} article={article} variant="featured" />)}</div></section>}
      {articles.length === 0 && <div className="text-center py-16"><p className="text-neutral-400 text-lg">No articles in this category yet.</p></div>}
    </div>
  )
}
