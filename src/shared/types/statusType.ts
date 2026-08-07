export interface OperationStatusUpdatePayload {
  kanriNo: string;
  workName?: string;
  jobId?: string | null;
  status?: string | null;
  comment?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  expectedStartTime?: string | null;
  expectedEndTime?: string | null;
  substatus?: string[] | null;
}

export interface OperationStatusEvent {
  status: OperationStatusUpdatePayload;
}
