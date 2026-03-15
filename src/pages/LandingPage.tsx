import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { fetchArticles } from '@/hooks/useArticles'
import type { Article } from '@/types'

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchArticles().then(setArticles)
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
              onClick={() => navigate(user ? dashboardPath : '/auth/signup')}
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

      {/* Footer */}
      <footer className="border-t px-4 sm:px-6 py-6" style={{ borderColor: '#2E2E45' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="glow-text text-sm font-bold">Proofgrad</span>
          <div className="flex gap-6 text-xs" style={{ color: '#9090B0' }}>
            <Link to="/blog" className="hover:text-[#F0F0F7] transition-colors">Blog</Link>
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
