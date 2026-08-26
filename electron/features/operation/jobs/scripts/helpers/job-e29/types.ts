export type StoreYosanMap = Map<string, number>;

export interface StoreDiffResult {
  storeCode: string;
  realYosan: number;
  mdYosan: number;
  diff: number;
}

export interface InputFiles {
  realYosanPath: string;
  meis0120Path: string;
}

export interface RealYosanStatistics {
  storeHeaderCount: number;
  totalRowCount: number;
  validTotalCount: number;
  invalidAmountCount: number;
  ignoredRowCount: number;
}

export interface RealYosanParseResult {
  resultMap: StoreYosanMap;
  statistics: RealYosanStatistics;
}
