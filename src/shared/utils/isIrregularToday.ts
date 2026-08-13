// src/shared/utils/isIrregularToday.ts
import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import type { OperationItem } from "@shared/types/operationType";

export const isIrregularToday = (item: OperationItem): boolean => {
  if (!item.cycle2) return false;

  const now = new Date();
  const todayMMDD = format(now, "MM/dd");
  const todayAAA = format(now, "EEE", { locale: ja }); // 例: "水"
  const isEndOfMonth = addDays(now, 1).getMonth() !== now.getMonth();

  // 1. MM/DD 指定の判定
  const mmddMatch = item.cycle2.match(/(\d{1,2})\/(\d{1,2})/);
  if (mmddMatch && mmddMatch[1] && mmddMatch[2]) {
    const m = mmddMatch[1].padStart(2, "0");
    const d = mmddMatch[2].padStart(2, "0");
    return `${m}/${d}` === todayMMDD;
  }

  // 2. 曜日指定の判定
  const dayRegex = new RegExp(`(?:^|[^0-9])(${todayAAA})(?!曜)(?:$|[^0-9])`);
  if (dayRegex.test(item.cycle2)) return true;

  // 3. 日付・月末指定の判定
  if (!item.cycle2.includes("/")) {
    if (item.cycle2.includes("月末") && isEndOfMonth) return true;
    const ddMatch = item.cycle2.match(/(\d{1,2})/);
    if (ddMatch && ddMatch[1]) {
      const d = ddMatch[1].padStart(2, "0");
      if (d === format(now, "dd")) return true;
    }
  }

  return false;
};
