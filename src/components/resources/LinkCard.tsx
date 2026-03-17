import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { toggleReaction, fetchLinkComments, createLinkComment, deleteLinkComment } from '@/hooks/useResources'
import { track } from '@/lib/telemetry'
import type { ResourceLink, LinkReaction, LinkComment, ReactionEmoji } from '@/types'

const EMOJIS: { emoji: ReactionEmoji; icon: string }[] = [
  { emoji: 'smile', icon: '😊' },
  { emoji: 'upvote', icon: '👍' },
  { emoji: 'poop', icon: '💩' },
]

interface Props {
  link: ResourceLink
  reactions: LinkReaction[]
  profileCompleted: boolean
  onReactionsChange: (linkId: string, reactions: LinkReaction[]) => void
}

export default function LinkCard({ link, reactions, profileCompleted, onReactionsChange }: Props) {
  const { user } = useAuth()

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<LinkComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Count reactions per emoji
  function getCount(emoji: ReactionEmoji) {
    return reactions.filter((r) => r.emoji === emoji).length
  }

  // Check if current user reacted with this emoji
  function hasReacted(emoji: ReactionEmoji) {
    return user ? reactions.some((r) => r.emoji === emoji && r.user_id === user.id) : false
  }

  async function handleReaction(emoji: ReactionEmoji) {
    if (!user || !profileCompleted) return
    const { added, error } = await toggleReaction(link.id, user.id, emoji)
    if (error) return

    let updated: LinkReaction[]
    if (added) {
      track('reaction', { link_id: link.id, emoji })
      updated = [...reactions, { id: crypto.randomUUID(), link_id: link.id, user_id: user.id, emoji, created_at: new Date().toISOString() }]
    } else {
      updated = reactions.filter((r) => !(r.emoji === emoji && r.user_id === user.id))
    }
    onReactionsChange(link.id, updated)
  }

  async function handleToggleComments() {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      const c = await fetchLinkComments(link.id)
      setComments(c)
      setLoadingComments(false)
    }
    setShowComments((v) => !v)
  }

  async function handleAddComment() {
    if (!user || !newComment.trim() || submitting) return
    setSubmitting(true)
    const { comment, error } = await createLinkComment(link.id, user.id, newComment.trim())
    if (!error && comment) {
      setComments((c) => [...c, comment])
      setNewComment('')
    }
    setSubmitting(false)
  }

  async function handleDeleteComment(commentId: string) {
    const { error } = await deleteLinkComment(commentId)
    if (!error) {
      setComments((c) => c.filter((cc) => cc.id !== commentId))
    }
  }

  return (
    <div className="glass p-4 fade-in-up">
      {/* Link header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold hover:underline"
            style={{ color: '#A5B4FC' }}
          >
            {link.title} ↗
          </a>
          {link.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9090B0' }}>
              {link.description}
            </p>
          )}
        </div>
        <span className="badge-muted text-[10px] px-2 py-0.5 flex-shrink-0">
          {link.niche}
        </span>
      </div>

      {/* Reactions + comments toggle */}
      {profileCompleted && (
        <div className="flex items-center gap-2 mt-3">
          {EMOJIS.map(({ emoji, icon }) => {
            const count = getCount(emoji)
            const active = hasReacted(emoji)
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: active ? 'rgba(99, 91, 255, 0.15)' : 'rgba(46, 46, 69, 0.4)',
                  border: active ? '1px solid rgba(99, 91, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  color: active ? '#A5B4FC' : '#9090B0',
                }}
              >
                <span>{icon}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}

          <button
            onClick={handleToggleComments}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ml-auto"
            style={{
              background: 'rgba(46, 46, 69, 0.4)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: '#9090B0',
            }}
          >
            💬 {comments.length > 0 ? comments.length : ''}
          </button>
        </div>
      )}

      {/* Comments section */}
      {showComments && profileCompleted && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {loadingComments ? (
            <div className="flex justify-center py-2">
              <div className="liquid-spinner" style={{ width: 16, height: 16 }} />
            </div>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-xs text-center py-2" style={{ color: '#9090B0' }}>
                  No comments yet
                </p>
              )}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium" style={{ color: '#F0F0F7' }}>
                          {c.user_name}
                        </span>
                        {c.user_role === 'instructor' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99, 91, 255, 0.2)', color: '#A5B4FC' }}>
                            Instructor
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: '#9090B0' }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#9090B0' }}>
                        {c.content}
                      </p>
                    </div>
                    {user && c.user_id === user.id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-[10px] flex-shrink-0 opacity-50 hover:opacity-100"
                        style={{ color: '#9090B0' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add comment */}
              {user && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Add a comment…"
                    className="glass-input flex-1 px-3 py-1.5 text-xs"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                    className="btn-liquid px-3 py-1.5 text-xs"
                  >
                    {submitting ? '…' : 'Post'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
