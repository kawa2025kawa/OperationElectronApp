import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";

import {
  toDisplayValue,
  toMissingPropertyDisplayValue,
} from "@renderer/features/operation/operationDisplayUtils";

import {
  OPERATION_INFO_ROW_DEFINITIONS,
  type InfoRowData,
  type InfoRowField,
  type InfoRowValue,
} from "./operationViewDisplayConfig";

function getOwnPropertyValue(
  item: OperationViewItem,
  key: string,
): InfoRowValue {
  if (!Object.prototype.hasOwnProperty.call(item, key)) {
    return { exists: false, value: undefined };
  }

  return {
    exists: true,
    value: (item as unknown as Record<string, unknown>)[key],
  };
}

function getInfoRowValue(
  field: InfoRowField,
  item: OperationViewItem,
  status: JobStatus | undefined,
): InfoRowValue {
  if (field === "status" && status !== undefined) {
    return { exists: true, value: status };
  }

  const key = field === "scheduleTime" ? "scheduledTime" : field;

  return getOwnPropertyValue(item, key);
}

export function createInfoRows(
  mode: ViewMode,
  item: OperationViewItem | undefined,
  status: JobStatus | undefined,
): InfoRowData[] {
  return OPERATION_INFO_ROW_DEFINITIONS[mode].map((definition) => {
    if (!item) {
      return { ...definition, value: "" };
    }

    const fieldValue = getInfoRowValue(definition.field, item, status);

    return {
      ...definition,
      value: fieldValue.exists
        ? toDisplayValue(fieldValue.value)
        : toMissingPropertyDisplayValue(),
    };
  });
}
