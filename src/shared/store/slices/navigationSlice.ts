// src/shared/store/slices/navigationSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";
import type { ViewMode } from "@shared/types/uiType";
import { getAppViewConfig } from "@renderer/registry/appRegistry";
import { AuthView } from "@renderer/features/auth/AuthView";

type SelectedIds = Record<ViewMode, string | null>;

export interface NavigationSlice {
  currentView: string;
  pendingView: string | null;
  currentMode: ViewMode;
  searchTerm: string;
  isSidebarOpen: boolean;
  selectedIds: SelectedIds;

  setCurrentView: (view: string) => void;
  setPendingView: (view: string | null) => void;
  setMode: (mode: ViewMode) => void;
  setSearchTerm: (term: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedId: (mode: ViewMode, id: string | null) => void;
}

export const createNavigationSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  NavigationSlice
> = (set) => ({
  currentView: "operation",
  pendingView: null,
  currentMode: "operation",
  searchTerm: "",
  isSidebarOpen: false,
  selectedIds: {
    operation: null,
    irregular: null,
    today: null,
  },

  setCurrentView: (view) =>
    set((state: AppState) => {
      state.currentView = view;
    }),

  setPendingView: (view) =>
    set((state: AppState) => {
      state.pendingView = view;
    }),

  setMode: (mode) =>
    set((state: AppState) => {
      state.currentMode = mode;
    }),

  setSearchTerm: (term) =>
    set((state: AppState) => {
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
});

// ============================================================
// Selectors
// ============================================================

/**
 * 現在の表示対象 View コンポーネントを判別・返却する Selector
 * 未認証かつ保護対象（isProtected）の画面の場合は AuthView を返す
 */
export const selectActiveViewComponent = (state: AppState) => {
  const viewConfig = getAppViewConfig(state.currentView);

  if (!state.isAuthenticated && viewConfig.isProtected) {
    return AuthView;
  }

  return viewConfig.component;
};
