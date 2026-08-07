import { ipcMain } from "electron";
import { exec } from "node:child_process";
import util from "node:util";
import type { RdpTarget } from "@shared/types/rdpTypes";

const execPromise = util.promisify(exec);

const RDP_TARGETS: RdpTarget[] = [
  { id: "target_172_25_10_10", host: "172.25.10.10", name: "WEBEDI_AP" },
  { id: "target_172_25_20_20", host: "172.25.20.20", name: "WEBEDI_DB" },
  { id: "target_192_88_100_1", host: "192.88.100.1", name: "DB" },
  { id: "target_172_25_101_31", host: "172.25.101.31", name: "MD" },
  { id: "target_192_88_1_59", host: "192.88.1.59", name: "WEBEDI" },
  { id: "target_192_88_2_150", host: "192.88.2.150", name: "JACOS_PC" },
  { id: "target_192_88_2_176", host: "192.88.2.176", name: "192.88.2.176" },
];

export function setupRdpHandlers(): void {
  ipcMain.handle("get_rdp_targets", () => RDP_TARGETS);

  ipcMain.handle(
    "start_rdp_session",
    async (_e, { payload }: { payload: { id: string } }) => {
      const target = RDP_TARGETS.find((t) => t.id === payload.id);
      if (!target) throw new Error("RDP target not found");

      // 注意: セキュリティ観点から、平文パスワードは本番環境では環境変数やKeytar等のセキュアストレージ使用を推奨
      await execPromise(
        `cmdkey /generic:TERMSRV/${target.host} /user:admin /pass:password`,
      );
      exec(`mstsc /v:${target.host}`);
      return null;
    },
  );
}
