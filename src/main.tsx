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
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D0D12;font-family:Inter,sans-serif;padding:2rem;position:relative;overflow:hidden">
      <div style="position:fixed;width:500px;height:500px;top:-10%;right:-5%;border-radius:50%;filter:blur(100px);background:radial-gradient(circle,rgba(232,68,122,0.15) 0%,transparent 70%);animation:float-orb-1 20s ease-in-out infinite;pointer-events:none"></div>
      <div style="position:fixed;width:400px;height:400px;bottom:-5%;left:-5%;border-radius:50%;filter:blur(100px);background:radial-gradient(circle,rgba(100,80,200,0.12) 0%,transparent 70%);animation:float-orb-2 25s ease-in-out infinite;pointer-events:none"></div>
      <div style="max-width:480px;background:rgba(26,26,38,0.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:2rem;position:relative;z-index:1;box-shadow:0 12px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.06)">
        <h1 style="color:#E8447A;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;text-shadow:0 0 10px rgba(232,68,122,0.4),0 0 40px rgba(232,68,122,0.15)">Proofgrad — Setup Required</h1>
        <p style="color:#9090B0;font-size:0.875rem;margin-bottom:1.5rem">Add your Supabase credentials to <code style="color:#F0F0F7;background:rgba(13,13,18,0.6);padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,0.06)">.env</code> to get started.</p>
        <pre style="color:#F0F0F7;background:rgba(13,13,18,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:1rem;font-size:0.8rem;line-height:1.6">VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key</pre>
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
