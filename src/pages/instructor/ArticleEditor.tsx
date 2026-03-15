import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import MarkdownRenderer from '@/components/blog/MarkdownRenderer'
import MarkdownToolbar from '@/components/blog/MarkdownToolbar'
import { useAuth } from '@/lib/auth'
import { createArticle, updateArticle, fetchMyArticles, deleteArticle } from '@/hooks/useArticles'
import type { Article } from '@/types'

export default function ArticleEditor() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const pinnedSessionId = searchParams.get('session') ?? undefined

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  // Editor state
  const [showEditor, setShowEditor] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  const loadArticles = useCallback(async () => {
    if (!user) return
    const list = await fetchMyArticles(user.id)
    setArticles(list)
    setLoading(false)
  }, [user])

  useEffect(() => { loadArticles() }, [loadArticles])

  function resetEditor() {
    setTitle('')
    setContent('')
    setTags('')
    setEditingId(null)
    setShowEditor(false)
  }

  function startEdit(a: Article) {
    setEditingId(a.id)
    setTitle(a.title)
    setContent(a.content)
    setTags(a.tags.join(', '))
    setShowEditor(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !title.trim() || !content.trim()) return

    setSaving(true)
    const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []

    if (editingId) {
      // Update existing article
      const { error } = await updateArticle(editingId, {
        title,
        content,
        tags: tagList,
        pinned_session_id: pinnedSessionId ?? null,
      })
      if (error) {
        console.error(error)
      } else {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? { ...a, title, content, tags: tagList, pinned_session_id: pinnedSessionId ?? null }
              : a
          )
        )
        resetEditor()
      }
    } else {
      // Create new article
      const { article, error } = await createArticle(user.id, title, content, tagList, pinnedSessionId)
      if (error) {
        console.error(error)
      } else if (article) {
        setArticles((prev) => [article, ...prev])
        resetEditor()
      }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await deleteArticle(id)
    setArticles((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading) {
    return (
      <AppShell showSidebar>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showSidebar>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6 fade-in-up flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
              Blog Articles
            </h1>
            <p className="text-sm" style={{ color: '#9090B0' }}>
              Write articles in markdown. Pin them to sessions.
            </p>
          </div>
          <button
            onClick={() => {
              if (showEditor) resetEditor()
              else { setEditingId(null); setShowEditor(true) }
            }}
            className="btn-liquid px-4 py-2 text-sm"
          >
            {showEditor ? 'Cancel' : '+ New article'}
          </button>
        </div>

        {/* Editor with live preview */}
        {showEditor && (
          <form onSubmit={handleSubmit} className="glass p-6 mb-6 space-y-4 fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title…"
                  className="glass-input w-full px-4 py-2.5 text-sm mb-3"
                  required
                />
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
                  Tags (comma-separated)
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="economics, demand, supply"
                  className="glass-input w-full px-4 py-2.5 text-sm mb-3"
                />
              </div>
              <div className="hidden lg:block" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: '#9090B0' }}>
                    Content (Markdown)
                  </label>
                  <span className="text-[10px]" style={{ color: '#9090B0' }}>
                    {content.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <MarkdownToolbar
                  textareaRef={textareaRef}
                  content={content}
                  onChange={setContent}
                />
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article in markdown…"
                  className="glass-input w-full px-4 py-3 text-sm resize-none font-mono"
                  style={{ height: 420 }}
                  required
                />
              </div>

              {/* Right: Live preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: '#9090B0' }}>
                    Preview
                  </label>
                </div>
                <div
                  className="glass p-5 overflow-y-auto rounded-lg"
                  style={{
                    height: 458, // matches toolbar + textarea height
                    background: 'rgba(13, 13, 18, 0.6)',
                  }}
                >
                  {content.trim() ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-sm italic" style={{ color: '#9090B0' }}>
                      Start writing to see the preview…
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-liquid px-6 py-2.5"
            >
              {saving
                ? (editingId ? 'Updating…' : 'Publishing…')
                : (editingId ? 'Update article' : 'Publish article')}
            </button>
          </form>
        )}

        {/* Articles list */}
        {articles.length === 0 && !showEditor ? (
          <div className="glass p-8 text-center fade-in-up">
            <div className="text-3xl mb-3">📝</div>
            <p className="text-sm" style={{ color: '#9090B0' }}>
              No articles yet. Click "+ New article" to write one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((a) => (
              <div key={a.id} className="glass p-5 fade-in-up">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3
                      className="text-base font-semibold cursor-pointer hover:underline"
                      style={{ color: '#F0F0F7' }}
                      onClick={() => navigate(`/blog/${a.id}`)}
                    >
                      {a.title}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: '#9090B0' }}>
                      {new Date(a.published_at).toLocaleDateString()}
                      {a.pinned_session_id && ' · 📌 Pinned to session'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(a)}
                      className="text-xs px-2 py-1 rounded transition-colors hover:text-[#635BFF]"
                      style={{ color: '#9090B0' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-xs px-2 py-1 rounded transition-colors hover:text-[#E8447A]"
                      style={{ color: '#9090B0' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.tags.map((tag, i) => (
                      <span key={i} className="badge-muted text-[10px] px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-sm mt-2 line-clamp-2" style={{ color: '#9090B0' }}>
                  {a.content.replace(/[#*`\[\]]/g, '').slice(0, 200)}…
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
