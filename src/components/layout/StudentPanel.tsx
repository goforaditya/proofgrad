import { type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children?: ReactNode
}

/**
 * Collapsible left panel for student analysis view.
 * Hosts lecture notes + task checklist (implemented in Phase 6).
 */
export default function StudentPanel({ open, onClose, children }: Props) {
  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className="fixed md:relative z-30 md:z-auto top-0 left-0 h-full flex flex-col transition-transform duration-200 md:transition-none"
        style={{
          width: 280,
          backgroundColor: '#1A1A26',
          borderRight: '1px solid #2E2E45',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 h-14 flex-shrink-0"
          style={{ borderBottom: '1px solid #2E2E45' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#F0F0F7' }}>
            Lecture Notes
          </span>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded"
            style={{ color: '#9090B0' }}
          >
            ✕
          </button>
        </div>

        {/* Content (Phase 6 will fill this) */}
        <div className="flex-1 overflow-y-auto p-4">
          {children ?? (
            <p className="text-sm" style={{ color: '#9090B0' }}>
              No notes for this phase yet.
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
