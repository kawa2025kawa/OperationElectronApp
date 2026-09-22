import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { OperationItem } from "@shared/types/operation/operationTypes";

export interface OperationMasterCache {
  fetchedDate: string;
  operations: OperationItem[];
  irregulars: OperationItem[];
  todayIrregulars: OperationItem[];
}

type OperationMasterData = Omit<OperationMasterCache, "fetchedDate">;

const CACHE_FILE_NAME = "operationMaster.cache.json";
const CACHE_FILE_PATH = path.join(app.getPath("userData"), CACHE_FILE_NAME);

export function getTodayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function loadMasterCache(): OperationMasterCache | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return data && typeof data.fetchedDate === "string" ? data : null;
  } catch {
    return null;
  }
}

export function saveMasterCache(data: OperationMasterData): void {
  const cache: OperationMasterCache = {
    fetchedDate: getTodayString(),
    ...data,
  };

  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch (error) {
    console.error("[MasterService] Failed to save cache file:", error);
  }
}

export function isTodayCacheAvailable(): boolean {
  return loadMasterCache()?.fetchedDate === getTodayString();
}
