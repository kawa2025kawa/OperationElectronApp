// src/shared/utils/isIrregularToday.ts

import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import type { OperationItem } from "@shared/types/operationType";

export const isIrregularToday = (item: OperationItem): boolean => {
  if (!("cycle2" in item) || !item.cycle2) {
    return false;
  }

  const cycle2 = item.cycle2.trim();
  const now = new Date();
  const todayMMDD = format(now, "MM/dd");
  const todayDD = format(now, "dd");
  const todayAAA = format(now, "EEE", { locale: ja }); // 例: "月"
  const isEndOfMonth = addDays(now, 1).getMonth() !== now.getMonth();

  // 1. 「月末」指定の場合（本日が月末でない場合は即座に false）
  if (cycle2.includes("月末")) {
    return isEndOfMonth;
  }

  // 2. MM/DD 指定の判定 (例: "08/17")
  const mmddMatch = cycle2.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (mmddMatch?.[1] && mmddMatch[2]) {
    const m = mmddMatch[1].padStart(2, "0");
    const d = mmddMatch[2].padStart(2, "0");
    return `${m}/${d}` === todayMMDD;
  }

  // 3. 曜日指定の判定 (例: "月", "月曜日" のみに完全一致)
  if (cycle2 === todayAAA || cycle2 === `${todayAAA}曜日`) {
    return true;
  }

  // 4. 日付(数値)指定の判定 (例: "17日", "17" のみにマッチ)
  const ddMatch = cycle2.match(/^(\d{1,2})(?:日)?$/);
  if (ddMatch?.[1]) {
    const d = ddMatch[1].padStart(2, "0");
    return d === todayDD;
  }

  return false;
};
