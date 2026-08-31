// src/renderer/store/index.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";

import {
  createAuthSlice,
  type AuthSlice,
} from "@renderer/features/auth/store/authSlice";
import {
  createOperationSlice,
  type OperationSlice,
} from "@renderer/features/operation/store/operationSlice";
import {
  createRdpSlice,
  type RdpSlice,
} from "@renderer/features/remoteDesktop/store/rdpSlice";
import {
  createSpreadSheetSlice,
  type SpreadSheetSlice,
} from "@renderer/features/spreadSheet/store/spreadsheetSlice";
import {
  createPdfUploadSlice,
  type PdfUploadSlice,
} from "@renderer/features/other/store/pdfUploadSlice";
import {
  createPollingSlice,
  type PollingSlice,
} from "@renderer/features/operation/store/pollingSlice";

// Renderer?????Slice
import { createThemeSlice, type ThemeSlice } from "./slices/themeSlice";
import {
  createNavigationSlice,
  type NavigationSlice,
} from "./slices/navigationSlice";
import { createOverlaySlice, type OverlaySlice } from "./slices/overlaySlice";
import { createModalSlice, type ModalSlice } from "./slices/modalSlice";
import { createInitSlice, type InitSlice } from "./slices/initSlice";
import { createCenterSlice, type CenterSlice } from "./slices/centerSlice";

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

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((...a) => ({
      ...createAuthSlice(...a),
      ...createOperationSlice(...a),
      ...createRdpSlice(...a),
      ...createSpreadSheetSlice(...a),
      ...createThemeSlice(...a),
      ...createNavigationSlice(...a),
      ...createOverlaySlice(...a),
      ...createModalSlice(...a),
      ...createInitSlice(...a),
      ...createPdfUploadSlice(...a),
      ...createPollingSlice(...a),
      ...createCenterSlice(...a),
    })),
  ),
);
