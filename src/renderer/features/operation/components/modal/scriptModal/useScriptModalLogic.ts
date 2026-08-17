import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppStore } from "@shared/store";
import { selectActiveItemStatusFlags } from "@renderer/features/operation/store/operationSelectors";

export const useScriptModalLogic = () => {
  const { item, runScriptJob } = useAppStore(
    useShallow((state) => {
      const flags = selectActiveItemStatusFlags(state);

      return {
        item: flags.item,
        runScriptJob: state.runScriptJob,
      };
    }),
  );

  const handleExecute = useCallback(async () => {
    const kanriNo = item?.kanriNo;

    if (!kanriNo) {
      return;
    }

    console.error("[DEBUG][SCRIPT MODAL] runScriptJob BEFORE", {
      kanriNo: String(kanriNo),
      itemStatus: item?.status,
    });

    await runScriptJob(String(kanriNo));

    console.error("[DEBUG][SCRIPT MODAL] runScriptJob AFTER", {
      kanriNo: String(kanriNo),
      itemStatus: item?.status,
    });
  }, [item, runScriptJob]);

  return {
    item,
    handleExecute,
  };
};
