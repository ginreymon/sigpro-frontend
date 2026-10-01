// Request/response de POST integration/tep/send/. Solo los campos que manda
// Approval; el backend completa los valores fijos del encabezado (compañía,
// centro de operación, tipo de documento, etc.).
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
}

export interface TepSendRequest {
  header: {
    date: string;
    work_center_id: string;
  };
  details: TepSendDetail[];
}

export interface TepSendResponse {
  submission_id: number;
  ok: boolean;
  error_type: number | null;
  error_detail_xml: string | null;
  flat_file_lines: string[];
}
