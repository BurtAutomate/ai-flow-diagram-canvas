import { type FC } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ArtifactViewerProps } from '../../../components/viewers/ViewerRegistry'

export const MarkdownViewer: FC<ArtifactViewerProps> = ({ content }) => {
  return (
    <div className="h-full overflow-auto p-6">
      <div
        className="max-w-3xl mx-auto prose prose-invert prose-headings:text-text-primary
                       prose-body:text-text-secondary prose-a:text-accent-primary
                       prose-strong:text-text-primary prose-code:text-code-text
                       prose-code:bg-code-bg prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                       prose-pre:bg-code-bg prose-pre:border prose-pre:border-border-default
                       prose-blockquote:border-l-accent-primary prose-blockquote:text-text-secondary
                       prose-li:text-text-secondary prose-hr:border-border-default
                       prose-img:rounded-lg"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default MarkdownViewer
