import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { fetchRecentArticles } from '@/hooks/useArticles'
import type { Article } from '@/types'

const features = [
  {
    icon: '📊',
    title: 'Live Surveys & Data',
    description:
      'Run live surveys during lectures. Students respond in real time, building an anonymized class dataset for hands-on analysis.',
  },
  {
    icon: '📈',
    title: 'Interactive Analysis',
    description:
      'Build histograms, scatter plots, demand curves, and more — all from real class data. AI-powered chart interpretations guide learning.',
  },
  {
    icon: '📝',
    title: 'Blog & Resources',
    description:
      'Instructors publish data analytics articles. Students read, discuss, and build a portfolio of their work exportable as PDF.',
  },
]

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    fetchRecentArticles(3).then(setArticles)
  }, [])

  const dashboardPath =
    user?.role === 'instructor'
      ? '/instructor/dashboard'
      : '/student/join'

  return (
    <div className="liquid-bg min-h-screen">
      <div className="liquid-orb-3" />

      {/* Nav */}
      <nav
        className="glass-nav sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between"
      >
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

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-20 pb-24 text-center max-w-4xl mx-auto fade-in-up">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
          style={{ color: '#F0F0F7' }}
        >
          The Interactive{' '}
          <span className="glow-text">Economics Lab</span>
          <br />
          for Your Classroom
        </h1>
        <p
          className="text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{ color: '#9090B0' }}
        >
          Run live surveys, build real datasets, and let students discover economics through
          hands-on data analysis — all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <button
              onClick={() => navigate(dashboardPath)}
              className="btn-liquid px-8 py-3 text-base font-semibold"
            >
              Go to Dashboard →
            </button>
          ) : (
            <Link
              to="/auth/signup"
              className="btn-liquid px-8 py-3 text-base font-semibold inline-block"
            >
              Get Started — Free →
            </Link>
          )}
          <Link
            to="/blog"
            className="btn-ghost px-8 py-3 text-base font-semibold inline-block"
          >
            Explore Blog
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass p-6 fade-in-up">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2" style={{ color: '#F0F0F7' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9090B0' }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent articles */}
      {articles.length > 0 && (
        <section className="px-4 sm:px-6 pb-20 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ color: '#F0F0F7' }}>
              Latest from the Blog
            </h2>
            <Link
              to="/blog"
              className="text-sm transition-colors hover:text-[#FF6BA8]"
              style={{ color: '#E8447A' }}
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {articles.map((a) => (
              <Link
                key={a.id}
                to={`/blog/${a.id}`}
                className="glass p-5 transition-all hover:scale-[1.02] hover:border-[#E8447A]/40 block fade-in-up"
              >
                <h3 className="text-sm font-semibold mb-2 line-clamp-2" style={{ color: '#F0F0F7' }}>
                  {a.title}
                </h3>
                <p className="text-xs mb-3 line-clamp-3" style={{ color: '#9090B0' }}>
                  {a.content.replace(/[#*`\[\]]/g, '').slice(0, 120)}…
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#9090B0' }}>
                  {a.author_name && <span>{a.author_name}</span>}
                  <span>·</span>
                  <span>{new Date(a.published_at).toLocaleDateString()}</span>
                </div>
                {a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="badge-muted text-[10px] px-1.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t px-4 sm:px-6 py-8" style={{ borderColor: '#2E2E45' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="glow-text text-sm font-bold">Proofgrad</span>
          <div className="flex gap-6 text-sm" style={{ color: '#9090B0' }}>
            <Link to="/blog" className="hover:text-[#F0F0F7] transition-colors">Blog</Link>
            <Link to="/auth/login" className="hover:text-[#F0F0F7] transition-colors">Sign in</Link>
            <Link to="/auth/signup" className="hover:text-[#F0F0F7] transition-colors">Sign up</Link>
          </div>
          <span className="text-xs" style={{ color: '#9090B0' }}>
            © {new Date().getFullYear()} Proofgrad
          </span>
        </div>
      </footer>
    </div>
  )
}
