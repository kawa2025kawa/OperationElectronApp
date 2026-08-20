//src\shared\types\rdpTypes.ts

/**
 * フロントエンドで利用するRDP接続先
 */
export interface RdpTarget {
  id: string;
  host: string;
  name: string;
  description?: string;
}
