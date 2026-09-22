import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationItem,
  type ScheduledTime,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  normalizeDependencies,
} from "@shared/utils/dependencyHelper";

/**
 * 前日実行対象（予定時刻を前日扱いで評価する）管理番号セット
 */
const PREVIOUS_DAY_KANRI_NOS = new Set<string>([
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
]);

export interface StatusCalculationResult {
  status: JobStatus;
  comment: string;
}

function normalizeKanriNo(
  kanriNo?: string | number | null,
): string {
  if (kanriNo == null) return "";

  const str = String(kanriNo).trim();

  return str.replace(/^0+/, "") || str;
}

/**
 * 業務ルール:
 *
 * 依存なし:
 *   scheduleTime前 → SCHEDULED（予定）
 *   scheduleTime後 → READY（実施可能）
 *
 * 依存あり:
 *   依存未完了 → WAITING（待合）
 *   依存完了 + scheduleTime前 → WAITING（待合）
 *   依存完了 + scheduleTime後 → READY（実施可能）
 */
export function calculateJobStatus(
  target: OperationItem,
  entities: Record<string, OperationItem>,
  activeFlags?: ActiveFlags,
): StatusCalculationResult {
  const cleanKanriNo = normalizeKanriNo(
    target.kanriNo,
  );

  const scheduledTimeStr = String(
    target.scheduledTime ?? "",
  ).trim();

  const isPreviousDay =
    PREVIOUS_DAY_KANRI_NOS.has(cleanKanriNo) ||
    scheduledTimeStr.includes("前日");

  /*
   * dependsOn を正規化して、
   * 実際に依存先が存在する場合だけ「依存あり」とする。
   *
   * undefined / null / "" / "-" / [] は依存なし。
   */
  const dependencies = normalizeDependencies(
    target.dependency?.dependsOn,
  );

  const hasDependencies =
    dependencies.length > 0;

  /*
   * 依存なしの場合は依存チェックを行わない。
   *
   * 予定時刻前 → 予定
   * 予定時刻到達 → 実施可能
   */
  if (!hasDependencies) {
    if (
      target.scheduledTime &&
      target.scheduledTime !== "-" &&
      target.scheduledTime !== "ー" &&
      !isScheduledTimePassed(
        target.scheduledTime,
        isPreviousDay,
      )
    ) {
      return {
        status: JOB_STATUS.SCHEDULED,
        comment: "予定",
      };
    }

    return {
      status: JOB_STATUS.READY,
      comment: "実施可能",
    };
  }

  /*
   * ここから先は「実際に依存先がある」場合のみ。
   */
  const depResult = checkJobDependencies(
    target.kanriNo,
    entities,
    activeFlags,
    Object.keys(entities),
  );

  /*
   * 依存あり + 依存未完了
   */
  if (!depResult.ok) {
    const missingKanriNos =
      depResult.missingDependencies
        .map((d) => d.kanriNo)
        .join(", ");

    return {
      status: JOB_STATUS.WAITING,
      comment: missingKanriNos
        ? `前提未完了 (No.${missingKanriNos})`
        : "前提未完了",
    };
  }

  /*
   * 依存あり + 依存完了 + scheduleTime前
   */
  if (
    target.scheduledTime &&
    target.scheduledTime !== "-" &&
    target.scheduledTime !== "ー" &&
    !isScheduledTimePassed(
      target.scheduledTime,
      isPreviousDay,
    )
  ) {
    return {
      status: JOB_STATUS.WAITING,
      comment: `予定時刻待ち (${scheduledTimeStr})`,
    };
  }

  /*
   * 依存あり + 依存完了 + scheduleTime到達
   */
  return {
    status: JOB_STATUS.READY,
    comment: "実施可能",
  };
}

export function isScheduledTimePassed(
  scheduledTimeInput?: ScheduledTime | string | null,
  isPreviousDay: boolean = false,
  now: Date = new Date(),
): boolean {
  if (!scheduledTimeInput) return true;

  const timeStr = String(
    scheduledTimeInput,
  ).trim();

  if (
    !timeStr ||
    timeStr === "-" ||
    timeStr === "ー"
  ) {
    return true;
  }

  const match = timeStr.match(
    /(\d{1,2})\s*:\s*(\d{1,2})/,
  );

  if (!match) return true;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (isNaN(hours) || isNaN(minutes)) {
    return true;
  }

  const targetDate = new Date(now);

  targetDate.setHours(
    hours,
    minutes,
    0,
    0,
  );

  if (isPreviousDay) {
    targetDate.setDate(
      targetDate.getDate() - 1,
    );
  }

  return (
    now.getTime() >=
    targetDate.getTime()
  );
}
