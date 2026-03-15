import ReactMarkdown from 'react-markdown'

interface Props {
  content: string
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-bold mt-6 mb-3" style={{ color: '#F0F0F7' }}>{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold mt-5 mb-2" style={{ color: '#F0F0F7' }}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: '#F0F0F7' }}>{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed mb-3" style={{ color: '#9090B0' }}>{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ color: '#F0F0F7' }}>{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em style={{ color: '#FF9EC8' }}>{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code
      className="text-xs px-1.5 py-0.5 rounded font-mono"
      style={{ background: 'rgba(232, 68, 122, 0.1)', color: '#FF9EC8' }}
    >
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre
      className="rounded-lg px-4 py-3 my-3 overflow-x-auto text-sm"
      style={{ background: 'rgba(26, 26, 38, 0.8)', border: '1px solid #2E2E45' }}
    >
      {children}
    </pre>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1" style={{ color: '#9090B0' }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1" style={{ color: '#9090B0' }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      className="border-l-2 pl-4 my-3 italic"
      style={{ borderColor: '#E8447A', color: '#9090B0' }}
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline transition-colors hover:text-[#FF6BA8]"
      style={{ color: '#E8447A' }}
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="my-6 border-t" style={{ borderColor: '#2E2E45' }} />
  ),
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-invert prose-sm max-w-none" style={{ color: '#F0F0F7' }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ReactMarkdown components={markdownComponents as any}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
