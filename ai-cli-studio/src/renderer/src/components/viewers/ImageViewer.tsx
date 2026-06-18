import { type FC } from 'react'
import type { ArtifactViewerProps } from '../../../components/viewers/ViewerRegistry'

export const ImageViewer: FC<ArtifactViewerProps> = ({ content, title }) => {
  const isDataUri = content.startsWith('data:')
  const isSvg = title?.endsWith('.svg') || content.trimStart().startsWith('<svg')
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(content.trim())

  let src: string
  if (isDataUri) {
    src = content
  } else if (isSvg) {
    src = `data:image/svg+xml;base64,${btoa(content)}`
  } else if (isBase64) {
    src = `data:image/png;base64,${content.trim()}`
  } else {
    // Render as text if we can't determine an image format
    return (
      <pre className="h-full overflow-auto p-4 bg-code-bg text-text-primary font-mono text-sm">
        <code>{content}</code>
      </pre>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 flex items-start justify-center">
      <img
        src={src}
        alt={title ?? 'Image artifact'}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  )
}

export default ImageViewer
