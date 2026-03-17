import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { fetchArticles } from '@/hooks/useArticles'
import { getViewCounts } from '@/lib/telemetry'
import type { Article } from '@/types'

export default function ArticleFeed() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    const list = await fetchArticles()
    setArticles(list)
    // Fetch view counts for all article paths
    const paths = list.map((a) => `/blog/${a.slug}`)
    getViewCounts(paths).then(setViewCounts)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Extract all unique tags from articles
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    articles.forEach((a) => a.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [articles])

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  // Filter articles by search + active tags
  const filtered = useMemo(() => {
    let list = articles
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author_name?.toLowerCase().includes(q)
      )
    }
    if (activeTags.size > 0) {
      list = list.filter((a) => a.tags.some((t) => activeTags.has(t)))
    }
    return list
  }, [articles, search, activeTags])

  function readTime(content: string): number {
    return Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200))
  }

  function stripMarkdown(text: string): string {
    return text.replace(/[#*`\[\]>_~]/g, '').replace(/\(http[^)]*\)/g, '')
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-2 fade-in-up" style={{ color: '#F0F0F7' }}>
          Blog
        </h1>
        <p className="text-sm mb-6 fade-in-up" style={{ color: '#9090B0' }}>
          Articles on data analytics, economics, and classroom learning.
        </p>

        {/* Search */}
        <div className="mb-4 fade-in-up">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="glass-input w-full px-4 py-2.5 text-sm"
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6 fade-in-up">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                  activeTags.has(tag) ? 'badge-glow' : 'badge-muted'
                }`}
              >
                {tag}
              </button>
            ))}
            {activeTags.size > 0 && (
              <button
                onClick={() => setActiveTags(new Set())}
                className="text-xs px-2 py-1 transition-colors hover:text-[#F0F0F7]"
                style={{ color: '#9090B0' }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Article list */}
        {filtered.length === 0 ? (
          <div className="glass p-8 text-center fade-in-up">
            <p className="text-sm" style={{ color: '#9090B0' }}>
              {articles.length === 0
                ? 'No articles published yet.'
                : 'No articles match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="glass p-5 cursor-pointer hover:border-[rgba(232,68,122,0.2)] transition-all fade-in-up"
                onClick={() => navigate(`/blog/${a.slug}`)}
              >
                <h2 className="text-base font-semibold mb-1" style={{ color: '#F0F0F7' }}>
                  {a.title}
                </h2>
                <div className="flex items-center gap-2 text-xs mb-2" style={{ color: '#9090B0' }}>
                  {a.author_name && (
                    <>
                      <span style={{ color: '#F0F0F7' }}>{a.author_name}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{new Date(a.published_at).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{readTime(a.content)} min read</span>
                  {(viewCounts[`/blog/${a.slug}`] ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span>{viewCounts[`/blog/${a.slug}`]} view{viewCounts[`/blog/${a.slug}`] !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
                {a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {a.tags.map((tag, i) => (
                      <span key={i} className="badge-muted text-[10px] px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-sm line-clamp-3" style={{ color: '#9090B0' }}>
                  {stripMarkdown(a.content).slice(0, 200)}…
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
