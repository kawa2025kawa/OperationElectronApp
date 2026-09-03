import type { JobStatus } from "./status";

export type DependencyCondition = "every" | "some";

export interface JobDependency {
  dependsOn: string[];
  requiredStatus?: JobStatus[] | Record<string, JobStatus[]>;
  condition?: DependencyCondition;
  afterTime?: string;
  requiresActive?: string[];
  requiresAllJobsSuccess?: boolean;
}

export interface JobDependenciesConfig {
  dependencies: Record<string, JobDependency>;
}