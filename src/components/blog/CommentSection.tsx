import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { fetchComments, createComment, deleteComment } from '@/hooks/useComments'
import type { Comment } from '@/types'

interface Props {
  articleId: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function CommentSection({ articleId }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    const data = await fetchComments(articleId)
    setComments(data)
    setLoading(false)
  }, [articleId])

  useEffect(() => { load() }, [load])

  async function handlePost() {
    if (!user || !content.trim() || posting) return
    setPosting(true)
    const { comment, error } = await createComment(articleId, user.id, content.trim())
    if (comment && !error) {
      setComments((prev) => [...prev, comment])
      setContent('')
    }
    setPosting(false)
  }

  async function handleDelete(commentId: string) {
    const { error } = await deleteComment(commentId)
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  return (
    <div className="mt-8">
      <div className="border-t mb-6" style={{ borderColor: '#2E2E45' }} />

      <h3 className="text-base font-semibold mb-4" style={{ color: '#F0F0F7' }}>
        Comments {comments.length > 0 && <span className="text-sm font-normal" style={{ color: '#9090B0' }}>({comments.length})</span>}
      </h3>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="liquid-spinner" style={{ width: 20, height: 20 }} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm py-4" style={{ color: '#9090B0' }}>
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="pb-4 border-b" style={{ borderColor: 'rgba(46, 46, 69, 0.5)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #635BFF, #4F46E5)', color: '#fff' }}
                >
                  {(c.user_name ?? 'A').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium" style={{ color: '#F0F0F7' }}>
                  {c.user_name}
                </span>
                {c.user_role === 'instructor' && (
                  <span className="badge-glow text-[10px] px-1.5 py-0.5">Instructor</span>
                )}
                <span className="text-xs" style={{ color: '#9090B0' }}>
                  {timeAgo(c.created_at)}
                </span>
                {user?.id === c.user_id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="ml-auto text-xs transition-colors hover:text-[#818CF8]"
                    style={{ color: '#9090B0' }}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed pl-8" style={{ color: '#9090B0' }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      {user ? (
        <div className="glass p-4 rounded-xl">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts…"
            rows={3}
            className="glass-input w-full px-4 py-2.5 text-sm resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              onClick={handlePost}
              disabled={posting || !content.trim()}
              className="btn-liquid px-5 py-2 text-sm"
            >
              {posting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass p-4 rounded-xl text-center">
          <p className="text-sm mb-2" style={{ color: '#9090B0' }}>
            Sign in to join the discussion.
          </p>
          <Link
            to="/auth/login"
            className="text-sm font-medium underline transition-colors hover:text-[#818CF8]"
            style={{ color: '#635BFF' }}
          >
            Sign in →
          </Link>
        </div>
      )}
    </div>
  )
}
