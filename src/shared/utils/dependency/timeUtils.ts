/**
 * scheduledTime (例: "06:00", "15:30") と現在時刻を比較判定
 */
export function isPastScheduledTime(scheduledTimeStr?: string | null): boolean {
  if (
    !scheduledTimeStr ||
    scheduledTimeStr === "-" ||
    scheduledTimeStr.trim() === ""
  ) {
    return true; // 時間指定なしは即時OK扱い
  }

  const now = new Date();
  const timeParts = scheduledTimeStr.trim().split(":");
  const targetHour = parseInt(timeParts[0] ?? "0", 10);
  const targetMinute = parseInt(timeParts[1] ?? "0", 10);

  const targetTime = new Date(now);
  targetTime.setHours(targetHour, targetMinute, 0, 0);

  return now.getTime() >= targetTime.getTime();
}
