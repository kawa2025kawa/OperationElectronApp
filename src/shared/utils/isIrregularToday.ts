// src/shared/utils/isIrregularToday.ts
import type { OperationItem } from "@shared/types/operationType";
import { JAPANESE_WEEKDAYS } from "./dateUtils";

export const isIrregularToday = (item: OperationItem): boolean => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayMMDD = `${mm}/${dd}`;
  const todayAAA = JAPANESE_WEEKDAYS[now.getDay()];
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const isEndOfMonth = nextDay.getMonth() !== now.getMonth();

  if (!item.cycle2) return false;

  // 1. MM/DD 形式指定のパース
  const mmddMatch = item.cycle2.match(/(\d{1,2})\/(\d{1,2})/);
  if (mmddMatch && mmddMatch[1] && mmddMatch[2]) {
    const m = mmddMatch[1].padStart(2, "0");
    const d = mmddMatch[2].padStart(2, "0");
    return `${m}/${d}` === todayMMDD;
  }

  // 2. 曜日指定の評価
  const dayRegex = new RegExp(`(?:^|[^0-9])(${todayAAA})(?!末|初|次)(?:$|[^0-9])`);
  if (dayRegex.test(item.cycle2)) return true;

  // 3. 日付指定・特殊日指定のジャッジ
  if (!item.cycle2.includes("/")) {
    if (item.cycle2.includes("月末") && isEndOfMonth) return true;
    const ddMatch = item.cycle2.match(/(\d{1,2})/);
    if (ddMatch && ddMatch[1]) {
      const d = ddMatch[1].padStart(2, "0");
      if (d === dd) return true;
    }
  }
  return false;
};
