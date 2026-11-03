// Request/response de POST integration/tep/send/. Solo los campos que manda
// Approval; el backend completa los valores fijos del encabezado (compañía,
// centro de operación, tipo de documento, fecha del envío, etc.).
// Finishing subprocess of a Confección OP: it has to be picked on every OP sent to SIESA. It only feeds the
// calculated time; the API does not take it (it rejects unknown keys in `details`).
export type TepSubprocess = 'labeling_machine' | 'labeling_gun' | 'dozening_duos' | 'dozening_trios' | 'none';

export const TEP_SUBPROCESS_OPTIONS: { id: TepSubprocess; name: string }[] = [
  { id: 'labeling_machine', name: 'Etiquetado por Máquina' },
  { id: 'labeling_gun', name: 'Etiquetado por Pistola' },
  { id: 'dozening_duos', name: 'Doceneo Duos' },
  { id: 'dozening_trios', name: 'Doceneo Trios' },
  { id: 'none', name: 'Sin subproceso' },
];

export interface TepSendDetail {
  op_document_type_id: string;
  op_document_number: number;
  operation_number: number | null;
  operation_work_center_id: string;
  completed_quantity: number;
  hours: number;
  // Time type the user integrated with, and the OP's seconds_by_unit at that moment (time traceability).
  time_mode: 'real' | 'standard';
  real_seconds_by_unit: number | null;
  // Seconds per unit of the time the user entered (hours x 3600 / completed_quantity); when omitted the
  // backend derives it from `hours` and `completed_quantity`.
  sent_seconds_per_unit?: number | null;
  operation_completed: 0 | 1;
  // Ids de los registros (production/stamping record) que respaldan el item.
  register_ids: number[];
  // 1 = producción, 2 = estampación.
  origin_id: number;
}

export interface TepSendRequest {
  header: {
    // Opcional: sin fecha (o null) el backend usa el día del envío.
    date?: string | null;
    work_center_id: string;
  };
  details: TepSendDetail[];
}

export interface TepSendResponse {
  submission_id: number;
  // Consecutive assigned by the backend: the same one sent to SIESA.
  document_number: number;
  ok: boolean;
  error_type: number | null;
  error_detail_xml: string | null;
}
