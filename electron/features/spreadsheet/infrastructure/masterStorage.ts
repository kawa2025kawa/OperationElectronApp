// electron/features/spreadsheet/infrastructure/masterStorage.ts

import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  MasterData,
  MasterDataCache,
} from "@shared/types/spreadsheet/spreadsheetTypes";

const FILE_NAME = "master-data.json";

function getFilePath(): string {
  return path.join(app.getPath("userData"), FILE_NAME);
}

export async function loadMasterData(): Promise<MasterDataCache | null> {
  try {
    const json = await fs.readFile(getFilePath(), "utf8");
    return JSON.parse(json) as MasterDataCache;
  } catch {
    return null;
  }
}

export async function saveMasterData(data: MasterData): Promise<void> {
  const cache: MasterDataCache = {
    fetchedAt: new Date().toISOString(),
    data,
  };

  await fs.mkdir(path.dirname(getFilePath()), { recursive: true });

  await fs.writeFile(getFilePath(), JSON.stringify(cache, null, 2), "utf8");
}

export async function deleteMasterData(): Promise<void> {
  try {
    await fs.unlink(getFilePath());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
