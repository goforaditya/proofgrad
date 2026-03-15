import type { RefObject } from 'react'

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  content: string
  onChange: (content: string) => void
}

interface ToolbarAction {
  label: string
  icon: string
  prefix: string
  suffix: string
  placeholder: string
  block?: boolean // If true, insert on a new line
}

const actions: ToolbarAction[] = [
  { label: 'Bold', icon: 'B', prefix: '**', suffix: '**', placeholder: 'bold text' },
  { label: 'Italic', icon: 'I', prefix: '*', suffix: '*', placeholder: 'italic text' },
  { label: 'Heading', icon: 'H', prefix: '## ', suffix: '', placeholder: 'Heading', block: true },
  { label: 'Link', icon: '🔗', prefix: '[', suffix: '](url)', placeholder: 'link text' },
  { label: 'Code', icon: '`', prefix: '`', suffix: '`', placeholder: 'code' },
  { label: 'Code Block', icon: '```', prefix: '```\n', suffix: '\n```', placeholder: 'code block', block: true },
  { label: 'List', icon: '•', prefix: '- ', suffix: '', placeholder: 'list item', block: true },
  { label: 'Quote', icon: '"', prefix: '> ', suffix: '', placeholder: 'quote', block: true },
]

export default function MarkdownToolbar({ textareaRef, content, onChange }: Props) {
  function applyAction(action: ToolbarAction) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const text = selected || action.placeholder

    let before = content.substring(0, start)
    const after = content.substring(end)

    // For block-level items, ensure we're on a new line
    if (action.block && before.length > 0 && !before.endsWith('\n')) {
      before += '\n'
    }

    const insertion = action.prefix + text + action.suffix
    const newContent = before + insertion + after
    onChange(newContent)

    // Restore cursor position after React updates the textarea
    requestAnimationFrame(() => {
      textarea.focus()
      const cursorStart = before.length + action.prefix.length
      const cursorEnd = cursorStart + text.length
      textarea.setSelectionRange(cursorStart, cursorEnd)
    })
  }

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => applyAction(action)}
          title={action.label}
          className="btn-ghost px-2 py-1 text-xs font-mono rounded transition-colors"
          style={{ minWidth: 28 }}
        >
          {action.icon}
        </button>
      ))}
    </div>
  )
}
