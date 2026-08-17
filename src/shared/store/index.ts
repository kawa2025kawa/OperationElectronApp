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
import { createUiSlice, type UiSlice } from "@shared/store/slices/uiSlice";
import {
  createPdfUploadSlice,
  type PdfUploadSlice,
} from "@shared/store/slices/pdfUploadSlice";
// 🎯 追加: PollingSlice のインポート
import {
  createPollingSlice,
  type PollingSlice,
} from "@shared/store/slices/pollingSlice";

import { createCenterSlice, type CenterSlice } from "./slices/centerSlice";

export type AppState = AuthSlice &
  OperationSlice &
  RdpSlice &
  SpreadSheetSlice &
  UiSlice &
  PdfUploadSlice &
  PollingSlice &
  CenterSlice; // 🎯 CenterSlice を追加

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((...a) => ({
      ...createAuthSlice(...a),
      ...createOperationSlice(...a),
      ...createRdpSlice(...a),
      ...createSpreadSheetSlice(...a),
      ...createUiSlice(...a),
      ...createPdfUploadSlice(...a),
      ...createPollingSlice(...a),
      ...createCenterSlice(...a), // 🎯 Slice の展開
    })),
  ),
);
