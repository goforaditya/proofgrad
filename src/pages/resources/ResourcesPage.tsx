import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import LinkCard from '@/components/resources/LinkCard'
import { useAuth } from '@/lib/auth'
import { fetchResourceLinks, fetchReactionsForLinks } from '@/hooks/useResources'
import type { ResourceLink, LinkReaction } from '@/types'

const COLOR_PALETTE = [
  { bg: 'rgba(232, 68, 122, 0.12)', text: '#FF6BA8', activeBg: 'linear-gradient(135deg, #E8447A, #C42E60)' },
  { bg: 'rgba(99, 91, 255, 0.12)', text: '#A5B4FC', activeBg: 'linear-gradient(135deg, #635BFF, #4F46E5)' },
  { bg: 'rgba(52, 211, 153, 0.12)', text: '#6EE7B7', activeBg: 'linear-gradient(135deg, #10B981, #059669)' },
  { bg: 'rgba(251, 191, 36, 0.12)', text: '#FCD34D', activeBg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { bg: 'rgba(96, 165, 250, 0.12)', text: '#93C5FD', activeBg: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
  { bg: 'rgba(244, 114, 182, 0.12)', text: '#F9A8D4', activeBg: 'linear-gradient(135deg, #EC4899, #DB2777)' },
  { bg: 'rgba(167, 139, 250, 0.12)', text: '#C4B5FD', activeBg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
]
const nicheColorMap: Record<string, (typeof COLOR_PALETTE)[0]> = {}
function getNicheColor(niche: string) {
  if (!nicheColorMap[niche]) {
    nicheColorMap[niche] = COLOR_PALETTE[Object.keys(nicheColorMap).length % COLOR_PALETTE.length]
  }
  return nicheColorMap[niche]
}

export default function ResourcesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const profileCompleted = user?.profile_completed ?? false

  const [links, setLinks] = useState<ResourceLink[]>([])
  const [reactions, setReactions] = useState<Record<string, LinkReaction[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeNiche, setActiveNiche] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const allLinks = await fetchResourceLinks()
    setLinks(allLinks)

    // Batch-fetch reactions
    const linkIds = allLinks.map((l) => l.id)
    const allReactions = await fetchReactionsForLinks(linkIds)

    // Group reactions by link
    const grouped: Record<string, LinkReaction[]> = {}
    for (const r of allReactions) {
      if (!grouped[r.link_id]) grouped[r.link_id] = []
      grouped[r.link_id].push(r)
    }
    setReactions(grouped)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleReactionsChange(linkId: string, updated: LinkReaction[]) {
    setReactions((prev) => ({ ...prev, [linkId]: updated }))
  }

  // Get unique niches
  const niches = [...new Set(links.map((l) => l.niche))]

  // Filter links by active niche
  const filteredLinks = activeNiche
    ? links.filter((l) => l.niche === activeNiche)
    : links

  // Profile gating: non-completed profiles see only first 2 links
  const visibleLinks = profileCompleted ? filteredLinks : filteredLinks.slice(0, 2)
  const hiddenCount = profileCompleted ? 0 : Math.max(0, filteredLinks.length - 2)

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 fade-in-up">
          <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
            Resources
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9090B0' }}>
            Curated links for learning, organized by topic.
          </p>
        </div>

        {/* Niche filter pills */}
        {niches.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
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
            {niches.map((niche) => {
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

        {/* Links list */}
        {links.length === 0 ? (
          <div className="glass p-8 text-center" style={{ borderStyle: 'dashed' }}>
            <p className="text-lg mb-2" style={{ color: '#9090B0' }}>No resources yet</p>
            <p className="text-sm" style={{ color: '#9090B0' }}>
              Check back later — instructors will add useful links here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                reactions={reactions[link.id] ?? []}
                profileCompleted={profileCompleted}
                onReactionsChange={handleReactionsChange}
              />
            ))}

            {/* Profile gate CTA */}
            {hiddenCount > 0 && (
              <div
                className="glass-strong p-6 text-center fade-in-up"
                style={{ border: '1px solid rgba(99, 91, 255, 0.2)' }}
              >
                <div className="text-2xl mb-2">🔒</div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#F0F0F7' }}>
                  {hiddenCount} more resource{hiddenCount > 1 ? 's' : ''} available
                </h3>
                <p className="text-xs mb-4" style={{ color: '#9090B0' }}>
                  Complete your profile to unlock all resources, reactions, and comments.
                  Just add at least one social profile.
                </p>
                {user ? (
                  <button
                    onClick={() => navigate('/auth/complete-profile')}
                    className="btn-liquid px-5 py-2 text-sm"
                  >
                    Complete profile
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/auth/login')}
                    className="btn-liquid px-5 py-2 text-sm"
                  >
                    Sign in to unlock
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
