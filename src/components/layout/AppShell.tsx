import { useState, type ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'
import InstructorSidebar from '@/components/layout/InstructorSidebar'
import { useAuth } from '@/lib/auth'

interface Props {
  children: ReactNode
  /** Show instructor sidebar */
  showSidebar?: boolean
  /** Full-width layout (no sidebar) */
  fullWidth?: boolean
}

export default function AppShell({ children, showSidebar = false, fullWidth = false }: Props) {
  const { user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const showInstructorSidebar =
    showSidebar && user?.role === 'instructor'

  return (
    <div className="liquid-bg flex flex-col h-screen">
      {/* Floating orb 3 */}
      <div className="liquid-orb-3" />

      <Navbar />

      <div className="flex flex-1 min-h-0 relative z-[1]">
        {showInstructorSidebar && (
          <InstructorSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
        )}

        <main
          className={`flex-1 overflow-y-auto ${fullWidth ? '' : 'max-w-screen-xl mx-auto w-full'}`}
          style={{ padding: fullWidth ? 0 : '1.5rem 1rem' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
