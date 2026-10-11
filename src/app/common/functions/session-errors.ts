import { apiErrorDetail, apiFieldErrors, apiNonFieldErrors } from './api-error';

// Mensajes de reglas de negocio de la jornada (sesión): el backend los responde
// en errors.non_field_errors del sobre estándar (antes, un body que era una lista).
export function parseSessionErrors(err: unknown, fallback: string): string[] {
  const messages = apiNonFieldErrors(err);
  return messages.length > 0 ? messages : [fallback];
}

// Primer mensaje de error para mostrar en un toast: el del primer campo con error
// (DRF ValidationError({ campo: "mensaje" })), si no el primer mensaje general y,
// si tampoco hay, el detail de la respuesta. Devuelve null cuando no hay nada
// útil (por ejemplo un error de servidor), para que el llamador use su mensaje
// genérico.
export function extractFieldErrorMessage(err: unknown): string | null {
  const firstField = Object.values(apiFieldErrors(err))[0]?.[0];
  if (firstField) return firstField;

  const firstGeneral = apiNonFieldErrors(err)[0];
  if (firstGeneral) return firstGeneral;

  return apiErrorDetail(err) || null;
}
