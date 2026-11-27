// src/shared/types/registry/viewDefinition.ts

export const VIEW_MODES = {
  OPERATION: "operation",
  IRREGULAR: "irregular",
  TODAY: "today",
} as const;

export type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];
