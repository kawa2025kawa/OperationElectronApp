import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
  type OperationJobItem,
  type OperationStatusState,
  type ScheduledTime,
  type TrackerApiResponse,
  type TrackerApiResponseItem,
} from "@shared/types/operation/operationTypes";

const TRACKER_API_KEY = "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91";
const TRACKER_API_BASE_URL = "http://192.88.1.152/api/v2/trackers";
const DEFAULT_KANSHI_TIME: readonly [number, number] = [1, 0];

const PREVIOUS_DAY_KANRI_NOS = new Set<string>(["2", "3", "4", "5", "6", "7"]);

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

export type { TrackerApiResponse, TrackerApiResponseItem };

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getJobId(target: OperationItem): string | undefined {
  if (!("jobId" in target)) return undefined;

  const jobId = (target as OperationJobItem).jobId;

  return jobId && jobId !== "-" ? jobId : undefined;
}

function parseHHMM(
  value?: string | null,
): readonly [number, number] | null {
  if (!value) return null;

  const [h, m] = value.split(":");

  return h && m ? [Number(h), Number(m)] : null;
}

function isPreviousDayJob(
  kanriNo?: string | number | null,
  scheduledTime?: ScheduledTime | null,
): boolean {
  if (kanriNo != null) {
    const cleanNo = String(kanriNo).trim();

    if (PREVIOUS_DAY_KANRI_NOS.has(cleanNo)) {
      return true;
    }
  }

  if (scheduledTime) {
    const timeStr = String(scheduledTime).trim();

    if (timeStr.includes("前日")) {
      return true;
    }
  }

  return false;
}

export function getTargetTime(
  kanriNo?: string | number | null,
  scheduledTime?: ScheduledTime | null,
): string {
  const now = new Date();

  const [hour, minute] = parseHHMM(scheduledTime) ?? [
    now.getHours(),
    now.getMinutes(),
  ];

  const dayOffset = isPreviousDayJob(
    kanriNo,
    scheduledTime,
  )
    ? -1
    : 0;

  const trackerDate = new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + dayOffset,
      hour - 9,
      minute,
    ),
  );

  return trackerDate.toISOString();
}

export function addKanshiTime(
  fromStr: string,
  kanshiTime?: string | null,
): string {
  const date = new Date(fromStr);

  const [hours, minutes] =
    parseHHMM(kanshiTime) ?? DEFAULT_KANSHI_TIME;

  date.setUTCHours(
    date.getUTCHours() + hours,
    date.getUTCMinutes() + minutes,
  );

  return date.toISOString();
}

export function buildTrackerUrl(
  jobId: string,
  from?: string,
  to?: string,
): string {
  const params = new URLSearchParams({
    api_key: TRACKER_API_KEY,
    jobnetwork_name: jobId,
  });

  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return `${TRACKER_API_BASE_URL}?${params.toString()}`;
}

export function normalizeItem(
  item: TrackerApiResponseItem,
): OperationStatusState {
  let status: JobStatus | undefined;

  if (item.status?.length) {
    for (let i = item.status.length - 1; i >= 0; i--) {
      const mapped =
        STATUS_ALIAS_MAP[item.status[i].toLowerCase()];

      if (mapped) {
        status = mapped;
        break;
      }
    }
  }

  return {
    status,
    startTime: item.start_time ?? null,
    endTime: item.end_time ?? null,
    expectedStartTime: item.expected_start_time ?? null,
    expectedEndTime: item.expected_end_time ?? null,
    comment: item.comment ?? null,
    substatus: item.substatus?.length
      ? item.substatus.join(", ")
      : null,
    info: item.info ?? null,
  };
}

export function applyTrackerItem(
  tracker: OperationStatusState,
  base: OperationItem,
): OperationItem {
  const res = { ...base };

  if (tracker.status !== undefined) {
    res.status = tracker.status;
  }

  if (tracker.startTime !== undefined) {
    res.startTime = tracker.startTime;
  }

  if (tracker.endTime !== undefined) {
    res.endTime = tracker.endTime;
  }

  if (tracker.expectedStartTime !== undefined) {
    res.expectedStartTime = tracker.expectedStartTime;
  }

  if (tracker.expectedEndTime !== undefined) {
    res.expectedEndTime = tracker.expectedEndTime;
  }

  if (tracker.comment !== undefined) {
    res.comment = tracker.comment;
  }

  if (tracker.substatus !== undefined) {
    res.substatus = tracker.substatus;
  }

  if (tracker.info !== undefined) {
    res.info = tracker.info;
  }

  return res;
}
