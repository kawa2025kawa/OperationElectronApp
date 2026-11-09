// src/renderer/store/slices/navigationSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type { AppViewId, ViewMode } from "@renderer/registry/appRegistry";

type SelectedIds = Record<ViewMode, string | null>;

interface ScrollPosition {
  top: number;
  left: number;
}

export interface NavigationSlice {
  currentView: AppViewId;
  currentMode: ViewMode;
  searchTerms: Record<string, string>;
  searchTerm: string;
  isSidebarOpen: boolean;
  selectedIds: SelectedIds;
  scrollPositions: Record<string, ScrollPosition>;
  setCurrentView: (view: AppViewId) => void;
  setMode: (mode: ViewMode) => void;
  setSearchTerm: (term: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedId: (mode: ViewMode, id: string | null) => void;
  setScrollPosition: (key: string, position: ScrollPosition) => void;
}

export const createNavigationSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  NavigationSlice
> = (set) => ({
  currentView: "operation",
  currentMode: "operation",
  searchTerms: {},
  searchTerm: "",
  isSidebarOpen: false,
  selectedIds: {
    operation: null,
    irregular: null,
    today: null,
  },
  scrollPositions: {},

  setCurrentView: (view) =>
    set((state: AppState) => {
      state.currentView = view;
      state.searchTerm = state.searchTerms[view] ?? "";
    }),

  setMode: (mode) =>
    set((state: AppState) => {
      state.currentMode = mode;
    }),

  setSearchTerm: (term) =>
    set((state: AppState) => {
      state.searchTerms[state.currentView] = term;
      state.searchTerm = term;
    }),

  toggleSidebar: () =>
    set((state: AppState) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    }),

  setSidebarOpen: (open) =>
    set((state: AppState) => {
      state.isSidebarOpen = open;
    }),

  setSelectedId: (mode, id) =>
    set((state: AppState) => {
      state.selectedIds[mode] = id;
    }),

  setScrollPosition: (key, position) =>
    set((state: AppState) => {
      const current = state.scrollPositions[key];

      if (current?.top === position.top && current?.left === position.left) {
        return;
      }

      state.scrollPositions[key] = position;
    }),
});
