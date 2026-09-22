// src/renderer/features/spreadSheet/services/mappers/domain/operationMapper.ts

import {
  JOB_STATUS,
  type ExecutionType,
  type IrregularJobItem,
  type JobDependency,
  type JobStatus,
  type LinkConfig,
  type OperationItem,
  type OperationJobItem,
  type ScheduledTime,
  type ScriptConfig,
} from "@shared/types/operation/operationTypes";

import {
  EMPTY_VALUE,
  getValue,
  parseBooleanField,
  parseRawToFlatObjects,
} from "../utils/parseUtils";

/* ============================================================================
 * Constants & Helpers
 * ========================================================================== */

const STATUS_ALIAS_MAP: Readonly<Record<string, JobStatus>> = {
  scheduled: JOB_STATUS.SCHEDULED,
  running: JOB_STATUS.RUNNING,
  run: JOB_STATUS.RUNNING,
  processing: JOB_STATUS.RUNNING,
  scriptrunning: JOB_STATUS.SCRIPT_RUNNING,
  success: JOB_STATUS.SUCCESS,
  done: JOB_STATUS.SUCCESS,
  ready: JOB_STATUS.READY,
  waiting: JOB_STATUS.WAITING,
  wait: JOB_STATUS.WAITING,
  error: JOB_STATUS.ERROR,
  failed: JOB_STATUS.ERROR,
  warning: JOB_STATUS.SUCCESS,
};

function parseStatus(rawStatus?: string | null): JobStatus {
  if (!rawStatus) return JOB_STATUS.SCHEDULED;
  const normalized = rawStatus.trim().toLowerCase();
  return STATUS_ALIAS_MAP[normalized] ?? JOB_STATUS.SCHEDULED;
}

function parseJobId(rawJobId?: string | null): string | undefined {
  if (!rawJobId) return undefined;
  const trimmed = rawJobId.trim();
  return trimmed && trimmed !== "-" && trimmed !== EMPTY_VALUE
    ? trimmed
    : undefined;
}

function parseDependency(flat: Record<string, string>): JobDependency | null {
  const dependsOnRaw = getValue(flat, ["dependsOn"], "");

  if (!dependsOnRaw) {
    return null;
  }

  const dependsOn = dependsOnRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return dependsOn.length > 0 ? { dependsOn } : null;
}

function parseLink(flat: Record<string, string>): LinkConfig[] | null {
  const linkRaw = getValue(flat, ["link"], "");

  if (!linkRaw) {
    return null;
  }

  const items = linkRaw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  const results: LinkConfig[] = [];

  for (const item of items) {
    const colonIndex = item.indexOf(":");

    if (colonIndex === -1) {
      continue;
    }

    const key = item.substring(0, colonIndex).trim();
    const url = item.substring(colonIndex + 1).trim();

    if (key && url) {
      results.push({ key, url });
    }
  }

  return results.length > 0 ? results : null;
}

function parseScripts(flat: Record<string, string>): ScriptConfig[] | null {
  const scriptsRaw = getValue(flat, ["scripts", "Scripts"], "");

  if (!scriptsRaw || scriptsRaw === EMPTY_VALUE) {
    return null;
  }

  const scriptEntries = scriptsRaw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (scriptEntries.length === 0) {
    return null;
  }

  const results: ScriptConfig[] = [];

  for (const entry of scriptEntries) {
    const colonIndex = entry.indexOf(":");

    if (colonIndex === -1) {
      continue;
    }

    const key = entry.substring(0, colonIndex).trim();
    const label = entry.substring(colonIndex + 1).trim();

    if (key && label) {
      results.push({ key, label });
    }
  }

  return results.length > 0 ? results : null;
}

function parseScheduledTime(val: unknown): ScheduledTime | null {
  if (!val) {
    return null;
  }

  let value = "";

  if (typeof val === "string") {
    value = val;
  } else if (typeof val === "object") {
    if ("time" in val && typeof (val as { time?: string }).time === "string") {
      value = (val as { time: string }).time;
    } else if (
      "scheduledTime" in val &&
      typeof (val as { scheduledTime?: string }).scheduledTime === "string"
    ) {
      value = (val as { scheduledTime: string }).scheduledTime;
    }
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "-" || trimmed === EMPTY_VALUE) {
    return null;
  }

  return trimmed;
}

function parseExecutionType(val: unknown): ExecutionType | null {
  if (!val) {
    return null;
  }

  const value = String(val).trim();

  if (!value || value === "-" || value === EMPTY_VALUE) {
    return null;
  }

  switch (value.toLowerCase()) {
    case "auto":
      return "auto";

    case "autoscript":
    case "auto_script":
      return "autoScript";

    case "manualscript":
    case "manual_script":
      return "manualScript";

    case "manual":
      return "manual";

    default:
      return value as ExecutionType;
  }
}

/* ============================================================================
 * Mapper Functions
 * ========================================================================== */

export function parseOperationSheetItem(
  flat: Record<string, string>,
): OperationItem {
  const cycle1 = getValue(flat, ["cycle1"], null);
  const cycle2 = getValue(flat, ["cycle2"], null);

  const baseItem = {
    kanriNo: getValue(flat, ["kanriNo"], ""),
    workName: getValue(flat, ["workName"], ""),

    // 🎯 入口で生文字から内部 JobStatus に直接マッピング完了
    status: parseStatus(getValue(flat, ["status", "Status"], "")),

    scheduledTime: parseScheduledTime(getValue(flat, ["scheduledTime"], null)),

    kanshiTime: getValue(flat, ["kanshiTime"], null),

    executionType: parseExecutionType(getValue(flat, ["executionType"], null)),

    manualUrl: parseBooleanField(
      getValue(flat, ["manualUrl", "ManualUrl"], ""),
    ),

    autoManualUrl: parseBooleanField(
      getValue(flat, ["autoManualUrl", "AutoManualUrl"], ""),
    ),

    link: parseLink(flat),

    other1: getValue(flat, ["other1"], null),
    other2: getValue(flat, ["other2"], null),

    scripts: parseScripts(flat),

    dependency: parseDependency(flat),
  };

  if (cycle1 || cycle2) {
    const irregularItem: IrregularJobItem = {
      ...baseItem,
      cycle1,
      cycle2,
    };

    return irregularItem;
  }

  const operationItem: OperationJobItem = {
    ...baseItem,
    jobId: parseJobId(getValue(flat, ["jobId"], "")),
  };

  return operationItem;
}

export function parseOperationMasterSheet(
  rawRows: string[][],
): OperationItem[] {
  const flatRows = parseRawToFlatObjects(rawRows);

  const filteredRows = flatRows.filter((flat) => {
    const kanriNo = getValue(flat, ["kanriNo"], "");
    return Boolean(kanriNo);
  });

  return filteredRows.map(parseOperationSheetItem);
}
