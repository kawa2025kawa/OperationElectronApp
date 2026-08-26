// src/renderer/features/operation/components/modal/summaryModal/summary/types.ts

import React from "react";
import type { OperationItem } from "@shared/types/operationType";
import type { Column } from "@shared/types/tableType";
import { StatusBadge } from "@renderer/components/ui/badge/StatusBadge";
import type { ModalContentProps } from "../useOperationModalLogic";

export interface SummaryModalContentProps extends ModalContentProps {
  items: OperationItem[];
  title?: string;
}

export const SUMMARY_COLUMNS: Column<OperationItem>[] = [
  {
    key: "kanriNo",
    label: "No",
    width: "15%",
  },
  {
    key: "workName",
    label: "作業名",
    width: "55%",
  },
  {
    key: "jobId",
    label: "Job ID",
    width: "15%",
  },
  {
    key: "status",
    label: "ステータス",
    width: "15%",
    render: (item) =>
      React.createElement(StatusBadge, { status: item.status ?? undefined }),
  },
];
