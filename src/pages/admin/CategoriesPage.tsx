import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types/database'
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '', color: '#1a1a2e' })
  const [editForm, setEditForm] = useState<Partial<Category>>({})
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
    setLoading(false)
  }

  async function createCategory() {
    if (!newCat.name.trim()) return
    const slug = newCat.slug || newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await supabase.from('categories').insert({ name: newCat.name, slug, description: newCat.description, color: newCat.color, sort_order: categories.length + 1 })
    setNewCat({ name: '', slug: '', description: '', color: '#1a1a2e' })
    setShowNew(false)
    fetchCategories()
  }

  async function updateCategory(id: string) {
    await supabase.from('categories').update(editForm).eq('id', id)
    setEditing(null); setEditForm({}); fetchCategories()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Articles will become uncategorized.')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Categories</h1><p className="text-neutral-500 text-sm mt-1">{categories.length} categories</p></div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"><Plus size={16} />New Category</button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6 animate-slide-down">
          <h3 className="font-semibold text-neutral-900 mb-4">New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-neutral-500 mb-1">Name</label><input type="text" value={newCat.name} onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Category name" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 mb-1">Slug (auto-generated)</label><input type="text" value={newCat.slug} onChange={(e) => setNewCat((p) => ({ ...p, slug: e.target.value }))} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono" placeholder="auto-generated" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 mb-1">Description</label><input type="text" value={newCat.description} onChange={(e) => setNewCat((p) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Brief description" /></div>
            <div><label className="block text-xs font-medium text-neutral-500 mb-1">Color</label><div className="flex items-center gap-2"><input type="color" value={newCat.color} onChange={(e) => setNewCat((p) => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded border border-neutral-300 cursor-pointer" /><input type="text" value={newCat.color} onChange={(e) => setNewCat((p) => ({ ...p, color: e.target.value }))} className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono" /></div></div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={createCategory} className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"><Save size={14} />Create</button>
            <button onClick={() => setShowNew(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"><X size={14} />Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-neutral-400">Loading...</div> : categories.length === 0 ? <div className="p-8 text-center text-neutral-400">No categories yet.</div> : (
          <table className="w-full">
            <thead><tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Slug</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3">
                    {editing === cat.id ? <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 outline-none" /> : (
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-sm font-medium text-neutral-900">{cat.name}</span></div>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {editing === cat.id ? <input type="text" value={editForm.slug || ''} onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))} className="px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 outline-none font-mono" /> : <span className="text-sm text-neutral-400 font-mono">{cat.slug}</span>}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {editing === cat.id ? <input type="text" value={editForm.description || ''} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} className="px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 outline-none w-full" /> : <span className="text-sm text-neutral-500">{cat.description}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editing === cat.id ? (
                        <><button onClick={() => updateCategory(cat.id)} className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors"><Save size={16} /></button><button onClick={() => { setEditing(null); setEditForm({}) }} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded transition-colors"><X size={16} /></button></>
                      ) : (
                        <><button onClick={() => { setEditing(cat.id); setEditForm({ name: cat.name, slug: cat.slug, description: cat.description, color: cat.color }) }} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Edit3 size={16} /></button><button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 rounded transition-colors"><Trash2 size={16} /></button></>
                      )}
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
