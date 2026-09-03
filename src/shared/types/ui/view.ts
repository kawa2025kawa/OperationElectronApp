export const APP_VIEW_IDS = {
  OPERATION: "operation",
  AUTH: "auth",
  RDP: "rdp",
  KOKYUHYO: "kokyuhyo",
  JUGYOIN: "jugyoin",
  SHOP: "shop",
  TANTOU: "tantou",
  OTHER: "other",
} as const;

export type AppViewId = (typeof APP_VIEW_IDS)[keyof typeof APP_VIEW_IDS];

export const VIEW_MODES = ["operation", "irregular", "today"] as const;

export type ViewMode = (typeof VIEW_MODES)[number];