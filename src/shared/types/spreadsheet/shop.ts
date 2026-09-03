export interface PrinterInfo {
  model?: string;
  serial?: string;
  callTarget?: string;
  weekendSupport?: string;
  contractId?: string;
}

export interface TimeRecorder {
  name?: string;
  ip?: string;
  model?: string;
  logicalPort?: string;
  physicalPort?: string;
}

export interface ShopContact {
  phoneNumber?: string;
  postalCode?: string;
}

export interface ShopBusinessHours {
  start?: string;
  end?: string;
  display?: string;
}

export interface ShopLocation {
  address?: string;
  area?: string;
  centerName?: string;
}

export interface ShopManagers {
  manager?: string;
  subManager1?: string;
  subManager2?: string;
  areaManager?: string;
}

export interface ShopEquipment {
  hub?: string;
  powerOutlet?: string;
  deviceCount?: string;
}

export interface ShopDocuments {
  excelFilePath?: string;
  pdfFilePath?: string;
}

export interface Shop {
  id: string;
  code: string;
  name: string;
  nameKana?: string;

  contact: ShopContact;
  businessHours: ShopBusinessHours;
  location: ShopLocation;
  managers: ShopManagers;

  mobileSales?: string;

  printers: {
    B?: PrinterInfo;
    K?: PrinterInfo;
    O?: PrinterInfo;
  };

  timeRecorders: {
    1?: TimeRecorder;
    2?: TimeRecorder;
    3?: TimeRecorder;
    4?: TimeRecorder;
  };

  remarks?: string;

  additionalTimeRecorderInfo: {
    1?: string;
    2?: string;
    3?: string;
    4?: string;
  };

  equipment: ShopEquipment;
  documents: ShopDocuments;
}
