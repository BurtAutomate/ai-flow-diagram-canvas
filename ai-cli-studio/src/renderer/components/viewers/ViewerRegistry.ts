import {
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
  lazy,
  createElement,
  Suspense,
} from 'react'
import { CodeSkeleton } from '../../src/components/ui/Skeleton'

export type ArtifactType = 'code' | 'markdown' | 'html' | 'image' | 'pdf' | 'svg'

export interface ArtifactViewerProps {
  content: string
  language?: string
  title?: string
}

export interface ViewerDefinition {
  type: string
  component: LazyExoticComponent<ComponentType<ArtifactViewerProps>>
  skeleton: ComponentType<ArtifactViewerProps>
}

export class ViewerRegistry {
  private viewers = new Map<string, ViewerDefinition>()

  register(definition: ViewerDefinition): void {
    this.viewers.set(definition.type, definition)
  }

  getViewer(type: string): ViewerDefinition | undefined {
    return this.viewers.get(type)
  }

  render(type: string, props: ArtifactViewerProps): ReactNode {
    const def = this.viewers.get(type)
    if (!def) {
      return createElement(
        'div',
        { className: 'flex items-center justify-center h-full p-4 text-text-faint' },
        'Unsupported artifact type: ' + type
      )
    }
    return createElement(
      Suspense,
      { fallback: createElement(def.skeleton as ComponentType<ArtifactViewerProps>, props) },
      createElement(def.component, props)
    )
  }
}

export const viewerRegistry = new ViewerRegistry()

// Register viewers
viewerRegistry.register({
  type: 'code',
  component: lazy(() => import('../../src/components/viewers/CodeViewer')),
  skeleton: CodeSkeleton,
})
