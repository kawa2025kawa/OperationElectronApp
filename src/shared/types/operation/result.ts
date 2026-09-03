export interface JobArtifact {
  path: string;
  name?: string;
}

export interface JobResult {
  message: string;
  artifacts?: JobArtifact[];
}