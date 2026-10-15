// electron/features/operation/utils/operationUtils.ts

import { format } from "date-fns";

export interface ParsedTime {
  hours: number;
  minutes: number;
}

export function parseHHMM(value?: string | null): ParsedTime | null {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return {
    hours,
    minutes,
  };
}
