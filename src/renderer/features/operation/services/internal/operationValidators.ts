import type { AppState } from "@renderer/store";
import {
  selectIrregularMasters,
  selectOperationMasters,
  selectTodayIrregularMasters,
} from "@renderer/features/spreadSheet/store/spreadsheetSelectors";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";
import { validateJobDependencies } from "@shared/utils/dependency/dependencyUtils";

export type ExecutionValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export function validateExecution(
  state: AppState,
  kanriNo: string,
  options: JobExecutionOptions,
): ExecutionValidationResult {
  const operationMasters = selectOperationMasters(state);
  const irregularMasters = selectIrregularMasters(state);
  const todayIrregularMasters = selectTodayIrregularMasters(state);

  const validation = validateJobDependencies(
    kanriNo,
    {
      operationMasters,
      irregularMasters,
      todayIrregularMasters,
    },
    {
      operationStatuses: state.operationStatuses,
      irregularStatuses: state.irregularStatuses,
      todayStatuses: state.todayStatuses,
    },
    options,
    {
      is1CActive: state.is1CActive,
      is2CActive: state.is2CActive,
      is3CActive: state.is3CActive,
    },
  );

  if (validation.ok) {
    return {
      ok: true,
    };
  }

  return {
    ok: false,
    message: validation.message ?? "蜑肴署譚｡莉ｶ繧呈ｺ縺溘＠縺ｦ縺・∪縺帙ｓ",
  };
}
