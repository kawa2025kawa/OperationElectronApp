//electron\features\operation\jobs\scripts\helpers\job-e29\types.ts

export type StoreYosanMap = Map<string, number>;

export interface StoreDiffResult {
  storeCode: string;
  realYosan: number;
  mdYosan: number;
  diff: number;
}
