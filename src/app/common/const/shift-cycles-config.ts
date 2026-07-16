import { ShiftCyclesConfig } from '../interfaces/shift-cycles-config';

const DEFAULT_CONFIG: ShiftCyclesConfig = {
  showEmployeesModal: true,
  showBalanceSheet: true,
  showPauseModal: true,
  showShiftTimeAlert: true,
  showQuantityModal: true,
  showHourlyRecord: true,
  readOnlyOrdersTable: false,
  showStampingRecord: false,
  showMaterialsAction: true,
  showLastDeliveryAction: true,
  showChangeOpAction: true,
};

export const SHIFT_CYCLES_CONFIG: Record<string, ShiftCyclesConfig> = {
  production: { ...DEFAULT_CONFIG },
  stamping: {
    ...DEFAULT_CONFIG,
    showHourlyRecord: false,
    readOnlyOrdersTable: true,
    showStampingRecord: true,
    showMaterialsAction: false,
    showLastDeliveryAction: false,
    showBalanceSheet: false,
  },
};
