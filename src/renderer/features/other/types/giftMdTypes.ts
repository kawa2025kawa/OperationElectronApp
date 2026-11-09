// src/renderer/features/other/types/giftMdTypes.ts

export interface GiftMdFile {
  name: string;
  path: string;
}

export interface GiftMessage {
  text: string;
  type: "info" | "success" | "error" | "warning";
}
