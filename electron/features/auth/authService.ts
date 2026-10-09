// electron/features/auth/authService.ts

import { GoogleOAuthService } from "@electron/features/spreadsheet/googleOAuthService";

export const authService = new GoogleOAuthService();

export interface AuthPublicSession {
  email: string | null;
  familyName: string | null;
}
