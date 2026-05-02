import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Category } from '../../types/database'
import { ArrowLeft, Save, Eye, Star, Zap } from 'lucide-react'

type FormData = {
  title: string; slug: string; excerpt: string; content: string; featured_image_url: string;
  category_id: string; status: 'draft' | 'published' | 'archived'; is_featured: boolean; is_breaking: boolean;
}

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [form, setForm] = useState<FormData>({
    title: '', slug: '', excerpt: '', content: '', featured_image_url: '',
    category_id: '', status: 'draft', is_featured: false, is_breaking: false,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []))
    if (isEditing) {
      supabase.from('articles').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm({ title: data.title, slug: data.slug, excerpt: data.excerpt || '', content: data.content || '', featured_image_url: data.featured_image_url || '', category_id: data.category_id || '', status: data.status, is_featured: data.is_featured, is_breaking: data.is_breaking })
      })
    }
  }, [id, isEditing])

  const handleChange = (field: keyof FormData, value: any) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async (publishStatus?: 'draft' | 'published') => {
    setError(''); setSaving(true)
    const status = publishStatus || form.status
    const payload: any = { ...form, status, category_id: form.category_id || null, author_id: profile?.id }
    if (status === 'published') payload.published_at = payload.published_at || new Date().toISOString()
    try {
      if (isEditing) { const { error } = await supabase.from('articles').update(payload).eq('id', id); if (error) throw error }
      else { const { error } = await supabase.from('articles').insert(payload); if (error) throw error }
      navigate('/admin/articles')
    } catch (err: any) { setError(err.message || 'Failed to save article') }
    setSaving(false)
  }

  const imageSuggestions = [
    'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/97075/pexels-photo-97075.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/373076/pexels-photo-373076.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/251041/pexels-photo-251041.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/398532/pexels-photo-398532.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ]

  if (preview) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setPreview(false)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800"><ArrowLeft size={16} />Back to Editor</button>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${form.status === 'published' ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'}`}>{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</span>
        </div>
        {form.featured_image_url && <img src={form.featured_image_url} alt="" className="w-full rounded-xl mb-8 shadow-md" />}
        <h1 className="text-4xl font-bold text-neutral-900 font-serif mb-4">{form.title || 'Untitled'}</h1>
        {form.excerpt && <p className="text-lg text-neutral-600 mb-8">{form.excerpt}</p>}
        <div className="article-content">
          {form.content.split('\n').map((p, i) => {
            if (!p.trim()) return null
            if (p.startsWith('## ')) return <h2 key={i}>{p.replace('## ', '')}</h2>
            if (p.startsWith('### ')) return <h3 key={i}>{p.replace('### ', '')}</h3>
            if (p.startsWith('> ')) return <blockquote key={i}><p>{p.replace('> ', '')}</p></blockquote>
            return <p key={i}>{p}</p>
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/articles')} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-bold text-neutral-900">{isEditing ? 'Edit Article' : 'New Article'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"><Eye size={16} />Preview</button>
          <button onClick={() => handleSave('draft')} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"><Save size={16} />Save Draft</button>
          <button onClick={() => handleSave('published')} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"><Zap size={16} />Publish</button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-accent-50 border border-accent-200 rounded-lg text-sm text-accent-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="Enter article title..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Slug (auto-generated from title)</label>
              <input type="text" value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} className="w-full px-4 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono" placeholder="auto-generated-from-title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Excerpt</label>
              <textarea value={form.excerpt} onChange={(e) => handleChange('excerpt', e.target.value)} rows={2} className="w-full px-4 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none" placeholder="Brief summary of the article..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Content</label>
              <textarea value={form.content} onChange={(e) => handleChange('content', e.target.value)} rows={20} className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-y font-serif leading-relaxed" placeholder="Write your article content here...&#10;&#10;Use ## for headings&#10;Use > for blockquotes&#10;Separate paragraphs with blank lines" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <h3 className="font-semibold text-neutral-900 text-sm">Publishing</h3>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Category</label>
              <select value={form.category_id} onChange={(e) => handleChange('category_id', e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">No Category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={(e) => handleChange('is_featured', e.target.checked)} className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500" /><Star size={14} className="text-warning-500" /><span className="text-sm text-neutral-700">Featured</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_breaking} onChange={(e) => handleChange('is_breaking', e.target.checked)} className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500" /><Zap size={14} className="text-accent-500" /><span className="text-sm text-neutral-700">Breaking News</span></label>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
            <h3 className="font-semibold text-neutral-900 text-sm">Featured Image</h3>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Image URL</label>
              <input type="url" value={form.featured_image_url} onChange={(e) => handleChange('featured_image_url', e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://..." />
            </div>
            {form.featured_image_url && <img src={form.featured_image_url} alt="" className="w-full h-32 object-cover rounded-lg" />}
            <div>
              <p className="text-xs text-neutral-400 mb-2">Quick picks:</p>
              <div className="grid grid-cols-3 gap-2">
                {imageSuggestions.map((url, i) => (
                  <button key={i} onClick={() => handleChange('featured_image_url', url)} className="h-12 rounded overflow-hidden border-2 border-transparent hover:border-primary-400 transition-colors">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
