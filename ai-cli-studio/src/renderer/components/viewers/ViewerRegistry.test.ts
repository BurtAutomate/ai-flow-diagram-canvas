import { describe, it, expect } from 'vitest'

// Contract for the ViewerRegistry that Plan 02 implements
// Type stub — actual type comes from the ViewerRegistry module
interface ViewerDefinition {
  type: string
  component: React.LazyExoticComponent<React.ComponentType<unknown>>
  skeleton: React.ComponentType<unknown>
}

interface ViewerRegistryInterface {
  register: (definition: ViewerDefinition) => void
  getViewer: (type: string) => ViewerDefinition | undefined
  render: (type: string, props: Record<string, unknown>) => React.ReactNode
}

describe('ViewerRegistry', () => {
  it('should be defined after Plan 02 implementation', async () => {
    // Dynamic import resolves through Vite, handling ESM transforms properly
    const { ViewerRegistry } = await import('../viewers/ViewerRegistry')

    const registry = new ViewerRegistry()
    expect(registry).toBeDefined()
  })

  it('register should add a viewer definition', async () => {
    const { ViewerRegistry } = await import('../viewers/ViewerRegistry')
    const registry = new ViewerRegistry()

    const definition: ViewerDefinition = {
      type: 'test-viewer',
      component: {} as React.LazyExoticComponent<React.ComponentType<unknown>>,
      skeleton: {} as React.ComponentType<unknown>,
    }

    registry.register(definition)
    expect(registry.getViewer('test-viewer')).toBe(definition)
  })

  it('getViewer should return undefined for unregistered types', async () => {
    const { ViewerRegistry } = await import('../viewers/ViewerRegistry')
    const registry = new ViewerRegistry()

    expect(registry.getViewer('nonexistent')).toBeUndefined()
  })

  it('render should return fallback for unregistered types', async () => {
    const { ViewerRegistry } = await import('../viewers/ViewerRegistry')
    const registry = new ViewerRegistry()

    // Should return a fallback component or throw with helpful message
    expect(() => registry.render('unknown', {})).not.toThrow()
  })
})
