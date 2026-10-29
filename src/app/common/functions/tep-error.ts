import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorDetail, apiFieldErrors } from './api-error';

// Message shown when POST integration/tep/send/ fails, shared by every page that sends a TEP.
export function tepErrorMessage(err: HttpErrorResponse): string {
  const body = err.error;
  // register_ids rejected by the backend: errors.register_ids (envelope) or details (previous shape).
  const fields = apiFieldErrors(err);
  const details = fields['register_ids'] ?? fields['details'] ?? [];
  if (details.length > 0) return details.join(' · ');
  // SIESA rejected the document: ok / error_type travel with the error response.
  if (body?.ok === false) return `SIESA rechazó el envío (tipo de error ${body.error_type ?? 's/d'}).`;
  return apiErrorDetail(err) || body?.error || 'No se pudo enviar el TEP.';
}
