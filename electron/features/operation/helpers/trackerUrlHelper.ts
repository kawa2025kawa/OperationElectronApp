// electron/features/operation/helpers/trackerUrlHelper.ts

const TRACKER_API_KEY = "71e7f0bcc0f995c1d2d322cbdde23543a5be8f91";
const TRACKER_API_BASE_URL = "http://192.88.1.152/api/v2/trackers";
const DEFAULT_KANSHI_TIME_HOURS = 1;

const PREVIOUS_DAY_JOB_PATTERNS = [
  "NMA8510",
  "NMA8101",
  "NMA8300",
  "BENIF7000_",
  "NSI8010",
  "BENMSEXP_",
] as const;

function formatTrackerDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}Z`;
}

function createScheduledDate(scheduledTime?: string | null): Date {
  const date = new Date();
  if (!scheduledTime?.trim()) {
    date.setSeconds(0, 0);
    return date;
  }
  const [hour, minute] = scheduledTime.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    date.setSeconds(0, 0);
    return date;
  }
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function isPreviousDayJob(jobId: string): boolean {
  return PREVIOUS_DAY_JOB_PATTERNS.some(
    (pattern) => jobId === pattern || jobId.startsWith(pattern),
  );
}

export function getTargetTime(
  jobId: string,
  scheduledTime?: string | null,
): string {
  const date = createScheduledDate(scheduledTime);
  if (isPreviousDayJob(jobId)) {
    date.setDate(date.getDate() - 1);
  }
  return formatTrackerDate(date);
}

export function addKanshiTime(
  fromStr: string,
  kanshiTime?: string | null,
): string {
  const date = new Date(fromStr);
  if (!kanshiTime?.trim()) {
    date.setHours(date.getHours() + DEFAULT_KANSHI_TIME_HOURS);
    return formatTrackerDate(date);
  }
  const [hour, minute] = kanshiTime.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    date.setHours(date.getHours() + DEFAULT_KANSHI_TIME_HOURS);
    return formatTrackerDate(date);
  }
  date.setHours(date.getHours() + hour);
  date.setMinutes(date.getMinutes() + minute);
  return formatTrackerDate(date);
}

export function buildTrackerUrl(
  jobId: string,
  from: string,
  to: string,
): string {
  const encodedJobId = encodeURIComponent(jobId);
  return `${TRACKER_API_BASE_URL}?api_key=${TRACKER_API_KEY}&jobnetwork_name=${encodedJobId}&from=${from}&to=${to}`;
}

export function buildFallbackTrackerUrl(jobId: string): string {
  const encodedJobId = encodeURIComponent(jobId);
  return `${TRACKER_API_BASE_URL}?api_key=${TRACKER_API_KEY}&jobnetwork_name=${encodedJobId}`;
}
