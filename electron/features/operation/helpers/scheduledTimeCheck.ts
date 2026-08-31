// electron\features\operation\helpers\scheduledTimeCheck.ts
import { isPreviousDayJob } from "@electron/features/operation/helpers/trackerUrlHelper";

export function isScheduledTimePassed(
  scheduledTimeStr?: string | null,
  jobId?: string,
  now = new Date(),
): boolean {
  if (!scheduledTimeStr?.trim()) {
    return true; // 指定なしは時刻経過済み扱い
  }

  const str = scheduledTimeStr.trim().toUpperCase();

  // "AM" 指定 (00:00)
  if (str === "AM") {
    const amStart = new Date(now);
    amStart.setHours(0, 0, 0, 0);
    if (jobId && isPreviousDayJob(jobId)) {
      amStart.setDate(amStart.getDate() - 1);
    }
    return now >= amStart;
  }

  if (str === "PM") {
    const pmStart = new Date(now);
    pmStart.setHours(12, 0, 0, 0);
    const passed = now >= pmStart;
    console.log(
      `[DEV Check] scheduledTime: ${scheduledTimeStr}, now: ${now.toLocaleTimeString()}, passed: ${passed}`,
    );
    return passed;
  }

  // "PM" 指定 (12:00)
  if (str === "PM") {
    const pmStart = new Date(now);
    pmStart.setHours(12, 0, 0, 0);
    if (jobId && isPreviousDayJob(jobId)) {
      pmStart.setDate(pmStart.getDate() - 1);
    }
    return now >= pmStart;
  }

  // 時刻指定 ("09:00", "PM 2:00" など)
  const isPM = str.includes("PM");
  const isAM = str.includes("AM");
  const timeOnly = str.replace(/[A-Z\s]/g, "");
  const [hourStr, minuteStr] = timeOnly.split(":");
  let hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return false; // パース失敗時は未到来扱い
  }

  if (isPM && hour < 12) hour += 12;
  else if (isAM && hour === 12) hour = 0;

  const scheduledDate = new Date(now);
  scheduledDate.setHours(hour, minute, 0, 0);

  if (jobId && isPreviousDayJob(jobId)) {
    scheduledDate.setDate(scheduledDate.getDate() - 1);
  }

  return now >= scheduledDate;
}
