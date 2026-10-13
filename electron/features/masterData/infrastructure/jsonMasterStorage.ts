// electron/features/masterData/infrastructure/jsonMasterStorage.ts

import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  JsonMasterData,
  JsonMasterDataCache,
} from "@shared/types/masterData/jsonMasterDataTypes";

const FILE_NAME = "json-master-data.json";
const CACHE_VERSION = 1;

interface VersionedJsonMasterDataCache extends JsonMasterDataCache {
  version: number;
}

function getFilePath(): string {
  return path.join(app.getPath("userData"), FILE_NAME);
}

function isJsonMasterData(value: unknown): value is JsonMasterData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    Array.isArray(data.operations) &&
    Array.isArray(data.irregulars) &&
    Array.isArray(data.todayIrregulars) &&
    Array.isArray(data.rdps)
  );
}

export async function loadJsonMasterDataCache(): Promise<JsonMasterDataCache | null> {
  try {
    const json = await fs.readFile(getFilePath(), "utf8");
    const parsed: unknown = JSON.parse(json);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const cache = parsed as Record<string, unknown>;

    if (
      cache.version !== CACHE_VERSION ||
      typeof cache.fetchedAt !== "string" ||
      !isJsonMasterData(cache.data)
    ) {
      return null;
    }

    return {
      fetchedAt: cache.fetchedAt,
      data: cache.data,
    };
  } catch {
    return null;
  }
}

export async function saveJsonMasterDataCache(
  data: JsonMasterData,
): Promise<void> {
  const filePath = getFilePath();

  const cache: VersionedJsonMasterDataCache = {
    version: CACHE_VERSION,
    fetchedAt: new Date().toISOString(),
    data,
  };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2), "utf8");
}

export async function deleteJsonMasterDataCache(): Promise<void> {
  try {
    await fs.unlink(getFilePath());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
