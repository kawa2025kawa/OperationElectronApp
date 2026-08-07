// src/shared/store/index.ts

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createAuthSlice, type AuthSlice } from "@shared/store/slices/authSlice";
import { createUiSlice, type UiSlice } from "@shared/store/slices/uiSlice";
import { createPollingSlice, type PollingSlice } from "@shared/store/slices/pollingSlice";
import { createOperationSlice, type OperationSlice } from "@shared/store/slices/operationSlice";
import {
  createSpreadSheetSlice,
  type SpreadSheetSlice,
} from "@shared/store/slices/spreadsheetSlice";
import { createRdpSlice, type RdpSlice } from "@shared/store/slices/rdpSlice";
import { createCenterSlice, type CenterSlice } from "@shared/store/slices/centerSlice";
import { createPdfUploadSlice, type PdfUploadSlice } from "@shared/store/slices/pdfUploadSlice";

export type AppState = AuthSlice &
  UiSlice &
  PollingSlice &
  OperationSlice &
  SpreadSheetSlice &
  RdpSlice &
  CenterSlice &
  PdfUploadSlice;

export const useAppStore = create<AppState>()(
  immer((...a) => ({
    ...createAuthSlice(...a),
    ...createUiSlice(...a),
    ...createPollingSlice(...a),
    ...createOperationSlice(...a),
    ...createSpreadSheetSlice(...a),
    ...createRdpSlice(...a),
    ...createCenterSlice(...a),
    ...createPdfUploadSlice(...a),
  })),
);
