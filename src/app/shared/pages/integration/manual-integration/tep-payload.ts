import { OrderByWorkCenter, WorkCenterDocument } from '../../../../models/integration/order-by-work-center';
import { TepSendDetail, TepSendRequest } from '../../../../models/integration/tep-send';
import { SkuRecord } from '../../../../models/production/sku-detail';
import { ProductionOrder } from '../../../../models/production/production-order';
import { buildColorSizeMatrix } from '../../../components/production/tables/production-orders-table/color-size-matrix';
import { SelectionSummary } from './components/integration-time-inputs/integration-time-inputs';
import { pendingRecords } from './options/production/integration-state';
import { pendingSamRecords } from './options/stamping/stamping-integration-state';

const STAMPING_ORIGIN_ID = 2;

// One OP picked in the integrate modal: its document, what was picked (SKU ids for Confección, SAM ids
// for Estampación) and the units/time reported by its time inputs.
export interface PickedOp {
  document: WorkCenterDocument;
  selectedIds: number[];
  summary: SelectionSummary;
  // Confección single-quantity mode only: the exact pending records picked. null/absent = every pending
  // record of the picked SKUs (matrix mode).
  recordIds?: number[] | null;
}

// The API takes decimal hours (1 h 30 min = 1.5); the backend turns them into the HH.MM that SIESA expects.
export function decimalHours({ hours, minutes }: Pick<SelectionSummary, 'hours' | 'minutes'>): number {
  return Math.round((hours + minutes / 60) * 100) / 100;
}

// Production records still to be integrated inside the SKUs the user picked in a Confección OP.
function pickedProductionRecords(
  document: WorkCenterDocument,
  selectedIds: number[],
  recordIds?: number[] | null,
): SkuRecord[] {
  const colorRows = document.detail?.colorRows;
  if (!colorRows?.length) return [];
  return buildColorSizeMatrix({ colorRows } as ProductionOrder)
    .skuColors.flatMap((row) => row.skus)
    .filter((sku) => selectedIds.includes(sku.skuRowId))
    .flatMap((sku) => pendingRecords(sku))
    .filter((record) => !recordIds || recordIds.includes(record.id));
}

// Ids of the production/stamping records still to be integrated inside what the user picked.
export function pickedRegisterIds(
  originId: number,
  document: WorkCenterDocument,
  selectedIds: number[],
  recordIds?: number[] | null,
): number[] {
  if (originId === STAMPING_ORIGIN_ID) {
    return (document.detail?.referenceSams ?? [])
      .filter((sam) => selectedIds.includes(sam.id))
      .flatMap((sam) => pendingSamRecords(sam).map((record) => record.id));
  }
  return pickedProductionRecords(document, selectedIds, recordIds).map((record) => record.id);
}

// completed_quantity: Estampación sends the units to integrate (stamped - erp completed, already in whole OP
// units). Confección sends the completed quantity of the records it integrates over the pieces of the OP: the
// backend checks it against that sum, so scrap and rejected units (which the picked units include) stay out.
function completedQuantity(
  originId: number,
  document: WorkCenterDocument,
  units: number,
  selectedIds: number[],
  recordIds?: number[] | null,
): number {
  if (originId === STAMPING_ORIGIN_ID) return units;
  const completed = pickedProductionRecords(document, selectedIds, recordIds).reduce(
    (sum, record) => sum + Number(record.completed_quantity ?? 0),
    0,
  );
  return Math.round((completed / (document.pieces || 1)) * 10000) / 10000;
}

export function buildTepDetail(row: OrderByWorkCenter, { document, selectedIds, summary, recordIds }: PickedOp): TepSendDetail {
  const workCenter = row.code.trim();
  return {
    op_document_type_id: document.op_type,
    op_document_number: document.op_number,
    operation_number: document.operation_number,
    operation_work_center_id: workCenter,
    completed_quantity: completedQuantity(row.origin_id, document, summary.units, selectedIds, recordIds),
    hours: decimalHours(summary),
    time_mode: summary.useRecordedTime ? 'real' : 'standard',
    real_seconds_by_unit: document.seconds_by_unit ?? null,
    operation_completed: document.erp_completed_operation ? 1 : 0,
    register_ids: pickedRegisterIds(row.origin_id, document, selectedIds, recordIds),
    origin_id: row.origin_id,
  };
}

// Body of POST integration/tep/send/ for the OPs picked in the modal.
export function buildTepRequest(row: OrderByWorkCenter, pickedOps: PickedOp[]): TepSendRequest {
  return {
    header: { work_center_id: row.code.trim() },
    details: pickedOps.map((picked) => buildTepDetail(row, picked)),
  };
}
