import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { fetchArticles } from '@/hooks/useArticles'
import type { Article } from '@/types'

export default function ArticleFeed() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const list = await fetchArticles()
    setArticles(list)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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
        <h1 className="text-xl font-bold mb-6 fade-in-up" style={{ color: '#F0F0F7' }}>
          Blog
        </h1>

        {articles.length === 0 ? (
          <div className="glass p-8 text-center fade-in-up">
            <p className="text-sm" style={{ color: '#9090B0' }}>
              No articles published yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((a) => (
              <div
                key={a.id}
                className="glass p-5 cursor-pointer hover:border-[rgba(232,68,122,0.2)] transition-all fade-in-up"
                onClick={() => navigate(`/blog/${a.id}`)}
              >
                <h2 className="text-base font-semibold mb-1" style={{ color: '#F0F0F7' }}>
                  {a.title}
                </h2>
                <p className="text-xs mb-2" style={{ color: '#9090B0' }}>
                  {new Date(a.published_at).toLocaleDateString()}
                </p>
                {a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {a.tags.map((tag, i) => (
                      <span key={i} className="badge-muted text-[10px] px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-sm line-clamp-3" style={{ color: '#9090B0' }}>
                  {a.content.slice(0, 250)}…
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
