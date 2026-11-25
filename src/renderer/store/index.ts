// src/renderer/store/index.ts

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createAuthSlice, type AuthSlice } from "./slices/authSlice";
import { createInitSlice, type InitSlice } from "./slices/initSlice";
import {
  createNavigationSlice,
  type NavigationSlice,
} from "./slices/navigationSlice";
import {
  createOperationStatusSlice,
  type OperationStatusSlice,
} from "./slices/operationStatusSlice";
import {
  createSpreadSheetSlice,
  type SpreadSheetSlice,
} from "./slices/spreadsheetSlice";
import {
  createStatusSummarySlice,
  type StatusSummarySlice,
} from "./slices/statusSummarySlice";
import { createUiStateSlice, type UiStateSlice } from "./slices/uiStateSlice";

export type AppState = AuthSlice &
  StatusSummarySlice &
  OperationStatusSlice &
  SpreadSheetSlice &
  NavigationSlice &
  InitSlice &
  UiStateSlice;

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((...args) => ({
      ...createAuthSlice(...args),
      ...createStatusSummarySlice(...args),
      ...createOperationStatusSlice(...args),
      ...createSpreadSheetSlice(...args),
      ...createNavigationSlice(...args),
      ...createInitSlice(...args),
      ...createUiStateSlice(...args),
    })),
  ),
);

if (import.meta.env.DEV) {
  Object.assign(window, { useAppStore });
}
