import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Accommodation } from '@/types'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

export default function CompleteProfile() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [phone, setPhone] = useState(user?.phone ?? '')
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study ?? '')
  const [accommodation, setAccommodation] = useState<Accommodation | ''>(
    user?.accommodation ?? ''
  )
  const [instagram, setInstagram] = useState(user?.instagram ?? '')
  const [linkedin, setLinkedin] = useState(user?.linkedin ?? '')
  const [snapchat, setSnapchat] = useState(user?.snapchat ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!accommodation) {
      setError('Please select hostel or day scholar.')
      return
    }
    setError(null)
    setLoading(true)

    const { error: err } = await supabase
      .from('users')
      .update({
        phone: phone || null,
        year_of_study: yearOfStudy || null,
        accommodation: accommodation || null,
        instagram: instagram || null,
        linkedin: linkedin || null,
        snapchat: snapchat || null,
        profile_completed: true,
      })
      .eq('id', user!.id)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    await refreshUser()
    navigate('/', { replace: true })
  }

  return (
    <div className="liquid-bg min-h-screen flex items-center justify-center px-4">
      {/* Floating orb */}
      <div className="liquid-orb-3" />

      <div className="w-full max-w-md relative z-[1] fade-in-up">
        <div className="text-center mb-8">
          <h1 className="glow-text text-3xl font-bold">Proofgrad</h1>
          <p className="mt-2 text-sm" style={{ color: '#9090B0' }}>
            Complete your profile to unlock PDF export
          </p>
        </div>

        <div className="glass-strong p-8">
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#F0F0F7' }}>
            Complete your profile
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
            This unlocks portfolio PDF export and group comparisons.
          </p>

          {error && (
            <div className="alert-error mb-4 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                Phone number (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                Year of study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="glass-select w-full px-4 py-2.5 text-sm"
                style={{ color: yearOfStudy ? '#F0F0F7' : '#9090B0' }}
              >
                <option value="">Select year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#9090B0' }}>
                Accommodation *
              </label>
              <div className="flex gap-3">
                {(['hostel', 'day_scholar'] as Accommodation[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAccommodation(a)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      accommodation === a ? 'btn-liquid' : 'btn-ghost'
                    }`}
                  >
                    {a === 'hostel' ? 'Hostelite' : 'Day Scholar'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                Instagram (optional)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                LinkedIn (optional)
              </label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/username"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                Snapchat (optional)
              </label>
              <input
                type="text"
                value={snapchat}
                onChange={(e) => setSnapchat(e.target.value)}
                placeholder="@username"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-liquid w-full py-2.5"
            >
              {loading ? 'Saving…' : 'Save & unlock export'}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-ghost w-full py-2.5"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
