import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Proofgrad'
  const author = searchParams.get('author') || ''
  const tag = searchParams.get('tag') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 64px',
          background: 'linear-gradient(135deg, #0D0D12 0%, #1A1A26 50%, #242436 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            display: 'flex',
            width: '80px',
            height: '4px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #635BFF, #8B83FF)',
          }}
        />

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              fontSize: title.length > 60 ? 40 : title.length > 40 ? 48 : 56,
              fontWeight: 700,
              color: '#F0F0F7',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          {/* Author + Tag row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {author && (
              <div
                style={{
                  fontSize: 20,
                  color: '#9090B0',
                  fontWeight: 400,
                }}
              >
                {author}
              </div>
            )}
            {author && tag && (
              <div style={{ fontSize: 20, color: '#4A4A6A' }}>·</div>
            )}
            {tag && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 16,
                  color: '#B8B3FF',
                  background: 'rgba(99, 91, 255, 0.15)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(99, 91, 255, 0.25)',
                }}
              >
                {tag}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Proofgrad branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo mark */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #635BFF, #8B83FF)',
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              P
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: '#9090B0',
                letterSpacing: '-0.01em',
              }}
            >
              Proofgrad
            </div>
          </div>

          {/* Decorative dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#635BFF', opacity: 0.6 }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#635BFF', opacity: 0.4 }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#635BFF', opacity: 0.2 }} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
