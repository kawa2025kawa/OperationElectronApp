// src/shared/store/slices/uiSlice.ts
import type { ReactNode } from "react";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";
import type { ViewMode, GlobalModalConfig } from "@shared/types/uiType";
import { INITIAL_INIT_STATUS, type InitStatus } from "@shared/types/initializationTypes";

export interface UiSlice {
  theme: "dark" | "light";
  currentView: string;
  pendingView: string | null;
  currentMode: ViewMode;
  searchTerm: string;
  isSidebarOpen: boolean;
  isGlobalProcessing: boolean;
  isLoading: boolean;
  isInitialLoaded: boolean;
  overlayMessage: string;

  initStatus: InitStatus;

  // モーダル状態
  modalContent: ReactNode | null;
  modalConfig: GlobalModalConfig | null;

  // 選択ID（UI状態）
  selectedOperationId: string | null;
  selectedIrregularId: string | null;

  // Actions
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setCurrentView: (view: string) => void;
  setPendingView: (view: string | null) => void;
  setMode: (mode: ViewMode) => void;
  setSearchTerm: (term: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setGlobalProcessing: (isProcessing: boolean, message?: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsInitialLoaded: (isInitialLoaded: boolean) => void;
  setInitStatus: (
    update: Partial<InitStatus> | ((prev: InitStatus) => Partial<InitStatus> | void),
  ) => void;
  setSelectedOperationId: (id: string | null) => void;
  setSelectedIrregularId: (id: string | null) => void;

  openGlobalModal: (content: ReactNode, config?: GlobalModalConfig) => void;
  closeGlobalModal: () => void;
}

export const createUiSlice: StateCreator<AppState, [["zustand/immer", never]], [], UiSlice> = (
  set,
) => ({
  theme: "dark",
  currentView: "operation",
  pendingView: null,
  currentMode: "operation",
  searchTerm: "",
  isSidebarOpen: false,
  isGlobalProcessing: false,
  isLoading: false,
  isInitialLoaded: false,
  overlayMessage: "",

  initStatus: { ...INITIAL_INIT_STATUS },

  modalContent: null,
  modalConfig: null,

  selectedOperationId: null,
  selectedIrregularId: null,

  setTheme: (theme: "dark" | "light") =>
    set((s: AppState) => {
      s.theme = theme;
    }),

  toggleTheme: () =>
    set((s: AppState) => {
      s.theme = s.theme === "dark" ? "light" : "dark";
    }),

  setCurrentView: (view: string) =>
    set((s: AppState) => {
      s.currentView = view;
    }),

  setPendingView: (view: string | null) =>
    set((s: AppState) => {
      s.pendingView = view;
    }),

  setMode: (mode: ViewMode) =>
    set((s: AppState) => {
      s.currentMode = mode;
      s.selectedOperationId = null;
      s.selectedIrregularId = null;
    }),

  setSearchTerm: (term: string) =>
    set((s: AppState) => {
      s.searchTerm = term;
    }),

  toggleSidebar: () =>
    set((s: AppState) => {
      s.isSidebarOpen = !s.isSidebarOpen;
    }),

  setSidebarOpen: (open: boolean) =>
    set((s: AppState) => {
      s.isSidebarOpen = open;
    }),

  setGlobalProcessing: (isProcessing: boolean, message: string = "") =>
    set((s: AppState) => {
      s.isGlobalProcessing = isProcessing;
      s.overlayMessage = message;
    }),

  setIsLoading: (isLoading: boolean) =>
    set((s: AppState) => {
      s.isLoading = isLoading;
    }),

  setIsInitialLoaded: (isInitialLoaded: boolean) =>
    set((s: AppState) => {
      s.isInitialLoaded = isInitialLoaded;
    }),

  setInitStatus: (
    update: Partial<InitStatus> | ((prev: InitStatus) => Partial<InitStatus> | void),
  ) =>
    set((s: AppState) => {
      if (typeof update === "function") {
        const res = update(s.initStatus);
        if (res) {
          Object.assign(s.initStatus, res);
        }
      } else {
        Object.assign(s.initStatus, update);
      }
    }),

  setSelectedOperationId: (id: string | null) =>
    set((s: AppState) => {
      s.selectedOperationId = id;
    }),

  setSelectedIrregularId: (id: string | null) =>
    set((s: AppState) => {
      s.selectedIrregularId = id;
    }),

  openGlobalModal: (content: ReactNode, config?: GlobalModalConfig) =>
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
