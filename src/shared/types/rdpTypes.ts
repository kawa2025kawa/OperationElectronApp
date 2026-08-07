// src/shared/types/rdpTypes.ts

/**
 * フロントエンドで利用するRDP接続先
 */
export interface RdpTarget {
  id: string;
  host: string;
  name: string;
  description?: string;
}

/**
 * config内部用（秘密情報含む）
 */
export interface RdpConfigTarget extends RdpTarget {
  server: string;
  username: string;
  password?: string;
}
