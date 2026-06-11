import { create } from 'zustand'

export interface ArtifactTab {
  id: string
  title: string
  filePath: string
  type: 'code' | 'markdown' | 'image' | 'html' | 'pdf' | 'svg'
  content: string | null
  isLoading: boolean
}

const MAX_TABS = 5

interface ArtifactTabsState {
  tabs: ArtifactTab[]
  activeTabId: string | null
  openTab: (tab: ArtifactTab) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  setTabContent: (id: string, content: string) => void
  setTabLoading: (id: string, isLoading: boolean) => void
  hasReachedLimit: () => boolean
}

export const useArtifactTabsStore = create<ArtifactTabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) =>
    set((state) => {
      const existing = state.tabs.find((t) => t.id === tab.id)
      if (existing) {
        return { activeTabId: tab.id }
      }
      if (state.tabs.length >= MAX_TABS) {
        return state
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      }
    }),

  closeTab: (id) =>
    set((state) => {
      const filtered = state.tabs.filter((t) => t.id !== id)
      let nextActive = state.activeTabId
      if (state.activeTabId === id) {
        const closedIndex = state.tabs.findIndex((t) => t.id === id)
        nextActive = filtered[Math.min(closedIndex, filtered.length - 1)]?.id ?? null
      }
      return { tabs: filtered, activeTabId: nextActive }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const tabs = [...state.tabs]
      const [moved] = tabs.splice(fromIndex, 1)
      tabs.splice(toIndex, 0, moved)
      return { tabs }
    }),

  setTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, content, isLoading: false } : t)),
    })),

  setTabLoading: (id, isLoading) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, isLoading } : t)),
    })),

  hasReachedLimit: () => get().tabs.length >= MAX_TABS,
}))
