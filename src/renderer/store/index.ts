// src/renderer/store/index.ts

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ============================================================================
// Slices
// ============================================================================

import { createAuthSlice, type AuthSlice } from "./slices/authSlice";
import {
  createOperationStatusSlice,
  type OperationStatusSlice,
} from "./slices/operationStatusSlice";
import {
  createStatusSummarySlice,
  type StatusSummarySlice,
} from "./slices/statusSummarySlice";
import { createPollingSlice, type PollingSlice } from "./slices/pollingSlice";
import { createCenterSlice, type CenterSlice } from "./slices/centerSlice";
import {
  createSpreadSheetSlice,
  type SpreadSheetSlice,
} from "./slices/spreadsheetSlice";
import { createInitSlice, type InitSlice } from "./slices/initSlice";
import { createModalSlice, type ModalSlice } from "./slices/modalSlice";
import {
  createNavigationSlice,
  type NavigationSlice,
} from "./slices/navigationSlice";
import { createOverlaySlice, type OverlaySlice } from "./slices/overlaySlice";

// ============================================================================
// App State
// ============================================================================

export type AppState = AuthSlice &
  StatusSummarySlice &
  OperationStatusSlice &
  PollingSlice &
  SpreadSheetSlice &
  NavigationSlice &
  OverlaySlice &
  ModalSlice &
  InitSlice &
  CenterSlice;

// ============================================================================
// Store
// ============================================================================

// アプリケーション全体のグローバルステートを管理する Zustand ストアを生成・公開する。
export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((...args) => ({
      // Domain Slices
      ...createAuthSlice(...args),
      ...createStatusSummarySlice(...args),
      ...createOperationStatusSlice(...args),
      ...createPollingSlice(...args),
      ...createSpreadSheetSlice(...args),
      ...createCenterSlice(...args),

      // UI / Global Slices
      ...createNavigationSlice(...args),
      ...createOverlaySlice(...args),
      ...createModalSlice(...args),
      ...createInitSlice(...args),
    })),
  ),
);

if (import.meta.env.DEV) {
  Object.assign(window, { useAppStore });
}