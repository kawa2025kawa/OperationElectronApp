import { useMemo, useState } from "react";
import type { SpreadSheetEntity } from "@shared/types/spreadsheet/spreadsheetTypes";
import { getValueByPath } from "@shared/utils/getValueByPath";

export interface TabGroupConfig<K extends string = string> {
  title: string;
  items: readonly {
    key: K;
    label: string;
  }[];
}

export interface TabDisplayItem {
  label: string;
  value: string;
}

export interface TabGroupDisplay {
  title: string;
  items: TabDisplayItem[];
}

export function useSpreadSheetTabData<
  T extends SpreadSheetEntity,
  K extends string = string,
>(data: T | undefined, groupConfigs: readonly TabGroupConfig<K>[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = useMemo<TabGroupDisplay[]>(
    () =>
      data
        ? groupConfigs.map((group) => ({
            title: group.title,
            items: group.items.map(({ key, label }) => {
              const value = getValueByPath(
                data as Record<string, unknown>,
                key,
              );

              return {
                label,
                value: value === "" || value == null ? "-" : String(value),
              };
            }),
          }))
        : [],
    [data, groupConfigs],
  );

  return {
    selectedIndex,
    setSelectedIndex,
    groups,
    displayItems: groups[selectedIndex]?.items ?? [],
  };
}
