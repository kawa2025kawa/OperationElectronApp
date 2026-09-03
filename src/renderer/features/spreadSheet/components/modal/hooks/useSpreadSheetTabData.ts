// src/renderer/features/spreadSheet/components/modal/hooks/useSpreadSheetTabData.ts
import { useMemo, useState } from "react";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { BaseSheetEntity } from "@shared/types/spreadsheet";

export interface TabGroupConfig {
  title: string;
  items: { key: string; label: string }[];
}

export function useSpreadSheetTabData<T extends BaseSheetEntity>(
  data: T | undefined,
  groupConfigs: readonly TabGroupConfig[],
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = useMemo(() => {
    if (!data || !groupConfigs) return [];
    return groupConfigs.map((group) => ({
      title: group.title,
      items: group.items.map((item) => {
        // getValueByPath が object を受け取るため、キャスト不要
        const rawVal = getValueByPath(data, item.key);
        const hasVal = rawVal !== "" && rawVal !== null && rawVal !== undefined;
        return {
          label: item.label,
          value: hasVal ? String(rawVal) : "-",
        };
      }),
    }));
  }, [data, groupConfigs]);

  return {
    selectedIndex,
    setSelectedIndex,
    groups,
    displayItems: groups[selectedIndex]?.items ?? [],
  };
}
