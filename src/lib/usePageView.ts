import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from './telemetry'

/**
 * Auto-tracks page views on route changes.
 * Place once inside <BrowserRouter>.
 */
export function usePageView() {
  const location = useLocation()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    // Skip duplicate tracking for same path
    if (location.pathname === prevPath.current) return
    prevPath.current = location.pathname

    track('page_view', {
      referrer: document.referrer || undefined,
    })
  }, [location.pathname])
}
