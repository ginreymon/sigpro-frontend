import { DocType } from './doc-type';
import { Employee } from './employee';
import { ProductionOrder } from './production-order';
import { WorkBreak } from './work-break';
import { WorkSession } from './work-session';
import { WorkShift } from './work-shift';

export interface ProductionContext {
  session: WorkSession | null;
  order: ProductionOrder | null;
  docTypes: DocType[];
  workBreaks: WorkBreak[];
  employees: Employee[];
  workShifts: WorkShift[];
}
