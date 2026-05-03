import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Article } from '../types/database'
import { format } from 'date-fns'
import { ArrowLeft, Clock, User, Share2, Bookmark } from 'lucide-react'
import AdBanner from '../components/AdBanner'

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true)
      const { data } = await supabase.from('articles').select('*, categories(*), profiles(*)').eq('slug', slug).eq('status', 'published').maybeSingle()
      setArticle(data)
      if (data?.category_id) {
        const { data: related } = await supabase.from('articles').select('*, categories(*), profiles(*)').eq('status', 'published').eq('category_id', data.category_id).neq('id', data.id).order('published_at', { ascending: false }).limit(4)
        setRelatedArticles(related || [])
      }
      setLoading(false)
    }
    fetchArticle()
  }, [slug])

  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><div className="animate-pulse space-y-6"><div className="h-8 w-3/4 bg-neutral-200 rounded" /><div className="h-4 w-1/2 bg-neutral-200 rounded" /><div className="h-96 bg-neutral-200 rounded-xl" /></div></div>

  if (!article) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><h2 className="text-2xl font-bold text-neutral-900 mb-2">Article Not Found</h2><p className="text-neutral-500 mb-6">The article you're looking for doesn't exist.</p><Link to="/" className="text-primary-600 hover:text-primary-800 font-medium">&larr; Back to Home</Link></div>

  const category = article.categories
  const author = article.profiles
  const publishedDate = article.published_at ? format(new Date(article.published_at), 'MMMM d, yyyy') : ''
  const readTime = Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200))

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
        <span>/</span>
        {category && <><Link to={`/category/${category.slug}`} className="hover:text-primary-600 transition-colors">{category.name}</Link><span>/</span></>}
        <span className="text-neutral-600 truncate">{article.title}</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {article.is_breaking && <span className="px-2.5 py-1 bg-accent-600 text-white text-xs font-bold uppercase tracking-wider rounded animate-pulse">Breaking</span>}
          {category && <Link to={`/category/${category.slug}`} className="px-2.5 py-1 text-white text-xs font-semibold uppercase tracking-wider rounded hover:opacity-80 transition-opacity" style={{ backgroundColor: category.color }}>{category.name}</Link>}
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight mb-5 font-serif">{article.title}</h1>
        {article.excerpt && <p className="text-lg text-neutral-600 leading-relaxed mb-5">{article.excerpt}</p>}
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 border-b border-neutral-200 pb-5">
          {author?.full_name && <div className="flex items-center gap-1.5"><User size={14} /><span className="font-medium text-neutral-700">{author.full_name}</span></div>}
          {publishedDate && <div className="flex items-center gap-1.5"><Clock size={14} /><span>{publishedDate}</span></div>}
          <span>{readTime} min read</span>
          <div className="flex-1" />
          <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="flex items-center gap-1.5 text-neutral-400 hover:text-primary-600 transition-colors"><Share2 size={14} /><span className="hidden sm:inline">Share</span></button>
          <button className="flex items-center gap-1.5 text-neutral-400 hover:text-primary-600 transition-colors"><Bookmark size={14} /><span className="hidden sm:inline">Save</span></button>
        </div>
      </header>

      {article.featured_image_url && <figure className="mb-6"><img src={article.featured_image_url} alt={article.title} className="w-full rounded-xl shadow-md" /></figure>}

      {/* Ad below featured image */}
      <AdBanner slot="REPLACE_ARTICLE_TOP_SLOT" className="mb-10" />

      <div className="article-content mb-8">
        {(() => {
          let count = 0
          return article.content.split('\n').flatMap((paragraph, i) => {
            if (!paragraph.trim()) return []
            let el
            if (paragraph.startsWith('## ')) el = <h2 key={i}>{paragraph.replace('## ', '')}</h2>
            else if (paragraph.startsWith('### ')) el = <h3 key={i}>{paragraph.replace('### ', '')}</h3>
            else if (paragraph.startsWith('> ')) el = <blockquote key={i}><p>{paragraph.replace('> ', '')}</p></blockquote>
            else el = <p key={i}>{paragraph}</p>
            count++
            // Inject mid-article ad after the 4th rendered block
            if (count === 4) {
              return [el, <AdBanner key="mid-ad" slot="REPLACE_ARTICLE_MID_SLOT" className="my-8" />]
            }
            return [el]
          })
        })()}
      </div>

      {/* Ad after article body */}
      <AdBanner slot="REPLACE_ARTICLE_BOTTOM_SLOT" className="mb-12" />

      {relatedArticles.length > 0 && (
        <section className="border-t border-neutral-200 pt-10">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Related Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedArticles.map((a) => (
              <Link key={a.id} to={`/article/${a.slug}`} className="group flex gap-4 p-4 rounded-xl border border-neutral-100 hover:border-primary-200 hover:shadow-sm transition-all">
                {a.featured_image_url && <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden"><img src={a.featured_image_url} alt="" className="w-full h-full object-cover" /></div>}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2">{a.title}</h3>
                  {a.excerpt && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{a.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 pt-6 border-t border-neutral-200">
        <Link to={category ? `/category/${category.slug}` : '/'} className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors">
          <ArrowLeft size={16} /> Back to {category?.name || 'Home'}
        </Link>
      </div>
    </article>
  )
}
