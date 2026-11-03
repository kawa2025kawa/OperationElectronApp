// electron/features/masterData/application/todayIrregularFilter.ts

import type {
  IrregularMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import { getJstDateParts } from "./jstDate";

type JstDateParts = ReturnType<typeof getJstDateParts>;

// 周期指定が月日・週・曜日などの条件に一致するか判定する。
function matchesCycle(cycleValue: string, today: JstDateParts): boolean {
  return cycleValue.split(/[,，、]/).some((rawRule) => {
    const rule = rawRule.trim();

    if (rule === "") {
      return false;
    }

    if (/^(月末|末日)$/.test(rule)) {
      return today.day === today.lastDay;
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
function getScheduledTimeRank(value: unknown): number {
  const time = String(value ?? "")
    .trim()
    .toUpperCase();

  if (time === "AM") {
    return 1440;
  }

  if (time === "PM") {
    return 2880;
  }

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
  const today = getJstDateParts(now);

  return source
    .filter((item) => {
      const kanriNo = String(item.kanriNo ?? "").trim();
      const workName = String(item.workName ?? "").trim();
      const cycle = String(item.cycle ?? "").trim();
      const cycle2 = String(item.cycle2 ?? "").trim();

      if (kanriNo === "" || workName === "") {
        return false;
      }

      // E16 かつ cycle2 が 1 の場合：四半期末月（3, 6, 9, 12月）の 1日 のみ抽出対象
      if (kanriNo === "E16" && cycle2 === "1") {
        return today.month % 3 === 0 && today.day === 1;
      }

      return cycle !== "" && matchesCycle(cycle, today);
    })
    .map((item) => ({
      item,
      timeRank: getScheduledTimeRank(item.scheduledTime),
    }))
    .sort((a, b) => a.timeRank - b.timeRank)
    .map(({ item }) => item as TodayIrregularMaster);
}
