import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'

export default function InstructorDashboard() {
  const { user } = useAuth()

  return (
    <AppShell showSidebar>
      <div className="max-w-4xl">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F0F0F7' }}>
            Welcome back, {user?.name ?? 'Instructor'}
          </h1>
          <p className="text-sm" style={{ color: '#9090B0' }}>
            Manage your live sessions, surveys, and quizzes from here.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            className="flex flex-col gap-2 p-6 rounded-xl text-left transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: '#E8447A', color: '#fff' }}
            disabled
            title="Coming in Phase 2"
          >
            <span className="text-2xl">+</span>
            <span className="font-semibold">Create Session</span>
            <span className="text-sm opacity-75">Start a live lecture session</span>
          </button>

          <div
            className="flex flex-col gap-2 p-6 rounded-xl"
            style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}
          >
            <span className="text-2xl" style={{ color: '#9090B0' }}>📄</span>
            <span className="font-semibold" style={{ color: '#F0F0F7' }}>Articles</span>
            <span className="text-sm" style={{ color: '#9090B0' }}>
              Write and publish blog articles
            </span>
          </div>
        </div>

        {/* Sessions list (empty state) */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#F0F0F7' }}>
            Your Sessions
          </h2>
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: '#1A1A26', border: '1px dashed #2E2E45' }}
          >
            <p className="text-sm" style={{ color: '#9090B0' }}>
              No sessions yet. Create your first session to get started.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
