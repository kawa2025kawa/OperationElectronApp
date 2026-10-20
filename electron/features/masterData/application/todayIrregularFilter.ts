// electron/features/masterData/application/todayIrregularFilter.ts

import type {
  IrregularMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";

// CSVなどのレコードのキーと文字列値を正規化する。
function normalizeRecord(record: IrregularMaster): IrregularMaster {
  const normalized: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(record)) {
    const key = rawKey.replace(/^\uFEFF/, "").trim();
    normalized[key] = typeof value === "string" ? value.trim() : value;
  }

  return normalized as unknown as IrregularMaster;
}

// 指定日時から日本時間の年月日・曜日・月末日を取得する。
function getJstDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));

  const weekdayMap: Record<string, string> = {
    Mon: "月",
    Tue: "火",
    Wed: "水",
    Thu: "木",
    Fri: "金",
    Sat: "土",
    Sun: "日",
  };

  return {
    month,
    day,
    weekday: weekdayMap[getPart("weekday")] ?? "",
    lastDay: new Date(Date.UTC(year, month, 0)).getUTCDate(),
  };
}

// 周期指定が月日・週・曜日・奇数月・偶数月などの条件に一致するか判定する。
function matchesCycle(cycleValue: string, now: Date): boolean {
  const today = getJstDateParts(now);

  const rules = cycleValue
    .split(/[,，、]/)
    .map((rule) => rule.trim())
    .filter(Boolean);

  return rules.some((rule) => {
    if (/^(月末|末日)$/.test(rule)) {
      return today.day === today.lastDay;
    }

    if (rule === "奇数月") {
      return today.month % 2 === 1;
    }

    if (rule === "偶数月") {
      return today.month % 2 === 0;
    }

    const monthDay = rule.match(/^(\d{1,2})\/(\d{1,2})$/);

    if (monthDay) {
      return (
        today.month === Number(monthDay[1]) && today.day === Number(monthDay[2])
      );
    }

    const week = rule.match(/^第([1-5])週$/);

    if (week) {
      return Math.ceil(today.day / 7) === Number(week[1]);
    }

    const weekday = rule.match(/^([月火水木金土日])(?:曜日?)?$/);

    if (weekday) {
      return today.weekday === weekday[1];
    }

    const day = rule.match(/^(\d{1,2})日?$/);

    if (day) {
      return today.day === Number(day[1]);
    }

    return false;
  });
}

// 予定時刻を並べ替え用の数値に変換し、AM・PMや不正値も区別する。
function getScheduledTimeRank(value: string): number {
  const time = value.trim().toUpperCase();

  if (time === "AM") return 1440;
  if (time === "PM") return 2880;

  const match = time.match(/^(\d{1,2}):(\d{2})$/);

  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours <= 23 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }

  return 9999;
}

// 不定期運用データから当日の対象レコードを抽出し、予定時刻順に並べる。
export function buildTodayIrregulars(
  source: IrregularMaster[],
  now: Date = new Date(),
): TodayIrregularMaster[] {
  return source
    .map(normalizeRecord)
    .filter((item) => {
      const kanriNo = String(item.kanriNo ?? "").trim();
      const workName = String(item.workName ?? "").trim();
      const cycle = String(item.cycle ?? "").trim();

      return (
        kanriNo !== "" &&
        workName !== "" &&
        cycle !== "" &&
        matchesCycle(cycle, now)
      );
    })
    .sort(
      (a, b) =>
        getScheduledTimeRank(String(a.scheduledTime ?? "")) -
        getScheduledTimeRank(String(b.scheduledTime ?? "")),
    ) as TodayIrregularMaster[];
}
