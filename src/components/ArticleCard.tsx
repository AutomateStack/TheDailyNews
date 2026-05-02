import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { Article } from '../types/database'

type Props = { article: Article; variant?: 'hero' | 'featured' | 'standard' | 'compact' }

export default function ArticleCard({ article, variant = 'standard' }: Props) {
  const category = article.categories
  const author = article.profiles
  const timeAgo = article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ''

  if (variant === 'hero') {
    return (
      <Link to={`/article/${article.slug}`} className="group relative block overflow-hidden rounded-2xl bg-neutral-900 animate-fade-in">
        <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden">
          {article.featured_image_url ? (
            <img src={article.featured_image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-3 mb-3">
            {article.is_breaking && <span className="px-2.5 py-1 bg-accent-600 text-white text-xs font-bold uppercase tracking-wider rounded animate-pulse">Breaking</span>}
            {category && <span className="px-2.5 py-1 text-white text-xs font-semibold uppercase tracking-wider rounded" style={{ backgroundColor: category.color }}>{category.name}</span>}
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-primary-200 transition-colors">{article.title}</h2>
          {article.excerpt && <p className="text-neutral-300 text-sm md:text-base line-clamp-2 max-w-2xl leading-relaxed">{article.excerpt}</p>}
          <div className="flex items-center gap-3 mt-4 text-neutral-400 text-sm">
            {author?.full_name && <span>By {author.full_name}</span>}
            {timeAgo && <span>&middot; {timeAgo}</span>}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link to={`/article/${article.slug}`} className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-md transition-all duration-300 animate-slide-up">
        <div className="aspect-[16/10] overflow-hidden">
          {article.featured_image_url ? (
            <img src={article.featured_image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
              <span className="text-neutral-400 text-4xl font-serif font-bold">N</span>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            {article.is_breaking && <span className="px-2 py-0.5 bg-accent-600 text-white text-[10px] font-bold uppercase tracking-wider rounded">Breaking</span>}
            {category && <span className="px-2 py-0.5 text-white text-[10px] font-semibold uppercase tracking-wider rounded" style={{ backgroundColor: category.color }}>{category.name}</span>}
          </div>
          <h3 className="text-lg font-bold text-neutral-900 leading-snug mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">{article.title}</h3>
          {article.excerpt && <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed flex-1">{article.excerpt}</p>}
          <div className="flex items-center gap-2 mt-3 text-xs text-neutral-400">
            {author?.full_name && <span>{author.full_name}</span>}
            {timeAgo && <span>&middot; {timeAgo}</span>}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link to={`/article/${article.slug}`} className="group flex gap-4 py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors -mx-2 px-2 rounded">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {category && <span className="px-1.5 py-0.5 text-white text-[9px] font-semibold uppercase tracking-wider rounded" style={{ backgroundColor: category.color }}>{category.name}</span>}
          </div>
          <h4 className="text-sm font-semibold text-neutral-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">{article.title}</h4>
          <span className="text-xs text-neutral-400 mt-1 block">{timeAgo}</span>
        </div>
        {article.featured_image_url && (
          <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden">
            <img src={article.featured_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </Link>
    )
  }

  return (
    <Link to={`/article/${article.slug}`} className="group flex gap-5 py-4 border-b border-neutral-200 last:border-0 animate-fade-in">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {article.is_breaking && <span className="px-2 py-0.5 bg-accent-600 text-white text-[10px] font-bold uppercase tracking-wider rounded animate-pulse">Breaking</span>}
          {category && <span className="px-2 py-0.5 text-white text-[10px] font-semibold uppercase tracking-wider rounded" style={{ backgroundColor: category.color }}>{category.name}</span>}
        </div>
        <h3 className="text-base font-bold text-neutral-900 leading-snug mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-2">{article.title}</h3>
        {article.excerpt && <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">{article.excerpt}</p>}
        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
          {author?.full_name && <span>{author.full_name}</span>}
          {timeAgo && <span>&middot; {timeAgo}</span>}
        </div>
      </div>
      {article.featured_image_url && (
        <div className="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <img src={article.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
    </Link>
  )
}
