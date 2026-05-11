import { DocType } from './doc-type';
import { ProductionOrder } from './production-order';
import { WorkBreak } from './work-break';
import { WorkSession } from './work-session';

export interface ProductionContext {
  session: WorkSession | null;
  order: ProductionOrder | null;
  docTypes: DocType[];
  workBreaks: WorkBreak[];
}
