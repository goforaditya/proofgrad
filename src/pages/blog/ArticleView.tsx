import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import AppShell from '@/components/layout/AppShell'
import { fetchArticleById } from '@/hooks/useArticles'
import type { Article } from '@/types'

export default function ArticleView() {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!articleId) return
    const { article: a } = await fetchArticleById(articleId)
    setArticle(a)
    setLoading(false)
  }, [articleId])

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

  if (!article) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p style={{ color: '#9090B0' }}>Article not found.</p>
          <button
            onClick={() => navigate('/blog')}
            className="mt-4 text-sm underline"
            style={{ color: '#E8447A' }}
          >
            Back to blog
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/blog')}
          className="text-xs mb-4 inline-block"
          style={{ color: '#9090B0' }}
        >
          ← Back to blog
        </button>

        <article className="fade-in-up">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
            {article.title}
          </h1>
          <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
            {new Date(article.published_at).toLocaleDateString()}
          </p>

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {article.tags.map((tag, i) => (
                <span key={i} className="badge-glow text-xs px-2 py-0.5">{tag}</span>
              ))}
            </div>
          )}

          <div
            className="prose prose-invert prose-sm max-w-none"
            style={{ color: '#F0F0F7' }}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3" style={{ color: '#F0F0F7' }}>{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2" style={{ color: '#F0F0F7' }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: '#F0F0F7' }}>{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-relaxed mb-3" style={{ color: '#9090B0' }}>{children}</p>,
                strong: ({ children }) => <strong style={{ color: '#F0F0F7' }}>{children}</strong>,
                em: ({ children }) => <em style={{ color: '#FF9EC8' }}>{children}</em>,
                code: ({ children }) => (
                  <code
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(232, 68, 122, 0.1)', color: '#FF9EC8' }}
                  >
                    {children}
                  </code>
                ),
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1" style={{ color: '#9090B0' }}>{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1" style={{ color: '#9090B0' }}>{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-2 pl-4 my-3 italic"
                    style={{ borderColor: '#E8447A', color: '#9090B0' }}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </AppShell>
  )
}
