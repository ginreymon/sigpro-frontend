import { ShiftCyclesConfig } from '../interfaces/shift-cycles-config';

const DEFAULT_CONFIG: ShiftCyclesConfig = {
  showEmployeesModal: true,
  showBalanceSheet: true,
  showPauseModal: true,
  showShiftTimeAlert: true,
  showQuantityModal: true,
  showHourlyRecord: true,
};

export const SHIFT_CYCLES_CONFIG: Record<string, ShiftCyclesConfig> = {
  production: { ...DEFAULT_CONFIG },
  stamping: { ...DEFAULT_CONFIG, showHourlyRecord: false },
};
