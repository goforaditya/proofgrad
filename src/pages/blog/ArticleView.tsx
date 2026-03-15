import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import MarkdownRenderer from '@/components/blog/MarkdownRenderer'
import CommentSection from '@/components/blog/CommentSection'
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

  const readTime = Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200))

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
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: '#9090B0' }}>
            {article.author_name && (
              <>
                <span style={{ color: '#F0F0F7' }}>{article.author_name}</span>
                <span>·</span>
              </>
            )}
            <span>{new Date(article.published_at).toLocaleDateString()}</span>
            <span>·</span>
            <span>{readTime} min read</span>
          </div>

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {article.tags.map((tag, i) => (
                <span key={i} className="badge-glow text-xs px-2 py-0.5">{tag}</span>
              ))}
            </div>
          )}

          <MarkdownRenderer content={article.content} />
        </article>

        {/* Comments */}
        {articleId && <CommentSection articleId={articleId} />}
      </div>
    </AppShell>
  )
}
