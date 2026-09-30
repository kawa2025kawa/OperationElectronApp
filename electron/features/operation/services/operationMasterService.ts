// electron/features/operation/services/operationMasterService.ts

import {
  getTodayString,
  loadCache,
  saveCache,
} from "@electron/shared/cache/fileCache";
import type {
  OperationMasterCache,
  OperationMasterData,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { DependencyMasters } from "@shared/utils/dependency/dependencyUtils";

const CACHE_FILE_NAME = "operationMaster.cache.json";

let masterData: OperationMasterData = {
  operations: [],
  irregulars: [],
  todayIrregulars: [],
};

export function loadMasterCache(): OperationMasterCache | null {
  const cache = loadCache<unknown>(CACHE_FILE_NAME);

  if (!isOperationMasterCache(cache)) {
    return null;
  }

  setOperationMasterData(cache);

  return cache;
}

export function getOperationMasterData(): OperationMasterData {
  return {
    operations: [...masterData.operations],
    irregulars: [...masterData.irregulars],
    todayIrregulars: [...masterData.todayIrregulars],
  };
}

export function getDependencyMasters(): DependencyMasters {
  return {
    operationMasters: masterData.operations,
    irregularMasters: masterData.irregulars,
    todayIrregularMasters: masterData.todayIrregulars,
  };
}

function setOperationMasterData(data: OperationMasterData): void {
  masterData = {
    operations: [...data.operations],
    irregulars: [...data.irregulars],
    todayIrregulars: [...data.todayIrregulars],
  };
}

export function saveMasterCache(data: OperationMasterData): void {
  saveCache<OperationMasterCache>(CACHE_FILE_NAME, {
    fetchedDate: getTodayString(),
    ...data,
  });

  setOperationMasterData(data);
}

function isOperationMasterCache(value: unknown): value is OperationMasterCache {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.fetchedDate === "string" &&
    Array.isArray(data.operations) &&
    Array.isArray(data.irregulars) &&
    Array.isArray(data.todayIrregulars)
  );
}
