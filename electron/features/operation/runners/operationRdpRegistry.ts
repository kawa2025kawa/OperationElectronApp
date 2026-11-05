// electron/features/operation/runners/operationRdpRegistry.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import type { OperationRdpKey } from "@shared/types/operation/operationTypes";

/** RDP接続先のデフォルト対応表 */
const DEFAULT_OPERATION_RDP_KEYS: Readonly<
  Record<string, readonly OperationRdpKey[]>
> = {
  E51: [
    {
      key: "MD帳票サーバ",
      label: "MD帳票",
      executionTypes: ["manual"],
    },
  ],

  N27: [
    {
      key: "WEBEDI_DB",
      label: "webedi_db",
      executionTypes: ["manual"],
    },
    {
      key: "WEBEDI",
      label: "webedi",
      executionTypes: ["manual"],
    },
  ],

  N28: [
    {
      key: "WEBEDI",
      label: "webedi",
      executionTypes: ["manual"],
    },
  ],
};

/** 管理Noに対応するRDP接続先キーを取得 */
export function getRdpKeysForOperation(
  kanriNo: string,
  rdpKeys?: readonly OperationRdpKey[] | null,
): readonly OperationRdpKey[] {
  return rdpKeys?.length
    ? rdpKeys
    : (DEFAULT_OPERATION_RDP_KEYS[normalizeKanriNo(kanriNo).toUpperCase()] ??
        []);
}
