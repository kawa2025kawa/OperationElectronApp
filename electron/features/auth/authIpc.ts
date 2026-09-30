// electron/features/auth/authIpc.ts

import { ipcMain } from "electron";
import { GoogleOAuthService } from "../spreadsheet/googleOAuthService";

const authService = new GoogleOAuthService();
let registered = false;

export interface AuthPublicSession {
  email: string | null;
  familyName: string | null;
}

function toPublicSession(
  session: Awaited<ReturnType<GoogleOAuthService["loadSession"]>>,
): AuthPublicSession | null {
  if (!session) {
    return null;
  }

  return {
    email: session.email,
    familyName: session.familyName,
  };
}

export function registerAuthIpc(): void {
  if (registered) {
    console.warn("[IPC] Auth handlers already registered.");
    return;
  }

  registered = true;

  ipcMain.handle("googleAuth:login", async () => {
    const session = await authService.login();

    return {
      email: session.email,
      familyName: session.familyName,
    };
  });

  ipcMain.handle(
    "googleAuth:loadSession",
    async (_event, forceRefresh?: boolean) => {
      const session = await authService.loadSession(forceRefresh);

      return toPublicSession(session);
    },
  );

  ipcMain.handle("googleAuth:logout", () => {
    console.trace("[IPC] googleAuth:logout called");
    return authService.clearSession();
  });

  console.log("[IPC] Auth handlers registered.");
}

export { authService };
