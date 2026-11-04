// electron/features/rdp/rdpMasterTypes.ts

/** RDP マスターデータ（Main 側専用） */
export interface RdpMaster {
  name: string;
  ipAddress: string;
  userName: string;
  password: string;
}
