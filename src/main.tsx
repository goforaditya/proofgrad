import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import { isMissingConfig } from '@/lib/supabase'
import App from './App'
import './index.css'

// Show setup screen if Supabase env vars are not configured
if (isMissingConfig) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D0D12;font-family:Inter,sans-serif;padding:2rem">
      <div style="max-width:480px;background:#1A1A26;border:1px solid #2E2E45;border-radius:16px;padding:2rem">
        <h1 style="color:#E8447A;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem">Proofgrad — Setup Required</h1>
        <p style="color:#9090B0;font-size:0.875rem;margin-bottom:1.5rem">Add your Supabase credentials to <code style="color:#F0F0F7;background:#0D0D12;padding:2px 6px;border-radius:4px">.env</code> to get started.</p>
        <pre style="color:#F0F0F7;background:#0D0D12;border:1px solid #2E2E45;border-radius:8px;padding:1rem;font-size:0.8rem;line-height:1.6">VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key</pre>
        <p style="color:#9090B0;font-size:0.8rem;margin-top:1rem">After editing .env, restart the dev server with <code style="color:#F0F0F7">bun run dev</code>.</p>
      </div>
    </div>
  `
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
