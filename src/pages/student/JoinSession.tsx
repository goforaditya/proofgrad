import { useState, type FormEvent } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'

export default function JoinSession() {
  const { guestState, user } = useAuth()
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    // Phase 2 will implement the actual join logic
    console.log('Join session:', { code, nickname })
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
          Join a Session
        </h1>
        <p className="text-sm mb-8" style={{ color: '#9090B0' }}>
          Enter the code your instructor gave you, or scan the QR code.
        </p>

        {(user || guestState) && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45', color: '#9090B0' }}
          >
            <span style={{ color: '#E8447A' }}>●</span>
            Signed in as{' '}
            <strong style={{ color: '#F0F0F7' }}>
              {user?.name ?? guestState?.nickname}
            </strong>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Session code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="e.g. ABC123"
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl text-lg font-mono text-center outline-none tracking-widest uppercase"
              style={{
                backgroundColor: '#1A1A26',
                border: '1px solid #2E2E45',
                color: '#F0F0F7',
                letterSpacing: '0.25em',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#E8447A')}
              onBlur={(e) => (e.target.style.borderColor = '#2E2E45')}
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                Your nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                placeholder="e.g. EconNerd42"
                maxLength={30}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: '#1A1A26',
                  border: '1px solid #2E2E45',
                  color: '#F0F0F7',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#E8447A')}
                onBlur={(e) => (e.target.style.borderColor = '#2E2E45')}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#E8447A', color: '#fff' }}
          >
            Join session →
          </button>
        </form>

        <div
          className="mt-6 text-center text-sm px-4 py-3 rounded-xl"
          style={{ backgroundColor: '#1A1A26', border: '1px dashed #2E2E45', color: '#9090B0' }}
        >
          Session join logic ships in Phase 2.
        </div>
      </div>
    </AppShell>
  )
}
