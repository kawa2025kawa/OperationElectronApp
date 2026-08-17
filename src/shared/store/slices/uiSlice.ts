// src/shared/store/slices/uiSlice.ts

import type { ReactNode } from "react";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";
import type { ViewMode, GlobalModalConfig } from "@shared/types/uiType";
import {
  INITIAL_INIT_STATUS,
  type InitStatus,
} from "@shared/types/initializationTypes";

type SelectedIds = Record<ViewMode, string | null>;

export interface UiSlice {
  theme: "dark" | "light";
  currentView: string;
  pendingView: string | null;
  currentMode: ViewMode;
  searchTerm: string;
  isSidebarOpen: boolean;

  /** 全体処理Overlay */
  isGlobalProcessing: boolean;
  overlayMessage: string;

  /** JC / Script実行中の対象表示 */
  processingTarget: string | null;
  isLoading: boolean;
  isInitialLoaded: boolean;
  initStatus: InitStatus;
  modalContent: ReactNode | null;
  modalConfig: GlobalModalConfig | null;
  selectedIds: SelectedIds;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setCurrentView: (view: string) => void;
  setPendingView: (view: string | null) => void;
  setMode: (mode: ViewMode) => void;
  setSearchTerm: (term: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  setGlobalProcessing: (
    isProcessing: boolean,
    message?: string,
    target?: string | null,
  ) => void;

  setIsLoading: (isLoading: boolean) => void;
  setIsInitialLoaded: (isInitialLoaded: boolean) => void;
  setInitStatus: (
    update:
      | Partial<InitStatus>
      | ((prev: InitStatus) => Partial<InitStatus> | void),
  ) => void;

  setSelectedId: (mode: ViewMode, id: string | null) => void;
  openGlobalModal: (content: ReactNode, config?: GlobalModalConfig) => void;
  closeGlobalModal: () => void;
}

export const createUiSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  UiSlice
> = (set) => ({
  theme: "dark",
  currentView: "operation",
  pendingView: null,
  currentMode: "operation",
  searchTerm: "",
  isSidebarOpen: false,
  isGlobalProcessing: false,
  overlayMessage: "",
  processingTarget: null,
  isLoading: false,
  isInitialLoaded: false,
  initStatus: INITIAL_INIT_STATUS,
  modalContent: null,
  modalConfig: null,
  selectedIds: {
    operation: null,
    irregular: null,
    today: null,
  },

  setTheme: (theme) =>
    set((state: AppState) => {
      state.theme = theme;
    }),

  toggleTheme: () =>
    set((state: AppState) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    }),

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

  setGlobalProcessing: (isProcessing, message = "", target = null) =>
    set((state: AppState) => {
      state.isGlobalProcessing = isProcessing;
      state.overlayMessage = message;
      state.processingTarget = isProcessing ? target : null;
    }),

  setIsLoading: (isLoading) =>
    set((state: AppState) => {
      state.isLoading = isLoading;
    }),

  setIsInitialLoaded: (isInitialLoaded) =>
    set((state: AppState) => {
      state.isInitialLoaded = isInitialLoaded;
    }),

  setInitStatus: (update) =>
    set((state: AppState) => {
      const next =
        typeof update === "function" ? update(state.initStatus) : update;
      if (next) {
        Object.assign(state.initStatus, next);
      }
    }),

  setSelectedId: (mode, id) =>
    set((state: AppState) => {
      state.selectedIds[mode] = id;
    }),

  openGlobalModal: (content, config) =>
    set((state: AppState) => {
      state.modalContent = content;
      state.modalConfig = config ?? null;
    }),

  closeGlobalModal: () =>
    set((state: AppState) => {
      state.modalContent = null;
      state.modalConfig = null;
    }),
});
