type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type Hours = `${Digit}` | `0${Digit}` | `1${Digit}` | `2${Digit}`;

type Minutes = `${Digit}${Digit}`;

export type ScheduledTime = `${Hours}:${Minutes}` | "AM" | "PM";