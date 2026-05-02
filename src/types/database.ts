export type Category = {
  id: string
  name: string
  slug: string
  description: string
  color: string
  sort_order: number
  created_at: string
}

export type Article = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string
  category_id: string | null
  author_id: string | null
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  is_breaking: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  categories?: Category | null
  profiles?: Profile | null
}

export type Profile = {
  id: string
  full_name: string
  role: 'admin' | 'reader'
  avatar_url: string
  created_at: string
}
