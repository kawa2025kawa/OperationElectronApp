import type {
  JobDependenciesJson,
  OperationItem,
} from "@shared/types/operationType";

import { checkJobDependencies } from "./dependencyHelper";

export const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

export const checkDependencies = (
  kanriNo: string,
  entities: Record<string, OperationItem>,
  dependencies: JobDependenciesJson | null,
): boolean => {
  if (!dependencies) {
    return true;
  }

  return checkJobDependencies(kanriNo, entities, dependencies);
};
