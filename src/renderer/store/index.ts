// src/renderer/store/index.ts

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ============================================================================
// Feature Slices
// ============================================================================

import {
  createAuthSlice,
  type AuthSlice,
} from "@renderer/features/auth/store/authSlice";

import {
  createOperationSlice,
  type OperationSlice,
} from "@renderer/features/operation/store/operationSlice";

import {
  createPdfUploadSlice,
  type PdfUploadSlice,
} from "@renderer/features/other/store/pdfUploadSlice";

import {
  createRdpSlice,
  type RdpSlice,
} from "@renderer/features/remoteDesktop/store/rdpSlice";

import {
  createSpreadSheetSlice,
  type SpreadSheetSlice,
} from "@renderer/features/spreadSheet/store/spreadsheetSlice";

// ============================================================================
// Global Slices
// ============================================================================

import { createCenterSlice, type CenterSlice } from "./slices/centerSlice";

import { createInitSlice, type InitSlice } from "./slices/initSlice";

import { createModalSlice, type ModalSlice } from "./slices/modalSlice";

import {
  createNavigationSlice,
  type NavigationSlice,
} from "./slices/navigationSlice";

import { createOverlaySlice, type OverlaySlice } from "./slices/overlaySlice";

import { createPollingSlice, type PollingSlice } from "./slices/pollingSlice";

import { createThemeSlice, type ThemeSlice } from "./slices/themeSlice";

// ============================================================================
// App State
// ============================================================================

export type AppState = AuthSlice &
  OperationSlice &
  RdpSlice &
  SpreadSheetSlice &
  ThemeSlice &
  NavigationSlice &
  OverlaySlice &
  ModalSlice &
  InitSlice &
  PdfUploadSlice &
  PollingSlice &
  CenterSlice;

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((...args) => ({
      ...createAuthSlice(...args),
      ...createOperationSlice(...args),
      ...createRdpSlice(...args),
      ...createSpreadSheetSlice(...args),
      ...createThemeSlice(...args),
      ...createNavigationSlice(...args),
      ...createOverlaySlice(...args),
      ...createModalSlice(...args),
      ...createInitSlice(...args),
      ...createPdfUploadSlice(...args),
      ...createPollingSlice(...args),
      ...createCenterSlice(...args),
    })),
  ),
);
