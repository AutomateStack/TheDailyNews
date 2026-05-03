/**
 * Daily News Bot — pulls live RSS feeds, rewrites professionally with OpenAI,
 * attaches Unsplash images, and posts to Supabase for every category.
 *
 * Required env vars:
 *   SUPABASE_URL           — your project URL
 *   SUPABASE_SERVICE_KEY   — service_role key (bypasses RLS)
 *   OPENAI_API_KEY         — from platform.openai.com
 *   UNSPLASH_ACCESS_KEY    — from unsplash.com/developers
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Parser from 'rss-parser'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

const BOT_EMAIL = 'newsbot@thedailynews.internal'
const ARTICLES_PER_CATEGORY = 2

// ─── RSS feed map ─────────────────────────────────────────────────────────────
// Each category slug maps to an ordered list of feed URLs.
// The bot tries each URL in order and uses the first one that works.
// Unknown category slugs fall back to DEFAULT_FEEDS.

const RSS_FEEDS = {
  technology: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  ],
  tech: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  ],
  sports: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
  ],
  sport: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
  ],
  business: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
  ],
  finance: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
  ],
  economy: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml',
  ],
  entertainment: [
    'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
  ],
  celebrity: [
    'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
  ],
  health: [
    'https://feeds.bbci.co.uk/news/health/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
  ],
  wellness: [
    'https://feeds.bbci.co.uk/news/health/rss.xml',
  ],
  science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
  ],
  environment: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  ],
  world: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  ],
  politics: [
    'https://feeds.bbci.co.uk/news/politics/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
  ],
  general: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  ],
  news: [
    'https://feeds.bbci.co.uk/news/rss.xml',
  ],
}

const DEFAULT_FEEDS = [
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
]

// ─── RSS fetching ─────────────────────────────────────────────────────────────

const rssParser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
})

function extractImageFromItem(item) {
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url
  if (item.enclosure?.url?.startsWith('http')) return item.enclosure.url
  const html = item.contentEncoded || item.content || ''
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
  return match?.[1] || null
}

function extractText(item) {
  // Prefer full content; fall back to snippet/summary
  const html = item.contentEncoded || item.content || item.summary || item.contentSnippet || ''
  // Strip HTML tags for a clean plain-text body
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchNewsForCategory(categorySlug) {
  const feedUrls = RSS_FEEDS[categorySlug.toLowerCase()] ?? DEFAULT_FEEDS

  for (const url of feedUrls) {
    try {
      const feed = await rssParser.parseURL(url)
      const items = (feed.items ?? [])
        .filter((item) => item.title && (item.contentSnippet || item.content || item.summary))
        .map((item) => ({
          title: item.title,
          description: item.contentSnippet || item.summary || '',
          content: extractText(item),
          sourceName: feed.title || new URL(url).hostname,
          urlToImage: extractImageFromItem(item),
        }))

      if (items.length > 0) {
        console.log(`  RSS: ${items.length} items from ${new URL(url).hostname}`)
        return items
      }
    } catch (err) {
      console.warn(`  RSS failed (${new URL(url).hostname}): ${err.message}`)
    }
  }

  return []
}

// ─── OpenAI rewrite ───────────────────────────────────────────────────────────

async function rewriteWithOpenAI(raw, categoryName, openai) {
  const system =
    'You are a senior journalist at "The Daily News", a respected online news publication. ' +
    'Your writing is clear, authoritative, engaging, and well-structured. ' +
    'You never fabricate facts — every claim must come from the source material provided.'

  const user = `Rewrite the following news article for The Daily News.

Category: ${categoryName}
Source: ${raw.sourceName}
Original title: ${raw.title}
Summary: ${raw.description}
Body: ${raw.content.slice(0, 3000)}

Requirements:
• 650–950 words of polished prose
• A compelling, SEO-friendly headline (max 80 characters)
• Use ## subheadings to break up sections naturally
• Include relevant context so the reader understands the full picture
• End with a forward-looking paragraph
• Do NOT invent statistics, quotes, or events not present in the source

Respond ONLY with a valid JSON object using these exact keys:
{
  "title": "Your headline here",
  "excerpt": "2–3 sentence teaser for article listings",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSlug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 70) +
    '-' +
    Date.now().toString(36)
  )
}

async function articlePostedToday(supabase, title) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('articles')
    .select('id')
    .ilike('title', title.slice(0, 60) + '%')
    .gte('published_at', today.toISOString())
    .limit(1)
  return Array.isArray(data) && data.length > 0
}

async function ensureBotUser(supabase) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', 'News Bot')
    .maybeSingle()

  if (existing) return existing.id

  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email: BOT_EMAIL,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: 'News Bot' },
  })

  if (error) throw new Error(`Failed to create bot auth user: ${error.message}`)

  await supabase.from('profiles').update({ full_name: 'News Bot' }).eq('id', user.id)
  console.log(`  Created bot user: ${user.id}`)
  return user.id
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENAI_API_KEY'].filter(
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

  console.log('\nInitialising bot user...')
  const botUserId = await ensureBotUser(supabase)
  console.log(`Bot user ID: ${botUserId}`)

  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  if (catErr) throw new Error(`Could not load categories: ${catErr.message}`)
  if (!categories?.length) { console.log('No categories found.'); return }

  console.log(`\nFound ${categories.length} categories\n`)

  const stats = { posted: 0, skipped: 0, failed: 0 }

  for (const category of categories) {
    console.log(`\n${'─'.repeat(50)}`)
    console.log(`Category: ${category.name}  (slug: ${category.slug})`)
    console.log('─'.repeat(50))

    let rawArticles
    try {
      rawArticles = await fetchNewsForCategory(category.slug)
    } catch (err) {
      console.error(`  SKIP — RSS fetch failed: ${err.message}`)
      stats.failed++
      continue
    }

    if (!rawArticles.length) {
      console.log('  No articles found in feeds.')
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

      if (await articlePostedToday(supabase, rewritten.title)) {
        console.log('  SKIP — similar article already posted today')
        stats.skipped++
        continue
      }

      console.log(`  Fetching image for: "${rewritten.imageQuery}"`)
      const imageUrl =
        (await fetchUnsplashImage(rewritten.imageQuery)) || raw.urlToImage || ''
      console.log(imageUrl ? `  Image OK` : '  Image: none')

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
        console.error(`  FAIL — DB insert: ${insertErr.message}`)
        stats.failed++
      } else {
        console.log('  POSTED')
        stats.posted++
        postedForCategory++
      }

      await sleep(2500)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(
    `  Done! Posted: ${stats.posted} | Skipped: ${stats.skipped} | Failed: ${stats.failed}`
  )
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
