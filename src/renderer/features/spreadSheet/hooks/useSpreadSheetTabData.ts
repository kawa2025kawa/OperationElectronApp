// src/renderer/features/spreadSheet/hooks/useSpreadSheetTabData.ts

import { useMemo, useState } from "react";
import { getValueByPath } from "@shared/utils/getValueByPath";

export interface TabGroupConfig<K extends string = string> {
  title: string;
  items: readonly {
    key: K;
    label: string;
  }[];
}

interface TabDisplayItem {
  label: string;
  value: string;
}

export interface TabGroupDisplay {
  title: string;
  items: TabDisplayItem[];
}

const EMPTY_ITEMS: readonly TabDisplayItem[] = Object.freeze([]);

export function useSpreadSheetTabData<
  T extends object,
  K extends string = string,
>(data: T | undefined, groupConfigs: readonly TabGroupConfig<K>[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = useMemo<TabGroupDisplay[]>(
    () =>
      data
        ? groupConfigs.map((group) => ({
            title: group.title,
            items: group.items.map(({ key, label }) => ({
              label,
              value: getValueByPath(data, key),
            })),
          }))
        : [],
    [data, groupConfigs],
  );

  const displayItems = groups[selectedIndex]?.items ?? EMPTY_ITEMS;

  return {
    selectedIndex,
    setSelectedIndex,
    groups,
    displayItems,
  };
}
