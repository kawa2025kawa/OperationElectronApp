//src\shared\types\initializationTypes.ts

type InitStatusValue =
  | "LOADING"
  | "OK"
  | "NG"
  | "PENDING"
  | "CONNECTED"
  | string;

export interface InitStatus {
  update?: InitStatusValue;
  operation: InitStatusValue;
  irregular: InitStatusValue;
  auth: InitStatusValue;
  store: InitStatusValue;
  jugyoin: InitStatusValue;
  kokyuhyo: InitStatusValue;
  tantou: InitStatusValue;
}

export const INITIAL_INIT_STATUS: Readonly<InitStatus> = {
  operation: "PENDING",
  irregular: "PENDING",
  auth: "PENDING",
  store: "PENDING",
  jugyoin: "PENDING",
  kokyuhyo: "PENDING",
  tantou: "PENDING",
} as const;
