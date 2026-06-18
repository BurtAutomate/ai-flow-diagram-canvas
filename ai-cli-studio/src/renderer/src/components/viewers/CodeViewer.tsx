import { type FC, useEffect, useState } from 'react'
import { type ArtifactViewerProps } from '../../../components/viewers/ViewerRegistry'
import { CodeSkeleton } from '../ui/Skeleton'

const LANG_MAP: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  css: 'css',
  html: 'html',
  svg: 'svg',
  json: 'json',
  md: 'markdown',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  sh: 'bash',
  bash: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  sql: 'sql',
}

function inferLanguage(title?: string, _content?: string): string {
  if (title) {
    const ext = title.split('.').pop()?.toLowerCase()
    if (ext && LANG_MAP[ext]) return LANG_MAP[ext]
  }
  return 'typescript'
}

export const CodeViewer: FC<ArtifactViewerProps> = ({ content, language, title }) => {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lang = language ?? inferLanguage(title, content)

  useEffect(() => {
    let cancelled = false

    async function highlight(): Promise<void> {
      try {
        const shiki = await import('shiki')
        const highlighter = await shiki.createHighlighter({
          themes: ['dark-plus'],
          langs: [
            'typescript',
            'javascript',
            'jsx',
            'tsx',
            'css',
            'html',
            'json',
            'markdown',
            'python',
            'bash',
            'yaml',
            'toml',
            'xml',
            'sql',
            'rust',
            'go',
            'ruby',
          ],
        })

        let langId = lang
        try {
          highlighter.codeToHtml(content, { lang: langId, theme: 'dark-plus' })
        } catch {
          langId = 'typescript'
        }

        const result = highlighter.codeToHtml(content, { lang: langId, theme: 'dark-plus' })
        if (!cancelled) {
          setHtml(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Highlighting failed')
        }
      }
    }

    highlight()
    return () => {
      cancelled = true
    }
  }, [content, lang])

  if (error) {
    return (
      <pre className="h-full overflow-auto p-4 bg-code-bg text-text-primary font-mono text-sm">
        <code>{content}</code>
      </pre>
    )
  }

  if (!html) {
    return <CodeSkeleton />
  }

  return (
    <div
      className="h-full overflow-auto p-4 bg-code-bg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default CodeViewer
