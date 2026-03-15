import { NavLink } from 'react-router-dom'

interface NavItem {
  label: string
  to: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/instructor/dashboard', icon: '⊞' },
]

interface Props {
  collapsed?: boolean
  onToggle?: () => void
}

export default function InstructorSidebar({ collapsed = false, onToggle }: Props) {
  return (
    <aside
      className="glass-sidebar flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? 56 : 220,
        minHeight: 0,
      }}
    >
      {/* Collapse toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="self-end m-3 p-1.5 rounded-lg transition-all hover:bg-white/5"
          style={{ color: '#9090B0' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {collapsed ? (
              <path d="M4 8l4-4 1.4 1.4L6.8 8l2.6 2.6L8 12 4 8z" />
            ) : (
              <path d="M12 8l-4 4-1.4-1.4L9.2 8 6.6 5.4 8 4l4 4z" />
            )}
          </svg>
        </button>
      )}

      <nav className="flex-1 px-2 py-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'text-white' : 'hover:bg-white/5'
              }`
            }
            style={({ isActive }) => ({
              background: isActive
                ? 'linear-gradient(135deg, #635BFF, #4F46E5)'
                : 'transparent',
              color: isActive ? '#fff' : '#9090B0',
              boxShadow: isActive ? '0 2px 12px rgba(99, 91, 255, 0.3)' : 'none',
            })}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
