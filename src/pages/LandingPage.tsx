import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { fetchArticles } from '@/hooks/useArticles'
import { fetchResourceLinks, fetchReactionsForLinks } from '@/hooks/useResources'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/telemetry'
import type { Article, ResourceLink, LinkReaction } from '@/types'

const NICHE_COLORS: Record<string, { bg: string; text: string; activeBg: string }> = {}
const COLOR_PALETTE = [
  { bg: 'rgba(232, 68, 122, 0.12)', text: '#FF6BA8', activeBg: 'linear-gradient(135deg, #E8447A, #C42E60)' },
  { bg: 'rgba(99, 91, 255, 0.12)', text: '#A5B4FC', activeBg: 'linear-gradient(135deg, #635BFF, #4F46E5)' },
  { bg: 'rgba(52, 211, 153, 0.12)', text: '#6EE7B7', activeBg: 'linear-gradient(135deg, #10B981, #059669)' },
  { bg: 'rgba(251, 191, 36, 0.12)', text: '#FCD34D', activeBg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { bg: 'rgba(96, 165, 250, 0.12)', text: '#93C5FD', activeBg: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
  { bg: 'rgba(244, 114, 182, 0.12)', text: '#F9A8D4', activeBg: 'linear-gradient(135deg, #EC4899, #DB2777)' },
  { bg: 'rgba(167, 139, 250, 0.12)', text: '#C4B5FD', activeBg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
]

function getNicheColor(niche: string) {
  if (!NICHE_COLORS[niche]) {
    const idx = Object.keys(NICHE_COLORS).length % COLOR_PALETTE.length
    NICHE_COLORS[niche] = COLOR_PALETTE[idx]
  }
  return NICHE_COLORS[niche]
}

async function fetchCommentCounts(linkIds: string[]): Promise<Record<string, number>> {
  if (linkIds.length === 0) return {}
  const { data } = await supabase
    .from('link_comments')
    .select('link_id')
    .in('link_id', linkIds)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.link_id] = (counts[row.link_id] || 0) + 1
  }
  return counts
}

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [resources, setResources] = useState<ResourceLink[]>([])
  const [reactions, setReactions] = useState<Record<string, LinkReaction[]>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [activeNiche, setActiveNiche] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles().then(setArticles)
    fetchResourceLinks().then(async (links) => {
      setResources(links)
      const ids = links.map((l) => l.id)
      const [allReactions, counts] = await Promise.all([
        fetchReactionsForLinks(ids),
        fetchCommentCounts(ids),
      ])
      const grouped: Record<string, LinkReaction[]> = {}
      for (const r of allReactions) {
        if (!grouped[r.link_id]) grouped[r.link_id] = []
        grouped[r.link_id].push(r)
      }
      setReactions(grouped)
      setCommentCounts(counts)
    })
  }, [])

  const dashboardPath =
    user?.role === 'instructor' ? '/instructor/dashboard' : '/'

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles.slice(0, 8)
    const q = search.toLowerCase()
    return articles
      .filter((a) => a.title.toLowerCase().includes(q) || a.author_name?.toLowerCase().includes(q))
      .slice(0, 8)
  }, [articles, search])

  function readTime(content: string) {
    return Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200))
  }

  const resourceNiches = useMemo(() => [...new Set(resources.map((r) => r.niche))], [resources])

  const filteredResources = useMemo(() => {
    const list = activeNiche ? resources.filter((r) => r.niche === activeNiche) : resources
    // Non-signed-in or non-profile-completed users see only first 2
    const isUnlocked = user?.profile_completed
    return { visible: isUnlocked ? list : list.slice(0, 2), hiddenCount: isUnlocked ? 0 : Math.max(0, list.length - 2) }
  }, [resources, activeNiche, user])

  return (
    <div className="liquid-bg min-h-screen">
      <div className="liquid-orb-3" />

      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="glow-text text-lg font-bold tracking-tight">
          Proofgrad
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/blog"
            className="text-sm transition-colors hover:text-[#F0F0F7]"
            style={{ color: '#9090B0' }}
          >
            Blog
          </Link>
          <Link
            to="/resources"
            className="text-sm transition-colors hover:text-[#F0F0F7]"
            style={{ color: '#9090B0' }}
          >
            Resources
          </Link>
          {user ? (
            <button
              onClick={() => navigate(dashboardPath)}
              className="btn-liquid px-4 py-1.5 text-sm"
            >
              Dashboard
            </button>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="text-sm transition-colors hover:text-[#F0F0F7]"
                style={{ color: '#9090B0' }}
              >
                Sign in
              </Link>
              <Link to="/auth/signup" className="btn-liquid px-4 py-1.5 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero — compact */}
      <section className="relative px-4 sm:px-6 pt-14 pb-10 text-center max-w-4xl mx-auto fade-in-up">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
          <span className="glow-text-lg">Proofgrad</span>
        </h1>
        <p
          className="text-base sm:text-lg max-w-xl mx-auto mb-6 leading-relaxed"
          style={{ color: '#9090B0' }}
        >
          AI-powered data collection & analysis
        </p>
        {/* {user ? (
          <button
            onClick={() => navigate(dashboardPath)}
            className="btn-liquid px-7 py-2.5 text-sm font-semibold"
          >
            Go to Dashboard →
          </button>
        ) : (
          <Link
            to="/auth/signup"
            className="btn-liquid px-7 py-2.5 text-sm font-semibold inline-block"
          >
            Get Started — Free →
          </Link>
        )} */}
      </section>

      {/* Main hub grid */}
      <section className="px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Apps */}
          <div className="space-y-5">
            <div className="section-label mb-4">Apps</div>

            {/* Featured app card */}
            <div
              className="glass-card-featured p-6 cursor-pointer"
              onClick={() => navigate(user?.role === 'instructor' ? dashboardPath : '/join')}
            >
              <div className="relative z-[1]">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'rgba(99, 91, 255, 0.15)' }}
                  >
                    📊
                  </div>
                  <div>
                    <h3 className="text-base font-bold" style={{ color: '#F0F0F7' }}>
                      Interactive Survey & Analysis
                    </h3>
                    <p className="text-xs" style={{ color: '#9090B0' }}>
                      Live data collection and visualization
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4" style={{ color: '#9090B0' }}>
                  Run live surveys, build anonymized datasets, and explore data through
                  interactive charts with AI-powered interpretations.
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="feature-pill">📡 Live Surveys</span>
                  <span className="feature-pill">🤖 AI Charts</span>
                  <span className="feature-pill">📈 Real-time Data</span>
                  <span className="feature-pill">📄 PDF Export</span>
                  <span className="feature-pill">💰 CPI Builder</span>
                </div>

                <button className="btn-liquid px-5 py-2 text-sm">
                  Launch →
                </button>
              </div>
            </div>

            {/* Coming soon card */}
            <div className="glass-card-muted p-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(100, 80, 200, 0.1)' }}
                >
                  🔧
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: '#F0F0F7' }}>
                    Dashboard Builder
                  </h3>
                  <span className="badge-muted text-[10px]">Coming Soon</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#9090B0' }}>
                Build custom analytics dashboards from any dataset. Drag-and-drop charts,
                filters, and KPI cards — share with your team or export as reports.
              </p>
            </div>
          </div>

          {/* Right: Blog sidebar */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="section-label">Blog</div>
              <Link
                to="/blog"
                className="text-xs transition-colors hover:text-[#818CF8]"
                style={{ color: '#635BFF' }}
              >
                View all →
              </Link>
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="glass-input w-full px-3 py-2 text-xs mb-4"
            />

            {/* Article list */}
            {filteredArticles.length === 0 ? (
              <div className="glass-card-muted p-6 text-center">
                <p className="text-xs" style={{ color: '#9090B0' }}>
                  {articles.length === 0 ? 'No articles yet.' : 'No matches.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((a) => (
                  <Link
                    key={a.id}
                    to={`/blog/${a.slug}`}
                    className="glass-card p-4 block fade-in-up"
                  >
                    <h4 className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: '#F0F0F7' }}>
                      {a.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] mb-1.5" style={{ color: '#9090B0' }}>
                      {a.author_name && <span>{a.author_name}</span>}
                      <span>·</span>
                      <span>{new Date(a.published_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{readTime(a.content)}m read</span>
                    </div>
                    {a.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {a.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="badge-muted text-[9px] px-1.5 py-0.5">{tag}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Resources section — full width, HN/Lobsters style */}
      {resources.length > 0 && (
        <section className="px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="section-label">Resources</div>
            <Link
              to="/resources"
              className="text-xs transition-colors hover:text-[#818CF8]"
              style={{ color: '#635BFF' }}
            >
              View all →
            </Link>
          </div>

          {/* Colourful niche filter pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4 fade-in-up">
            <button
              onClick={() => setActiveNiche(null)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: !activeNiche ? 'rgba(99, 91, 255, 0.2)' : 'transparent',
                color: !activeNiche ? '#A5B4FC' : '#9090B0',
                border: !activeNiche ? '1px solid rgba(99, 91, 255, 0.3)' : '1px solid transparent',
              }}
            >
              all
            </button>
            {resourceNiches.map((niche) => {
              const c = getNicheColor(niche)
              const isActive = activeNiche === niche
              return (
                <button
                  key={niche}
                  onClick={() => setActiveNiche(isActive ? null : niche)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: isActive ? c.bg : 'transparent',
                    color: isActive ? c.text : '#9090B0',
                    border: isActive ? `1px solid ${c.text}33` : '1px solid transparent',
                  }}
                >
                  {niche.toLowerCase()}
                </button>
              )
            })}
          </div>

          {/* Resource list — numbered, compact rows */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(46, 46, 69, 0.6)', background: 'rgba(26, 26, 38, 0.5)' }}
          >
            {filteredResources.visible.map((link, idx) => {
              const c = getNicheColor(link.niche)
              const linkReactions = reactions[link.id] ?? []
              const smileCount = linkReactions.filter((r) => r.emoji === 'smile').length
              const upvoteCount = linkReactions.filter((r) => r.emoji === 'upvote').length
              const poopCount = linkReactions.filter((r) => r.emoji === 'poop').length
              const cCount = commentCounts[link.id] ?? 0
              const domain = (() => { try { return new URL(link.url).hostname.replace('www.', '') } catch { return '' } })()

              return (
                <div
                  key={link.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[rgba(99,91,255,0.04)]"
                  style={{ borderBottom: '1px solid rgba(46, 46, 69, 0.5)' }}
                >
                  {/* Row number */}
                  <span
                    className="text-xs font-mono pt-0.5 w-5 text-right flex-shrink-0"
                    style={{ color: '#9090B0' }}
                  >
                    {idx + 1}.
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title + domain */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#F0F0F7' }}
                        onClick={() => track('resource_click', { link_id: link.id, niche: link.niche })}
                      >
                        {link.title}
                      </a>
                      {domain && (
                        <span className="text-[10px]" style={{ color: '#9090B0' }}>
                          ({domain})
                        </span>
                      )}
                    </div>

                    {/* Meta row: tag, reactions, comments */}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {link.niche}
                      </span>

                      {(upvoteCount > 0 || smileCount > 0 || poopCount > 0) && (
                        <span className="flex items-center gap-2 text-[11px]" style={{ color: '#9090B0' }}>
                          {upvoteCount > 0 && <span>👍 {upvoteCount}</span>}
                          {smileCount > 0 && <span>😊 {smileCount}</span>}
                          {poopCount > 0 && <span>💩 {poopCount}</span>}
                        </span>
                      )}

                      <Link
                        to="/resources"
                        className="text-[11px] hover:underline"
                        style={{ color: '#9090B0' }}
                      >
                        💬 {cCount} comment{cCount !== 1 ? 's' : ''}
                      </Link>

                      {link.description && (
                        <span className="text-[10px] hidden sm:inline" style={{ color: '#6B6B8A' }}>
                          — {link.description.length > 80 ? link.description.slice(0, 80) + '…' : link.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Gate row */}
            {filteredResources.hiddenCount > 0 && (
              <div
                className="px-4 py-4 text-center"
                style={{ background: 'rgba(99, 91, 255, 0.03)' }}
              >
                <p className="text-xs mb-2" style={{ color: '#9090B0' }}>
                  🔒 {filteredResources.hiddenCount} more resource{filteredResources.hiddenCount > 1 ? 's' : ''} — {user ? 'complete your profile' : 'sign in'} to unlock.
                </p>
                <Link
                  to={user ? '/auth/complete-profile' : '/auth/login'}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#A5B4FC' }}
                >
                  {user ? 'Complete profile →' : 'Sign in to unlock →'}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t px-4 sm:px-6 py-6" style={{ borderColor: '#2E2E45' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="glow-text text-sm font-bold">Proofgrad</span>
          <div className="flex gap-6 text-xs" style={{ color: '#9090B0' }}>
            <Link to="/blog" className="hover:text-[#F0F0F7] transition-colors">Blog</Link>
            <Link to="/resources" className="hover:text-[#F0F0F7] transition-colors">Resources</Link>
            <Link to="/auth/login" className="hover:text-[#F0F0F7] transition-colors">Sign in</Link>
            <Link to="/auth/signup" className="hover:text-[#F0F0F7] transition-colors">Sign up</Link>
          </div>
          <span className="text-[10px]" style={{ color: '#9090B0' }}>
            © {new Date().getFullYear()} Proofgrad
          </span>
        </div>
      </footer>
    </div>
  )
}
