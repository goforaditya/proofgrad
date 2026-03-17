import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import MarkdownRenderer from '@/components/blog/MarkdownRenderer'
import CommentSection from '@/components/blog/CommentSection'
import { fetchArticleBySlug } from '@/hooks/useArticles'
import type { Article } from '@/types'

function setMetaTag(property: string, content: string) {
  const attr = property.startsWith('og:') || property.startsWith('article:') ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function ArticleView() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!slug) return
    const { article: a } = await fetchArticleBySlug(slug)
    setArticle(a)
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  // Set page title and meta tags for sharing
  useEffect(() => {
    if (!article) return
    const prevTitle = document.title
    const excerpt = article.content.replace(/[#*_\[\]()]/g, '').slice(0, 160).trim()

    document.title = `${article.title} — Proofgrad`
    setMetaTag('og:title', article.title)
    setMetaTag('og:description', excerpt)
    setMetaTag('og:type', 'article')
    setMetaTag('og:url', window.location.href)
    setMetaTag('twitter:title', article.title)
    setMetaTag('twitter:description', excerpt)
    setMetaTag('twitter:card', 'summary_large_image')
    const bannerImage = article.banner_url
      || `${window.location.origin}/api/og?title=${encodeURIComponent(article.title)}${article.author_name ? `&author=${encodeURIComponent(article.author_name)}` : ''}${article.tags.length ? `&tag=${encodeURIComponent(article.tags[0])}` : ''}`
    setMetaTag('og:image', bannerImage)
    setMetaTag('twitter:image', bannerImage)
    if (article.author_name) {
      setMetaTag('article:author', article.author_name)
    }

    return () => { document.title = prevTitle }
  }, [article])

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: article?.title, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

  if (!article) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p style={{ color: '#9090B0' }}>Article not found.</p>
          <button
            onClick={() => navigate('/blog')}
            className="mt-4 text-sm underline"
            style={{ color: '#635BFF' }}
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
          {/* Hero banner */}
          <div className="rounded-lg overflow-hidden mb-5" style={{ aspectRatio: '1200/630' }}>
            <img
              src={
                article.banner_url
                || `/api/og?title=${encodeURIComponent(article.title)}${article.author_name ? `&author=${encodeURIComponent(article.author_name)}` : ''}${article.tags.length ? `&tag=${encodeURIComponent(article.tags[0])}` : ''}`
              }
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
            {article.title}
          </h1>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#9090B0' }}>
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
            <button
              onClick={handleShare}
              className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
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
        {slug && <CommentSection articleId={article.id} />}
      </div>
    </AppShell>
  )
}
