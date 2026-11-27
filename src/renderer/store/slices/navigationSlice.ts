// src/renderer/store/slices/navigationSlice.ts

import type { StateCreator } from "zustand";
import {
  APP_VIEW_IDS,
  VIEW_MODES,
  type AppViewId,
  type ViewMode,
} from "@renderer/registry/appRegistry";
import type { AppState } from "@renderer/store";

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
  currentView: APP_VIEW_IDS.OPERATION,
  currentMode: VIEW_MODES.OPERATION,
  searchTerms: {},
  searchTerm: "",
  isSidebarOpen: false,
  selectedIds: {
    [VIEW_MODES.OPERATION]: null,
    [VIEW_MODES.IRREGULAR]: null,
    [VIEW_MODES.TODAY]: null,
  },
  scrollPositions: {},

  setCurrentView: (view) =>
    set((state) => {
      state.currentView = view;
      state.searchTerm = state.searchTerms[view] ?? "";
      if (view !== APP_VIEW_IDS.OPERATION) {
        state.summaryStatusFilter = null;
        state.summaryReturnMode = null;
      }
    }),

  setMode: (mode) =>
    set((state) => {
      state.currentMode = mode;
      state.summaryStatusFilter = null;
      state.summaryReturnMode = null;
    }),

  setSearchTerm: (term) =>
    set((state) => {
      state.searchTerms[state.currentView] = term;
      state.searchTerm = term;
    }),

  toggleSidebar: () =>
    set((state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    }),

  setSidebarOpen: (open) =>
    set((state) => {
      state.isSidebarOpen = open;
    }),

  setSelectedId: (mode, id) =>
    set((state) => {
      state.selectedIds[mode] = id;
    }),

  setScrollPosition: (key, position) =>
    set((state) => {
      const current = state.scrollPositions[key];

      if (current?.top === position.top && current?.left === position.left) {
        return;
      }

      state.scrollPositions[key] = position;
    }),
});