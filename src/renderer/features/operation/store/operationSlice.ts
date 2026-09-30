// src/renderer/features/operation/store/operationSlice.ts

import type { StateCreator } from "zustand";

import type { AppState } from "@renderer/store";

export interface OperationSlice {
  operationIds: string[];
  irregularIds: string[];
  todayIds: string[];
}

export const createOperationSlice: StateCreator<
  AppState,
  [],
  [],
  OperationSlice
> = () => ({
  operationIds: [],
  irregularIds: [],
  todayIds: [],
});
