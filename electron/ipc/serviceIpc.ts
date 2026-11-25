// electron/ipc/serviceIpc.ts

import path from "node:path";
import fs from "fs-extra";
import { IPC_CHANNELS } from "@shared/types/electron/ipcTypes";
import type { AuthProfile, AuthSession } from "@shared/types/auth/authTypes";
import { authService } from "@electron/features/auth/authService";
import {
  getPublicSpreadsheetMasterData,
  resolveShopResourcePath,
  resolveStaffScheduleLink,
} from "@electron/features/masterData/application/publicMasterDataMapper";
import { clearSpreadsheetMasterDataCache } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import {
  getRdpTargets,
  startRdpSession,
} from "@electron/features/rdp/rdpService";
import {
  createGmailDraft,
  fetchPrimarySignature,
  generateDraftTemplate,
} from "@electron/features/gmail/gmailService";
import { uploadTempomaticDocuments } from "@electron/features/tempomatic/tempomaticService";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";
import { openExternalOrPath } from "@electron/features/system/systemService";
import { registerIpcHandler } from "./index";

function toPublicProfile(session: AuthSession): AuthProfile {
  return {
    email: session.email,
    familyName: session.familyName,
  };
}

export function registerServiceIpc(): void {
  // Auth
  registerIpcHandler(IPC_CHANNELS.AUTH.LOGIN, async () =>
    toPublicProfile(await authService.login()),
  );
  registerIpcHandler(IPC_CHANNELS.AUTH.LOAD_SESSION, async (forceRefresh) => {
    const session = await authService.loadSession(forceRefresh);
    return session ? toPublicProfile(session) : null;
  });
  registerIpcHandler(IPC_CHANNELS.AUTH.LOGOUT, async () => {
    authService.clearSession();
    await clearSpreadsheetMasterDataCache();
  });

  // Spreadsheet Master
  registerIpcHandler(IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA, () =>
    getPublicSpreadsheetMasterData(),
  );
  registerIpcHandler(
    IPC_CHANNELS.SPREADSHEET.OPEN_STAFF_SCHEDULE,
    async ({ sheetId, staffId }) => {
      const link = await resolveStaffScheduleLink(sheetId, staffId);
      await openExternalOrPath(link, { skipLocalWhitelist: true });
      return null;
    },
  );
  registerIpcHandler(
    IPC_CHANNELS.SPREADSHEET.OPEN_SHOP_RESOURCE,
    async ({ shopCode, resourceKey }) => {
      const resourcePath = await resolveShopResourcePath(
        shopCode,
        resourceKey,
      );
      await openExternalOrPath(resourcePath, { skipLocalWhitelist: true });
      return null;
    },
  );

  // RDP
  registerIpcHandler(IPC_CHANNELS.RDP.GET_MASTERS, () => getRdpTargets());
  registerIpcHandler(IPC_CHANNELS.RDP.START_SESSION, async ({ name }) => {
    await startRdpSession(name);
    return null;
  });

  // Gmail
  registerIpcHandler(IPC_CHANNELS.GMAIL.GET_SIGNATURE, () =>
    fetchPrimarySignature(),
  );
  registerIpcHandler(IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE, (params) =>
    generateDraftTemplate(params),
  );
  registerIpcHandler(IPC_CHANNELS.GMAIL.CREATE_DRAFT, async (params) => {
    await createGmailDraft(params);
  });

  // Tempomatic
  registerIpcHandler(IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT, (params) =>
    uploadTempomaticDocuments(params),
  );

  // Other (Gift MD)
  registerIpcHandler(IPC_CHANNELS.OTHER.PROCESS_GIFT_MD, async (filePath) => {
    const cleanPath = filePath?.trim();
    if (!cleanPath) {
      throw new Error("ファイルパスが指定されていません");
    }

    const ext = path.extname(cleanPath).toLowerCase();
    if (ext !== ".txt" && ext !== ".dat") {
      throw new Error(
        "サポートされていない形式です (.txt, .DAT ファイルを選択してください)",
      );
    }

    if (!(await fs.pathExists(cleanPath))) {
      throw new Error(`ファイルが見つかりません: ${path.basename(cleanPath)}`);
    }

    return runJobE41(cleanPath);
  });
}
