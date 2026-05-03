/**
 * Daily News Bot — fetches real news, rewrites professionally with OpenAI,
 * attaches Unsplash images, and posts to Supabase for every category.
 *
 * Required env vars:
 *   SUPABASE_URL           — your project URL
 *   SUPABASE_SERVICE_KEY   — service_role key (bypasses RLS)
 *   NEWSAPI_KEY            — from newsapi.org
 *   OPENAI_API_KEY         — from platform.openai.com
 *   UNSPLASH_ACCESS_KEY    — from unsplash.com/developers  (optional)
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const NEWSAPI_KEY = process.env.NEWSAPI_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

const BOT_EMAIL = 'newsbot@thedailynews.internal'
const ARTICLES_PER_CATEGORY = 2   // how many articles to post per category per day

// Maps your category slugs to NewsAPI top-headlines categories.
// Slugs not listed here fall back to a keyword search using the category name.
const NEWSAPI_CATEGORY_MAP = {
  technology: 'technology',
  tech: 'technology',
  sports: 'sports',
  sport: 'sports',
  business: 'business',
  finance: 'business',
  economy: 'business',
  entertainment: 'entertainment',
  celebrity: 'entertainment',
  health: 'health',
  wellness: 'health',
  science: 'science',
  world: 'general',
  politics: 'general',
  general: 'general',
  news: 'general',
}

// ─── News fetching ────────────────────────────────────────────────────────────

async function fetchNewsForCategory(categorySlug, categoryName) {
  const mapped = NEWSAPI_CATEGORY_MAP[categorySlug.toLowerCase()]
  let url

  if (mapped) {
    url = `https://newsapi.org/v2/top-headlines?category=${mapped}&language=en&pageSize=5&apiKey=${NEWSAPI_KEY}`
  } else {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(categoryName)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWSAPI_KEY}`
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`NewsAPI error ${res.status}: ${await res.text()}`)

  const data = await res.json()
  if (data.status !== 'ok') throw new Error(`NewsAPI: ${data.message}`)

  return (data.articles || []).filter(
    (a) => a.title && a.title !== '[Removed]' && a.description && a.content
  )
}

// ─── OpenAI rewrite ───────────────────────────────────────────────────────────

async function rewriteWithOpenAI(rawArticle, categoryName, openai) {
  const system = `You are a senior journalist at "The Daily News", a respected online news publication.
Your writing is clear, authoritative, engaging, and well-structured.
You never fabricate facts — every claim must come from the source material provided.`

  const user = `Rewrite the following news article for The Daily News.

Category: ${categoryName}
Source: ${rawArticle.source?.name || 'News Wire'}
Original title: ${rawArticle.title}
Summary: ${rawArticle.description}
Body: ${rawArticle.content}

Requirements:
• 650–950 words of polished prose
• A compelling, SEO-friendly headline (max 80 characters)
• Use ## subheadings to break up sections naturally
• Include relevant context so the reader understands the full picture
• End with a forward-looking paragraph
• Do NOT invent statistics, quotes, or events not present in the source

Respond ONLY with a valid JSON object — no markdown fences — using these exact keys:
{
  "title": "Your headline here",
  "excerpt": "2–3 sentence teaser that appears under the headline in article listings",
  "content": "Full article in Markdown",
  "imageQuery": "4–6 keywords for a relevant stock photo, e.g. \\"electric vehicle charging station\\"",
  "isBreaking": false
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.75,
    max_tokens: 1800,
  })

  const parsed = JSON.parse(completion.choices[0].message.content)

  // Validate required keys
  for (const key of ['title', 'excerpt', 'content', 'imageQuery']) {
    if (!parsed[key]) throw new Error(`OpenAI response missing field: ${key}`)
  }

  return parsed
}

// ─── Unsplash image ───────────────────────────────────────────────────────────

async function fetchUnsplashImage(query) {
  if (!UNSPLASH_ACCESS_KEY) return null

  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data?.urls?.regular ?? null
  } catch {
    return null
  }
}

// ─── Slug generation ──────────────────────────────────────────────────────────

function buildSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70)

  // Append a short timestamp token to guarantee uniqueness
  return `${base}-${Date.now().toString(36)}`
}

// ─── Duplicate guard ──────────────────────────────────────────────────────────

async function articlePostedToday(supabase, title) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('articles')
    .select('id')
    .ilike('title', title.slice(0, 60) + '%')
    .gte('published_at', today.toISOString())
    .limit(1)

  return data && data.length > 0
}

// ─── Bot user ─────────────────────────────────────────────────────────────────

async function ensureBotUser(supabase) {
  // Look for existing bot profile by email pattern stored in full_name sentinel
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', 'News Bot')
    .maybeSingle()

  if (existing) return existing.id

  // Create a real Supabase auth user for the bot (needed for FK on articles.author_id)
  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email: BOT_EMAIL,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: 'News Bot' },
  })

  if (error) throw new Error(`Failed to create bot auth user: ${error.message}`)

  // The handle_new_user trigger creates the profile row; update the name
  await supabase
    .from('profiles')
    .update({ full_name: 'News Bot' })
    .eq('id', user.id)

  console.log(`  Created bot user: ${user.id}`)
  return user.id
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'NEWSAPI_KEY', 'OPENAI_API_KEY'].filter(
    (k) => !process.env[k]
  )
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log('='.repeat(60))
  console.log('  The Daily News — Daily News Bot')
  console.log(`  ${new Date().toUTCString()}`)
  console.log('='.repeat(60))

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

  // Ensure bot user exists
  console.log('\nInitialising bot user...')
  const botUserId = await ensureBotUser(supabase)
  console.log(`Bot user ID: ${botUserId}`)

  // Load categories
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  if (catErr) throw new Error(`Could not load categories: ${catErr.message}`)
  if (!categories?.length) {
    console.log('No categories found — nothing to post.')
    return
  }
  console.log(`\nFound ${categories.length} categories\n`)

  const stats = { posted: 0, skipped: 0, failed: 0 }

  for (const category of categories) {
    console.log(`\n${'─'.repeat(50)}`)
    console.log(`Category: ${category.name}  (slug: ${category.slug})`)
    console.log('─'.repeat(50))

    let rawArticles
    try {
      rawArticles = await fetchNewsForCategory(category.slug, category.name)
      console.log(`  Fetched ${rawArticles.length} raw articles from NewsAPI`)
    } catch (err) {
      console.error(`  SKIP — NewsAPI fetch failed: ${err.message}`)
      stats.failed++
      continue
    }

    let postedForCategory = 0

    for (const raw of rawArticles) {
      if (postedForCategory >= ARTICLES_PER_CATEGORY) break

      console.log(`\n  Source: "${raw.title.slice(0, 70)}..."`)

      let rewritten
      try {
        console.log('  Rewriting with OpenAI...')
        rewritten = await rewriteWithOpenAI(raw, category.name, openai)
        console.log(`  Title:  "${rewritten.title}"`)
      } catch (err) {
        console.error(`  SKIP — OpenAI failed: ${err.message}`)
        stats.failed++
        await sleep(2000)
        continue
      }

      // Duplicate guard
      if (await articlePostedToday(supabase, rewritten.title)) {
        console.log('  SKIP — similar article already posted today')
        stats.skipped++
        continue
      }

      // Image
      console.log(`  Fetching image for: "${rewritten.imageQuery}"`)
      const imageUrl =
        (await fetchUnsplashImage(rewritten.imageQuery)) ||
        raw.urlToImage ||
        ''
      console.log(imageUrl ? `  Image: ${imageUrl.slice(0, 60)}...` : '  Image: none')

      // Insert
      const { error: insertErr } = await supabase.from('articles').insert({
        title: rewritten.title,
        slug: buildSlug(rewritten.title),
        excerpt: rewritten.excerpt,
        content: rewritten.content,
        featured_image_url: imageUrl,
        category_id: category.id,
        author_id: botUserId,
        status: 'published',
        is_featured: false,
        is_breaking: rewritten.isBreaking === true,
        published_at: new Date().toISOString(),
      })

      if (insertErr) {
        console.error(`  FAIL — DB insert error: ${insertErr.message}`)
        stats.failed++
      } else {
        console.log('  POSTED successfully')
        stats.posted++
        postedForCategory++
      }

      await sleep(2500) // stay within OpenAI rate limits
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`  Done! Posted: ${stats.posted} | Skipped: ${stats.skipped} | Failed: ${stats.failed}`)
  console.log('='.repeat(60))
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

main().catch((err) => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
