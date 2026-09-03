//electron\features\rdp\rdpIpc.ts

import { ipcMain } from "electron";
import { exec } from "node:child_process";
import util from "node:util";
import type { RdpTarget } from "@shared/types/rdp";

const execPromise = util.promisify(exec);

interface RdpTargetWithAuth extends RdpTarget {
  username: string;
  password?: string;
}

const RDP_TARGETS: RdpTargetWithAuth[] = [
  {
    id: "target_172_25_10_10",
    host: "172.25.10.10",
    name: "WEBEDI_AP",
    username: "wediadmin",
    password: process.env.RDP_PASS_WEBEDI_AP ?? "belc_nec_2019",
  },
  {
    id: "target_172_25_20_20",
    host: "172.25.20.20",
    name: "WEBEDI_DB",
    username: "wediadmin",
    password: process.env.RDP_PASS_WEBEDI_DB ?? "belc_nec_2019",
  },
  {
    id: "target_192_88_100_1",
    host: "192.88.100.1",
    name: "マスタメンテ",
    username: "Administrator",
    password: process.env.RDP_PASS_DB ?? "Belcedp",
  },
  {
    id: "target_172_25_101_31",
    host: "172.25.101.31",
    name: "MD帳票サーバ",
    username: "dcmmd",
    password: process.env.RDP_PASS_MD ?? "Dcmmd2013",
  },
  {
    id: "target_192_88_1_59",
    host: "192.88.1.59",
    name: "WEBEDI",
    username: "Administrator",
    password: process.env.RDP_PASS_WEBEDI ?? "belcedp",
  },
];

/**
 * レンダラープロセスへ公開する安全なターゲット一覧を取得
 */
const getPublicRdpTargets = (): RdpTarget[] =>
  RDP_TARGETS.map((target) => ({
    id: target.id,
    host: target.host,
    name: target.name,
  }));

export function registerRdpIpc(): void {
  ipcMain.handle("getRdpTargets", () => getPublicRdpTargets());

  ipcMain.handle(
    "startRdpSession",
    async (_e, { payload }: { payload: { id: string } }) => {
      const target = RDP_TARGETS.find((t) => t.id === payload.id);
      if (!target) throw new Error("RDP target not found");

      if (target.username && target.password) {
        await execPromise(
          `cmdkey /generic:TERMSRV/${target.host} /user:${target.username} /pass:${target.password}`,
        );
      }

      exec(`mstsc /v:${target.host}`);
      return null;
    },
  );
}
