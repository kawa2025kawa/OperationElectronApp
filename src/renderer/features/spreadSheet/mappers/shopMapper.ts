import type {
  Shop,
  PrinterInfo,
  TimeRecorder,
} from "@shared/types/spreadsheet/shop";
import { parseRawToFlatObjects, getValue, EMPTY_VALUE } from "./commonMapper";

function parsePrinter(
  flat: Record<string, string>,
  prefix: "B" | "K" | "O",
): PrinterInfo | undefined {
  const model = getValue(
    flat,
    [`printerModel${prefix}`, `printer${prefix}.model`],
    "",
  );
  if (!model) return undefined;

  return {
    model,
    serial: getValue(flat, [`printerSerial${prefix}`]),
    callTarget: getValue(flat, [`printerCall${prefix}`]),
    weekendSupport: getValue(flat, [`printerHoliday${prefix}`]),
    contractId: getValue(flat, [`printerContractId${prefix}`]),
  };
}

function parseTimeRecorder(
  flat: Record<string, string>,
  index: 1 | 2 | 3 | 4,
): TimeRecorder | undefined {
  const ip = getValue(flat, [`tr${index}Ip`], "");
  const model = getValue(flat, [`tr${index}Model`], "");
  if (!ip && !model) return undefined;

  return {
    name: getValue(flat, [`tr${index}`], `TR${index}`),
    ip: ip || EMPTY_VALUE,
    model: model || EMPTY_VALUE,
    logicalPort: getValue(flat, [`tr${index}LogicalPort`]),
    physicalPort: getValue(flat, [`tr${index}PhysicalPort`]),
  };
}

export function parseShopSheet(
  rawRows: string[][],
  keyMap?: Record<string, string>,
): Shop[] {
  const flatRows = parseRawToFlatObjects(rawRows, keyMap);

  return flatRows.map((flat) => {
    const code = getValue(flat, ["shopCode", "code"], "");
    const fallbackId = `shop_row_${flat._rowIdx}`;
    const id = code ? `${code}_${fallbackId}` : fallbackId;

    const start = getValue(flat, ["openTime", "businessHoursStart"], "");
    const end = getValue(flat, ["closeTime", "businessHoursEnd"], "");

    let display = EMPTY_VALUE;
    if (start || end) {
      display = `${start || "00:00"} ~ ${end || "24:00"}`;
    }

    return {
      id,
      code,
      name: getValue(flat, ["shopName", "name"]),
      nameKana: getValue(
        flat,
        ["shopKana", "nameKana"],
        undefined as unknown as string,
      ),
      contact: {
        phoneNumber: getValue(flat, ["phoneNumber"]),
        postalCode: getValue(flat, ["postalCode"]),
      },
      businessHours: {
        start: start || undefined,
        end: end || undefined,
        display,
      },
      location: {
        address: getValue(flat, ["address"]),
        area: getValue(flat, ["areaName", "area"]),
        centerName: getValue(flat, ["centerName"]),
      },
      managers: {
        manager: getValue(flat, ["managerName"]),
        subManager1: getValue(flat, ["subManager1"]),
        subManager2: getValue(flat, ["subManager2"]),
        areaManager: getValue(flat, ["areaManagerName"]),
      },
      mobileSales: getValue(
        flat,
        ["idoHanbai"],
        undefined as unknown as string,
      ),
      printers: {
        B: parsePrinter(flat, "B"),
        K: parsePrinter(flat, "K"),
        O: parsePrinter(flat, "O"),
      },
      timeRecorders: {
        1: parseTimeRecorder(flat, 1),
        2: parseTimeRecorder(flat, 2),
        3: parseTimeRecorder(flat, 3),
        4: parseTimeRecorder(flat, 4),
      },
      additionalTimeRecorderInfo: {
        1: getValue(
          flat,
          ["timeRecorder1", "tr1"],
          undefined as unknown as string,
        ),
        2: getValue(
          flat,
          ["timeRecorder2", "tr2"],
          undefined as unknown as string,
        ),
        3: getValue(
          flat,
          ["timeRecorder3", "tr3"],
          undefined as unknown as string,
        ),
        4: getValue(
          flat,
          ["timeRecorder4", "tr4"],
          undefined as unknown as string,
        ),
      },
      equipment: {
        hub: getValue(flat, ["hub"], undefined as unknown as string),
        powerOutlet: getValue(
          flat,
          ["powerOutlet"],
          undefined as unknown as string,
        ),
        deviceCount: getValue(
          flat,
          ["deviceCount"],
          undefined as unknown as string,
        ),
      },
      documents: {
        excelFilePath: getValue(
          flat,
          ["excelFilePath", "excelPath"],
          undefined as unknown as string,
        ),
        pdfFilePath: getValue(
          flat,
          ["pdfFilePath", "pdfPath"],
          undefined as unknown as string,
        ),
      },
      remarks: getValue(flat, ["remarks"], undefined as unknown as string),
    };
  });
}
