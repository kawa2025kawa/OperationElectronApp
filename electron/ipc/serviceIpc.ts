// electron/ipc/serviceIpc.ts

import fs from "fs-extra";
import path from "node:path";
import { addDays, format } from "date-fns";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AuthProfile, AuthSession } from "@shared/types/auth";

import { authService } from "@electron/features/auth/authService";
import { getSpreadsheetMasterData } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import {
  getRdpTargets,
  startRdpSession,
} from "@electron/features/rdp/rdpService";
import {
  createGmailDraft,
  fetchPrimarySignature,
  generateDraftTemplate,
} from "@electron/features/gmail/gmailService";
import {
  uploadPdfDocuments,
  type TempomaticTargetFile,
} from "@electron/features/tempomatic/tempomaticService";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";
import { registerIpcHandler } from "./ipcHelper";

// 認証セッションから公開プロフィールを生成する。
function toPublicProfile(session: AuthSession): AuthProfile {
  return {
    email: session.email,
    familyName: session.familyName,
  };
}

// 指定日数後の有効期限日付（yyyy/MM/dd）を算出する。
function calculateExpireDate(offsetDays = 7): string {
  return format(addDays(new Date(), offsetDays), "yyyy/MM/dd");
}

// 認証・スプレッドシート・RDP・Gmail・Tempomatic・その他業務サービスのIPCハンドラーを一括登録する。
export function registerServiceIpc(): void {
  // Auth
  registerIpcHandler(IPC_CHANNELS.AUTH.LOGIN, async () => {
    return toPublicProfile(await authService.login());
  });
  registerIpcHandler(IPC_CHANNELS.AUTH.LOAD_SESSION, async (forceRefresh) => {
    const session = await authService.loadSession(forceRefresh);
    return session ? toPublicProfile(session) : null;
  });
  registerIpcHandler(IPC_CHANNELS.AUTH.LOGOUT, () =>
    authService.clearSession(),
  );

  // Spreadsheet Master
  registerIpcHandler(IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA, () =>
    getSpreadsheetMasterData(),
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
  registerIpcHandler(
    IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT,
    async (params) => {
      const rawList: TempomaticTargetFile[] =
        params.files ?? params.filePaths?.map((p) => ({ path: p })) ?? [];
      const visited = new Set<string>();
      const targets: TempomaticTargetFile[] = [];

      for (const item of rawList) {
        const filePath = item.path?.trim();
        if (!filePath || visited.has(filePath)) continue;
        visited.add(filePath);

        if (filePath.toLowerCase().endsWith(".pdf")) {
          targets.push({
            path: filePath,
            name: item.name?.trim(),
          });
        }
      }

      if (targets.length === 0) {
        throw new Error(
          "アップロード対象に有効なPDFファイル (.pdf) が含まれていません",
        );
      }

      for (const target of targets) {
        if (!(await fs.pathExists(target.path))) {
          throw new Error(
            `指定されたファイルが存在しません: ${path.basename(target.path)}`,
          );
        }
      }

      const expireDate = params.expireDate?.trim() || calculateExpireDate();
      return uploadPdfDocuments(targets, expireDate);
    },
  );

  // Other (Gift MD)
  registerIpcHandler(IPC_CHANNELS.OTHER.PROCESS_GIFT_MD, async (filePath) => {
    if (!filePath?.trim()) {
      throw new Error("ファイルパスが指定されていません");
    }

    const cleanPath = filePath.trim();
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
