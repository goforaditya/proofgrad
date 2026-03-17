import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import {
  fetchResourceLinks,
  createResourceLink,
  updateResourceLink,
  deleteResourceLink,
} from '@/hooks/useResources'
import type { ResourceLink } from '@/types'

export default function ResourceManager() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [links, setLinks] = useState<ResourceLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [niche, setNiche] = useState('General')
  const [creating, setCreating] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editNiche, setEditNiche] = useState('')

  const loadLinks = useCallback(async () => {
    const data = await fetchResourceLinks()
    setLinks(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  // Get unique niches for autocomplete
  const existingNiches = [...new Set(links.map((l) => l.niche))]

  async function handleCreate() {
    if (!user || !title.trim() || !url.trim()) return
    setCreating(true)
    setError(null)

    const { link, error: err } = await createResourceLink(
      user.id,
      title.trim(),
      url.trim(),
      niche.trim() || 'General',
      description.trim() || undefined
    )

    if (err || !link) {
      setError(err ?? 'Failed to create link')
      setCreating(false)
      return
    }

    setLinks((prev) => [...prev, link])
    setTitle('')
    setUrl('')
    setDescription('')
    setNiche('General')
    setShowForm(false)
    setCreating(false)
  }

  function startEdit(link: ResourceLink) {
    setEditingId(link.id)
    setEditTitle(link.title)
    setEditUrl(link.url)
    setEditDescription(link.description ?? '')
    setEditNiche(link.niche)
  }

  async function handleSaveEdit() {
    if (!editingId || !editTitle.trim() || !editUrl.trim()) return
    setError(null)

    const { error: err } = await updateResourceLink(editingId, {
      title: editTitle.trim(),
      url: editUrl.trim(),
      description: editDescription.trim() || undefined,
      niche: editNiche.trim() || 'General',
    })

    if (err) {
      setError(err)
      return
    }

    setLinks((prev) =>
      prev.map((l) =>
        l.id === editingId
          ? { ...l, title: editTitle.trim(), url: editUrl.trim(), description: editDescription.trim() || null, niche: editNiche.trim() || 'General' }
          : l
      )
    )
    setEditingId(null)
  }

  async function handleDelete(linkId: string) {
    const { error: err } = await deleteResourceLink(linkId)
    if (err) {
      setError(err)
      return
    }
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
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

  // Group links by niche for display
  const grouped: Record<string, ResourceLink[]> = {}
  for (const link of links) {
    if (!grouped[link.niche]) grouped[link.niche] = []
    grouped[link.niche].push(link)
  }

  return (
    <AppShell showSidebar>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 fade-in-up">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
              Resource Manager
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9090B0' }}>
              Curate links for your students, organized by topic.
            </p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-liquid px-4 py-2.5 text-sm">
              + Add link
            </button>
          )}
        </div>

        {error && (
          <div className="alert-error px-4 py-3 text-sm mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="glass-strong p-6 mb-6 fade-in-up">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#F0F0F7' }}>
              Add resource link
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9090B0' }}>TITLE *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Khan Academy — Statistics"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9090B0' }}>URL *</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9090B0' }}>DESCRIPTION</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description (optional)"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9090B0' }}>NICHE / TOPIC</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Data Analytics"
                  list="niche-suggestions"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
                <datalist id="niche-suggestions">
                  {existingNiches.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !url.trim()}
                className="btn-liquid flex-1 py-2.5"
              >
                {creating ? 'Adding…' : 'Add link'}
              </button>
            </div>
          </div>
        )}

        {/* Links grouped by niche */}
        {links.length === 0 ? (
          <div className="glass p-8 text-center" style={{ borderStyle: 'dashed' }}>
            <p className="text-lg mb-2" style={{ color: '#9090B0' }}>No resources yet</p>
            <p className="text-sm" style={{ color: '#9090B0' }}>
              Add useful links for your students to explore.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([nicheName, nicheLinks]) => (
            <div key={nicheName} className="mb-6">
              <h3 className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: '#635BFF' }}>
                {nicheName}
              </h3>
              <div className="flex flex-col gap-2">
                {nicheLinks.map((link) =>
                  editingId === link.id ? (
                    /* Edit mode */
                    <div key={link.id} className="glass-strong p-4 fade-in-up">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={editNiche}
                          onChange={(e) => setEditNiche(e.target.value)}
                          list="niche-suggestions"
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setEditingId(null)} className="btn-ghost flex-1 py-2 text-xs">
                          Cancel
                        </button>
                        <button onClick={handleSaveEdit} className="btn-liquid flex-1 py-2 text-xs">
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div key={link.id} className="glass p-4 flex items-center justify-between fade-in-up">
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
                          <p className="text-xs mt-0.5" style={{ color: '#9090B0' }}>
                            {link.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-3">
                        <button
                          onClick={() => startEdit(link)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ color: '#9090B0', background: 'rgba(46, 46, 69, 0.4)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ color: '#E8447A', background: 'rgba(232, 68, 122, 0.1)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}

        {/* View public page */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/resources')}
            className="btn-ghost px-4 py-2 text-sm"
          >
            View public resources page →
          </button>
        </div>
      </div>
    </AppShell>
  )
}
