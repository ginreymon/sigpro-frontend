// Request/response de POST integration/tep/send/. Solo los campos que manda
// Approval; el backend completa los valores fijos del encabezado (compañía,
// centro de operación, tipo de documento, fecha del envío, etc.).
// Finishing subprocess of a Confección OP: it has to be picked on every OP sent to SIESA.
export type TepSubprocess = 'labeling' | 'dozening_duos' | 'dozening_trios' | 'none';

export const TEP_SUBPROCESS_OPTIONS: { id: TepSubprocess; name: string }[] = [
  { id: 'labeling', name: 'Etiquetado' },
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
  operation_completed: 0 | 1;
  // Ids de los registros (production/stamping record) que respaldan el item.
  register_ids: number[];
  // 1 = producción, 2 = estampación.
  origin_id: number;
  // Only sent for Confección (origin 1).
  subprocess?: TepSubprocess;
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
  ok: boolean;
  error_type: number | null;
  error_detail_xml: string | null;
}
