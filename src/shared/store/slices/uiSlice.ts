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

  /**
   * 全体処理Overlay
   */
  isGlobalProcessing: boolean;
  overlayMessage: string;

  /**
   * JC / Script実行中の対象表示
   */
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

  /**
   * 処理Overlay制御
   *
   * target:
   * JC / Script等、処理対象を表示する場合に渡す
   */
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

  initStatus: {
    ...INITIAL_INIT_STATUS,
  },

  modalContent: null,
  modalConfig: null,

  selectedIds: {
    operation: null,
    irregular: null,
    today: null,
  },

  setTheme: (theme) =>
    set((state) => {
      state.theme = theme;
    }),

  toggleTheme: () =>
    set((state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    }),

  setCurrentView: (view) =>
    set((state) => {
      state.currentView = view;
    }),

  setPendingView: (view) =>
    set((state) => {
      state.pendingView = view;
    }),

  setMode: (mode) =>
    set((state) => {
      state.currentMode = mode;
    }),

  setSearchTerm: (term) =>
    set((state) => {
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

  setGlobalProcessing: (isProcessing, message = "", target = null) =>
    set((state) => {
      state.isGlobalProcessing = isProcessing;
      state.overlayMessage = message;
      state.processingTarget = isProcessing ? target : null;
    }),

  setIsLoading: (isLoading) =>
    set((state) => {
      state.isLoading = isLoading;
    }),

  setIsInitialLoaded: (isInitialLoaded) =>
    set((state) => {
      state.isInitialLoaded = isInitialLoaded;
    }),

  setInitStatus: (update) =>
    set((state) => {
      if (typeof update === "function") {
        const result = update(state.initStatus);

        if (result) {
          Object.assign(state.initStatus, result);
        }

        return;
      }

      Object.assign(state.initStatus, update);
    }),

  setSelectedId: (mode, id) =>
    set((state) => {
      state.selectedIds[mode] = id;
    }),

  openGlobalModal: (content, config) =>
    set({
      modalContent: content,
      modalConfig: config ?? null,
    }),

  closeGlobalModal: () =>
    set({
      modalContent: null,
      modalConfig: null,
    }),
});
