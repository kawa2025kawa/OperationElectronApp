// src/renderer/store/slices/navigationSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type { AppViewId, ViewMode } from "@shared/types/ui";

type SelectedIds = Record<ViewMode, string | null>;

export interface NavigationSlice {
  currentView: AppViewId;
  pendingView: AppViewId | null;
  currentMode: ViewMode;
  searchTerms: Record<string, string>; // VIEWごとの検索文字列一覧
  searchTerm: string; // 現在アクティブなVIEWの検索文字列
  isSidebarOpen: boolean;
  selectedIds: SelectedIds;
  setCurrentView: (view: AppViewId) => void;
  setPendingView: (view: AppViewId | null) => void;
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
  searchTerms: {},
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
      // 切り替え先VIEWの検索文字列を復元（存在しなければ空文字）
      state.searchTerm = state.searchTerms[view] ?? "";
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
      // VIEW用マップと現在の検索文字列の両方を同期更新
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
});
