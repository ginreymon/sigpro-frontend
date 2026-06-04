export interface ProductionRecordDetail {
  record_id: number;
  record_start: string;
  record_end: string | null;
  record_seconds: number | null;
  ordered_quantity: number;
  planned_quantity: number;
  completed_quantity: number;
  scrap_quantity: number;
  rejected_quantity: number;
  employee_count: number;
  break_count: number;
  break_seconds: number;
  activity_id: number;
  activity_started: string;
  activity_ended: string | null;
}
