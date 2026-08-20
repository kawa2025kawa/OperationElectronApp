export interface UpdateInfo {
  version: string;
  notes?: string;
  pub_date?: string;
  platforms?: {
    "windows-x86_64"?: {
      url?: string;
    };
  };
}
