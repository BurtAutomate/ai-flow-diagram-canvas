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
  it('should be defined after Plan 02 implementation', () => {
    // This import will fail in Plan 01 — RED phase contract test
    // Plan 02 creates ViewerRegistry with register/getViewer/render
    const ViewerRegistry = require('../viewers/ViewerRegistry').ViewerRegistry

    // This will throw in Plan 01 (module not found) — expected
    // In Plan 02, it creates an instance and tests the API
    const registry = new ViewerRegistry()
    expect(registry).toBeDefined()
  })

  it('register should add a viewer definition', () => {
    const ViewerRegistry = require('../viewers/ViewerRegistry').ViewerRegistry
    const registry = new ViewerRegistry()

    const definition: ViewerDefinition = {
      type: 'test-viewer',
      component: {} as React.LazyExoticComponent<React.ComponentType<unknown>>,
      skeleton: {} as React.ComponentType<unknown>,
    }

    registry.register(definition)
    expect(registry.getViewer('test-viewer')).toBe(definition)
  })

  it('getViewer should return undefined for unregistered types', () => {
    const ViewerRegistry = require('../viewers/ViewerRegistry').ViewerRegistry
    const registry = new ViewerRegistry()

    expect(registry.getViewer('nonexistent')).toBeUndefined()
  })

  it('render should return fallback for unregistered types', () => {
    const ViewerRegistry = require('../viewers/ViewerRegistry').ViewerRegistry
    const registry = new ViewerRegistry()

    // Plan 02 should return a fallback component or throw with helpful message
    expect(() => registry.render('unknown', {})).not.toThrow()
  })
})
