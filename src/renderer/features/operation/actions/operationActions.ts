import { commands } from "@renderer/services/commands";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";
import { useAppStore, type AppState } from "@renderer/store";
import { showToast } from "@renderer/utils/toastUtils";
import { suppressNextSuccessToast } from "@shared/utils/statusToastSuppression";

import { checkJobDependencies } from "@shared/utils/dependencyHelper";
import {
  selectActiveSelectedItem,
  selectIrregularTableData,
  selectOperationTableData,
} from "@renderer/features/operation/store/operationSelectors";

const MANUAL_ALIAS_MAP: Record<string, string> = {
  "37": "30",
  "45": "30",
  "48": "30",
  "54": "30",
  "36": "29",
  "44": "29",
  "47": "29",
  "43": "28",
  "68": "28",
};

const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
};

const getState = (): AppState => useAppStore.getState();

const getSelectionContext = (state: AppState) => {
  const mode = state.currentMode;

  return {
    data:
      mode === "irregular"
        ? selectIrregularTableData(state)
        : selectOperationTableData(state),

    currentId: state.selectedIds[mode],

    setSelectedId: (id: string | null) => {
      state.setSelectedId(mode, id);
    },
  };
};

function selectOperation(item: OperationItem): void {
  const { setSelectedId } = getSelectionContext(getState());

  setSelectedId(item.kanriNo);
}

function moveSelectionDown(): void {
  const { data, currentId, setSelectedId } = getSelectionContext(getState());

  if (data.length === 0) {
    return;
  }

  const currentIndex = currentId
    ? data.findIndex((item) => item.kanriNo === currentId)
    : -1;

  const nextIndex = Math.min(currentIndex + 1, data.length - 1);

  setSelectedId(data[Math.max(0, nextIndex)].kanriNo);
}

function moveSelectionUp(): void {
  const { data, currentId, setSelectedId } = getSelectionContext(getState());

  if (data.length === 0) {
    return;
  }

  const currentIndex = currentId
    ? data.findIndex((item) => item.kanriNo === currentId)
    : data.length;

  const previousIndex = Math.max(0, currentIndex - 1);

  setSelectedId(data[previousIndex].kanriNo);
}

async function executeOperationAction(actionKey: string): Promise<void> {
  const state = getState();
  const selectedItem = selectActiveSelectedItem(state);

  if (!selectedItem) {
    return;
  }

  switch (actionKey) {
    case "jc": {
      const isJcActive = Boolean(
        "jobId" in selectedItem &&
        selectedItem.jobId &&
        selectedItem.jobId !== "-",
      );
      if (isJcActive && selectedItem.kanriNo) {
        await state.runJcJob(String(selectedItem.kanriNo));
      }
      break;
    }

    case "script": {
      const isScriptActive = Boolean(selectedItem.script);
      if (isScriptActive && selectedItem.kanriNo) {
        await state.runScriptJob(String(selectedItem.kanriNo));
      }
      break;
    }

    case "link": {
      const isLinkActive = Boolean(
        selectedItem.link && Object.keys(selectedItem.link).length > 0,
      );
      if (isLinkActive) {
        state.openGlobalModal("link", {
          title: "Link",
          ...DEFAULT_MODAL_SIZE,
        });
      }
      break;
    }

    case "manual": {
      if (selectedItem.kanriNo) {
        const kanriNoStr = String(selectedItem.kanriNo).trim();
        const targetKanriNo = MANUAL_ALIAS_MAP[kanriNoStr] ?? kanriNoStr;
        const targetUrl = `https://sites.google.com/belc.co.jp/operation-manual-${targetKanriNo}`;
        await commands.openExternal(targetUrl);
      }
      break;
    }

    default:
      console.warn(`[executeOperationAction] Unknown actionKey: ${actionKey}`);
      break;
  }
}

export async function completeSelectedOperation(): Promise<void> {
  const state = getState();
  const selectedItem = selectActiveSelectedItem(state);

  if (!selectedItem) {
    return;
  }

  const activeFlags = {
    is1CActive: state.is1CActive,
    is2CActive: state.is2CActive,
    is3CActive: state.is3CActive,
  };

  const dependencyResult = checkJobDependencies(
    selectedItem.kanriNo,
    {
      ...state.operationEntities,
      ...state.irregularEntities,
    },
    activeFlags,
  );

  if (!dependencyResult.ok) {
    showToast("前提作業が完了していません", "error");

    return;
  }

  suppressNextSuccessToast(selectedItem.kanriNo);

  await state.updateJobStatus({
    kanriNo: selectedItem.kanriNo,
    status: JOB_STATUS.SUCCESS,
    comment: " ",
  });
}
