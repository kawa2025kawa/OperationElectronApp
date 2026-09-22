// src/shared/utils/dependency/statusCalculator.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation/operationTypes";
import { checkJobDependencies } from "@shared/utils/dependencyHelper";
import type { ScheduledTime } from "@shared/types/operation/operationTypes";

/* ============================================================================
 * Constants & Helpers
 * ========================================================================== */

/**
 * 🎯 前日実行対象（予定時刻を前日扱いで評価する）管理番号セット
 */
const PREVIOUS_DAY_KANRI_NOS = new Set<string>([
  "2",
  "3",
  "4",
  "4",
  "5",
  "6",
  "7",
]);

export interface StatusCalculationResult {
  status: JobStatus;
  comment: string;
}

/* ============================================================================
 * Main Logic
 * ========================================================================== */

/**
 * ターゲットの依存関係および予定時刻に基づき、適切なステータス（scheduled / waiting / ready）を算出
 */
export function calculateJobStatus(
  target: OperationItem,
  entities: Record<string, OperationItem>,
): StatusCalculationResult {
  // 1. 依存関係の判定
  const depResult = checkJobDependencies(target.kanriNo, entities);

  if (!depResult.ok) {
    const missingKanriNos = depResult.missingDependencies
      .map((d) => d.kanriNo)
      .join(", ");

    return {
      status: JOB_STATUS.SCHEDULED,
      comment: missingKanriNos
        ? `前提未完了 (No.${missingKanriNos})`
        : "前提未完了",
    };
  }

  // 2. 前日判定（PREVIOUS_DAY_KANRI_NOS または scheduledTime の指定）
  const { scheduledTime, kanriNo } = target;
  const cleanKanriNo = String(kanriNo ?? "").trim();
  const isPreviousDay =
    PREVIOUS_DAY_KANRI_NOS.has(cleanKanriNo) ||
    (typeof scheduledTime === "string" && scheduledTime.includes("前日"));

  // 3. 予定時刻の判定（前日対象の場合は isPreviousDay: true を渡して日付オフセット評価）
  if (
    scheduledTime &&
    scheduledTime !== "-" &&
    !isScheduledTimePassed(scheduledTime, isPreviousDay)
  ) {
    return {
      status: JOB_STATUS.WAITING,
      comment: `予定時刻待ち (${scheduledTime})`,
    };
  }

  return {
    status: JOB_STATUS.READY,
    comment: "実施可能",
  };
}

/**
 * 予定時刻を過ぎているか判定する
 *
 * @param scheduledTimeInput 予定時刻文字列（例: "23:30" や { time: "23:30" }）
 * @param isPreviousDay 前日実行ジョブの場合 true（日付を -1 オフセットして判定）
 * @param now 現在時刻（テスト用任意指定）
 */
export function isScheduledTimePassed(
  scheduledTimeInput?:
    | ScheduledTime
    | string
    | { time?: string; scheduledTime?: string }
    | null,
  isPreviousDay: boolean = false,
  now: Date = new Date(),
): boolean {
  if (!scheduledTimeInput) return true;

  // 1. 文字列 / オブジェクトから HH:mm 抽出
  let timeStr = "";
  if (typeof scheduledTimeInput === "string") {
    timeStr = scheduledTimeInput;
  } else if (typeof scheduledTimeInput === "object") {
    timeStr = scheduledTimeInput.time ?? scheduledTimeInput.scheduledTime ?? "";
  }

  const cleanTime = timeStr.replace(/[^0-9:]/g, "").trim();
  if (!cleanTime || cleanTime === "-") return true;

  const [hoursStr, minutesStr] = cleanTime.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (isNaN(hours) || isNaN(minutes)) return true;

  // 2. 比較用 Date オブジェクトを作成
  const targetDate = new Date(now);
  targetDate.setHours(hours, minutes, 0, 0);

  // 🎯 前日実行ジョブの場合は、比較対象の日時を 1 日前（-1日）に設定する
  if (isPreviousDay) {
    targetDate.setDate(targetDate.getDate() - 1);
  }

  // 3. 現在時刻が予定時刻を過ぎているか比較
  // 前日 23:30 に設定された targetDate は「昨日の 23:30」になるため、
  // 今日の現在時刻 (now) よりも確実に過去となり、true (経過済み ➔ 実施可) が返る
  return now.getTime() >= targetDate.getTime();
}
