import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { fetchArticles } from '@/hooks/useArticles'
import { fetchResourceLinks } from '@/hooks/useResources'
import type { Article, ResourceLink } from '@/types'

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

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [resources, setResources] = useState<ResourceLink[]>([])
  const [activeNiche, setActiveNiche] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles().then(setArticles)
    fetchResourceLinks().then(setResources)
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

      {/* Resources section */}
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
          {resourceNiches.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-5 fade-in-up">
              <button
                onClick={() => setActiveNiche(null)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: !activeNiche ? 'linear-gradient(135deg, #635BFF, #4F46E5)' : 'rgba(46, 46, 69, 0.5)',
                  color: !activeNiche ? '#fff' : '#9090B0',
                  border: !activeNiche ? 'none' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                All
              </button>
              {resourceNiches.map((niche) => {
                const c = getNicheColor(niche)
                const isActive = activeNiche === niche
                return (
                  <button
                    key={niche}
                    onClick={() => setActiveNiche(isActive ? null : niche)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: isActive ? c.activeBg : c.bg,
                      color: isActive ? '#fff' : c.text,
                      border: isActive ? 'none' : `1px solid ${c.text}22`,
                    }}
                  >
                    {niche}
                  </button>
                )
              })}
            </div>
          )}

          {/* Resource link cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredResources.visible.map((link) => {
              const c = getNicheColor(link.niche)
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-4 block fade-in-up hover:border-[rgba(99,91,255,0.2)] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold line-clamp-1" style={{ color: '#A5B4FC' }}>
                      {link.title} ↗
                    </h4>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: c.bg, color: c.text }}
                    >
                      {link.niche}
                    </span>
                  </div>
                  {link.description && (
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: '#9090B0' }}>
                      {link.description}
                    </p>
                  )}
                </a>
              )
            })}
          </div>

          {/* Gate CTA */}
          {filteredResources.hiddenCount > 0 && (
            <div
              className="glass-strong p-5 mt-4 text-center fade-in-up"
              style={{ border: '1px solid rgba(99, 91, 255, 0.15)' }}
            >
              <p className="text-sm mb-3" style={{ color: '#9090B0' }}>
                🔒 {filteredResources.hiddenCount} more resource{filteredResources.hiddenCount > 1 ? 's' : ''} — {user ? 'complete your profile' : 'sign in'} to unlock all.
              </p>
              <Link
                to={user ? '/auth/complete-profile' : '/auth/login'}
                className="btn-liquid px-5 py-2 text-sm inline-block"
              >
                {user ? 'Complete profile' : 'Sign in to unlock'}
              </Link>
            </div>
          )}
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
