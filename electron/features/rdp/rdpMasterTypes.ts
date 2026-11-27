// electron/features/rdp/rdpMasterTypes.ts

import type { RdpTarget } from "@shared/types/spreadsheet/spreadsheetTypes";

/** RDP マスターデータ（Main 側専用） */
export interface RdpMaster extends RdpTarget {
  userName: string;
  password: string;
}
