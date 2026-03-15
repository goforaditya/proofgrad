import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export default function Navbar() {
  const { user, signOut, guestState } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/auth/login')
  }

  const displayName = user?.name ?? guestState?.nickname ?? null

  return (
    <header className="glass-nav sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 h-14">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <span className="glow-text text-xl font-bold tracking-tight">
          Proofgrad
        </span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-4">
        <Link
          to="/blog"
          className="text-sm transition-colors hover:text-[#F0F0F7]"
          style={{ color: '#9090B0' }}
        >
          Blog
        </Link>
        {user?.role === 'instructor' && (
          <Link
            to="/instructor/dashboard"
            className="text-sm transition-colors hover:text-[#F0F0F7]"
            style={{ color: '#9090B0' }}
          >
            Dashboard
          </Link>
        )}

        {displayName ? (
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: '#F0F0F7' }}>
              {displayName}
              {guestState && (
                <span className="badge-muted ml-1.5">
                  guest
                </span>
              )}
            </span>
            {user && (
              <button
                onClick={handleSignOut}
                className="btn-ghost text-sm px-3 py-1.5"
              >
                Sign out
              </button>
            )}
          </div>
        ) : (
          <Link
            to="/auth/login"
            className="btn-liquid text-sm px-4 py-1.5"
          >
            Sign in
          </Link>
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 rounded-lg"
        style={{ color: '#9090B0' }}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          {menuOpen ? (
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass-strong absolute top-14 left-2 right-2 md:hidden px-4 py-4 flex flex-col gap-3 rounded-xl mt-2">
          <Link
            to="/blog"
            className="text-sm py-2"
            style={{ color: '#9090B0' }}
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </Link>
          {user?.role === 'instructor' && (
            <Link
              to="/instructor/dashboard"
              className="text-sm py-2"
              style={{ color: '#9090B0' }}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {displayName ? (
            <>
              <span className="text-sm" style={{ color: '#F0F0F7' }}>{displayName}</span>
              {user && (
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="text-sm py-2 text-left"
                  style={{ color: '#E8447A' }}
                >
                  Sign out
                </button>
              )}
            </>
          ) : (
            <Link
              to="/auth/login"
              className="text-sm font-medium"
              style={{ color: '#E8447A' }}
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
