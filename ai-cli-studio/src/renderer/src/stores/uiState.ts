import { create } from 'zustand'

export type ViewMode = 'preview' | 'code' | 'side-by-side'

interface UiState {
  viewMode: ViewMode
  splitPosition: number // percentage (0-100), default 50
  setViewMode: (mode: ViewMode) => void
  setSplitPosition: (position: number) => void
}

export const useUiStateStore = create<UiState>((set) => ({
  viewMode: 'preview',
  splitPosition: 50,

  setViewMode: (mode) => set({ viewMode: mode }),

  setSplitPosition: (position) =>
    set({ splitPosition: Math.max(10, Math.min(90, position)) }),
}))
