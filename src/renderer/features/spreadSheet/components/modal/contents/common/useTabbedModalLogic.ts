// src/renderer/features/spreadSheet/components/modal/contents/common/useTabbedModalLogic.ts
import { useState, useMemo } from "react";
import { getValueByPath } from "@shared/utils/getValueByPath";

export interface TabGroupConfig {
  title: string;
  items: { key: string; label: string }[];
}

export function useTabbedModalLogic<T extends Record<string, unknown>>(
  data: T | null | undefined,
  groupConfigs: readonly TabGroupConfig[],
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = useMemo(() => {
    if (!data) return [];
    return groupConfigs.map((group) => ({
      title: group.title,
      items: group.items.map((item) => {
        const rawVal = getValueByPath(data, item.key);
        return {
          label: item.label,
          value:
            rawVal !== "" && rawVal !== null && rawVal !== undefined
              ? rawVal
              : "-",
        };
      }),
    }));
  }, [data, groupConfigs]);

  const displayItems = groups[selectedIndex]?.items ?? [];

  return {
    groups,
    selectedIndex,
    setSelectedIndex,
    displayItems,
  };
}
