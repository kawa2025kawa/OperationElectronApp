// src/renderer/features/spreadSheet/components/modal/hooks/useSpreadSheetTabData.ts
import { useMemo, useState } from "react";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { BaseSheetEntity } from "@shared/types/spreadsheet";

/**
 * タブグループの設計定義
 * @template K エンティティのプロパティキー型（Defaults to string）
 */
export interface TabGroupConfig<K extends string = string> {
  title: string;
  items: readonly { key: K; label: string }[];
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
  T extends BaseSheetEntity,
  K extends string = string,
>(data: T | undefined, groupConfigs: readonly TabGroupConfig<K>[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = useMemo<TabGroupDisplay[]>(() => {
    if (!data || !groupConfigs) return [];

    return groupConfigs.map((group) => ({
      title: group.title,
      items: group.items.map((item) => {
        const rawVal = getValueByPath(
          data as unknown as Record<string, unknown>,
          item.key,
        );
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
