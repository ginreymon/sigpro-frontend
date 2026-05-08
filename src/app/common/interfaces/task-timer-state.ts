import { ColorDetail } from '../../models/production/color-detail';
import { ProductionOrder } from '../../models/production/production-order';
import { SizeQtyDetail } from '../../models/production/size-detail';
import { WorkSession } from '../../models/production/work-session';

export interface TaskTimerState {
  title?: string;
  isConfirmed: boolean;
  rowColorItems: ColorDetail | null;
  selectedSKU: SizeQtyDetail | null;
  currentOP: ProductionOrder | null;
  currentSession: WorkSession | null;
  visible: boolean;
  showQuantityModal: boolean;
  showPauseModal: boolean;
}
