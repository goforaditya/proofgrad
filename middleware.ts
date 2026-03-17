import type { NextRequest } from 'next/server'

export const config = {
  matcher: '/blog/:slug*',
}

export default async function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const segments = url.pathname.split('/').filter(Boolean)

  // Only handle /blog/:slug (not /blog index)
  if (segments.length !== 2 || segments[0] !== 'blog') return

  const slug = segments[1]
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return

  try {
    // Fetch article metadata from Supabase REST API
    const apiUrl = `${supabaseUrl}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&select=title,content,author_id,banner_url,tags&limit=1`
    const res = await fetch(apiUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!res.ok) return

    const rows = await res.json()
    if (!rows.length) return

    const article = rows[0]
    const title = article.title
    const description = article.content
      .replace(/[#*_\[\]()]/g, '')
      .slice(0, 160)
      .trim()
    const articleUrl = url.href

    // Fetch the SPA's index.html from origin
    const originUrl = new URL('/index.html', url.origin)
    const htmlRes = await fetch(originUrl)
    if (!htmlRes.ok) return

    let html = await htmlRes.text()

    // Replace meta tags
    html = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(title)} — Proofgrad</title>`
    )
    html = html.replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${escapeAttr(title)}"`
    )
    html = html.replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${escapeAttr(description)}"`
    )
    html = html.replace(
      /<meta property="og:type" content="[^"]*"/,
      `<meta property="og:type" content="article"`
    )
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${escapeAttr(title)}"`
    )
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${escapeAttr(description)}"`
    )
    // Build the OG image URL — use custom banner if set, otherwise dynamic OG endpoint
    const firstTag = Array.isArray(article.tags) && article.tags.length ? article.tags[0] : ''
    const ogImageUrl = article.banner_url
      || `${url.origin}/api/og?title=${encodeURIComponent(title)}${firstTag ? `&tag=${encodeURIComponent(firstTag)}` : ''}`

    // Replace og:image
    html = html.replace(
      /<meta property="og:image" content="[^"]*"/,
      `<meta property="og:image" content="${escapeAttr(ogImageUrl)}"`
    )

    // Set twitter:card to summary_large_image for big preview
    html = html.replace(
      /<meta name="twitter:card" content="[^"]*"/,
      `<meta name="twitter:card" content="summary_large_image"`
    )

    // Add twitter:image
    if (!html.includes('twitter:image')) {
      html = html.replace(
        '</head>',
        `<meta name="twitter:image" content="${escapeAttr(ogImageUrl)}" />\n</head>`
      )
    }

    // Add og:url if not present
    if (!html.includes('og:url')) {
      html = html.replace(
        '</head>',
        `<meta property="og:url" content="${escapeAttr(articleUrl)}" />\n</head>`
      )
    }

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    // On any error, fall through to normal SPA behavior
    return
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
