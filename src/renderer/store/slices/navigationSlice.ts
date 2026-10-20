// src/renderer/store/slices/navigationSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type { AppViewId, ViewMode } from "@renderer/registry/appRegistry";

type SelectedIds = Record<ViewMode, string | null>;

export interface NavigationSlice {
  currentView: AppViewId;
  currentMode: ViewMode;
  searchTerms: Record<string, string>;
  searchTerm: string;
  isSidebarOpen: boolean;
  selectedIds: SelectedIds;
  setCurrentView: (view: AppViewId) => void;
  setMode: (mode: ViewMode) => void;
  setSearchTerm: (term: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedId: (mode: ViewMode, id: string | null) => void;
}

// 画面遷移・表示モード・検索文字列・サイドバー開閉を管理するスライスを生成する。
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

  // カレント画面ビューを切り替え、画面別の検索文字列を復元する。
  setCurrentView: (view) =>
    set((state: AppState) => {
      state.currentView = view;
      state.searchTerm = state.searchTerms[view] ?? "";
    }),

  // 表示モード（operation/irregular/today）を変更する。
  setMode: (mode) =>
    set((state: AppState) => {
      state.currentMode = mode;
    }),

  // 現在の画面に対応する検索文字列を更新する。
  setSearchTerm: (term) =>
    set((state: AppState) => {
      state.searchTerms[state.currentView] = term;
      state.searchTerm = term;
    }),

  // サイドバーの開閉状態を反転する。
  toggleSidebar: () =>
    set((state: AppState) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    }),

  // サイドバーの開閉状態を明示的に設定する。
  setSidebarOpen: (open) =>
    set((state: AppState) => {
      state.isSidebarOpen = open;
    }),

  // 指定表示モードで選択中の行アイテムIDを設定する。
  setSelectedId: (mode, id) =>
    set((state: AppState) => {
      state.selectedIds[mode] = id;
    }),
});
