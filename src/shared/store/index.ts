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

// 🎯 uiSlice の代わりに分割した 5 つの Slice をインポート
import {
  createThemeSlice,
  type ThemeSlice,
} from "@shared/store/slices/themeSlice";
import {
  createNavigationSlice,
  type NavigationSlice,
} from "@shared/store/slices/navigationSlice";
import {
  createOverlaySlice,
  type OverlaySlice,
} from "@shared/store/slices/overlaySlice";
import {
  createModalSlice,
  type ModalSlice,
} from "@shared/store/slices/modalSlice";
import {
  createInitSlice,
  type InitSlice,
} from "@shared/store/slices/initSlice";

import {
  createPdfUploadSlice,
  type PdfUploadSlice,
} from "@shared/store/slices/pdfUploadSlice";
import {
  createPollingSlice,
  type PollingSlice,
} from "@shared/store/slices/pollingSlice";
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
      // 🎯 分割した Slice を展開
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
