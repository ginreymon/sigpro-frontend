// Standard error envelope of the API (every 4xx/5xx under /api/v1/):
//
//   { detail: string, code: string, errors: { [field]: string[] } }
//
// Non-field messages come under errors.non_field_errors. While the backend mirrors
// the previous shapes (API_ERRORS_LEGACY_MIRROR) these helpers read the envelope
// first and only then fall back to the old shapes, so they work against both an
// old and a new backend.

export interface ApiErrorBody {
  detail: string;
  code: string;
  errors: Record<string, string[]>;
}

export const NON_FIELD_ERRORS = 'non_field_errors';

const MESSAGE_KEYS = ['detail', 'error', 'message'];
const RESERVED_KEYS = [...MESSAGE_KEYS, 'code', 'errors'];

function bodyOf(err: unknown): any {
  return (err as any)?.error;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isStandardBody(body: unknown): body is ApiErrorBody {
  return isObject(body) && 'detail' in body && 'code' in body && isObject(body['errors']);
}

/** Flattens a message, a list or a nested object of messages into a list of strings. */
function toMessages(value: unknown): string[] {
  if (typeof value === 'string') return value ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(toMessages);
  if (isObject(value)) return Object.values(value).flatMap(toMessages);
  return [];
}

/** Machine-readable code of the error (e.g. validation_error, not_found), if the response has one. */
export function apiErrorCode(err: unknown): string | null {
  const body = bodyOf(err);
  return isStandardBody(body) && typeof body.code === 'string' ? body.code : null;
}

/**
 * Human readable message of the error, or `fallback` when the response has none.
 * The generic server error (5xx with code `server_error`, or a 5xx with no
 * standard body such as an HTML page) returns `fallback`: that text does not
 * help the user. Other 5xx errors (e.g. `siesa_unreachable`) keep their detail.
 */
export function apiErrorDetail(err: unknown, fallback = ''): string {
  const status = (err as any)?.status;
  if (typeof status === 'number' && status >= 500 && (apiErrorCode(err) ?? 'server_error') === 'server_error') {
    return fallback;
  }

  const body = bodyOf(err);

  if (isObject(body)) {
    const message = MESSAGE_KEYS.map((key) => body[key]).find(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
    if (message) return message;
  }

  if (Array.isArray(body)) return toMessages(body)[0] ?? fallback;

  return fallback;
}

/** Field errors of a validation error: { field: [messages] }. Empty when there are none. */
export function apiFieldErrors(err: unknown): Record<string, string[]> {
  const body = bodyOf(err);
  if (!isObject(body)) return {};

  const source = isStandardBody(body)
    ? (body.errors as Record<string, unknown>)
    : (Object.fromEntries(
        Object.entries(body).filter(([key]) => !RESERVED_KEYS.includes(key)),
      ) as Record<string, unknown>);

  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => key !== NON_FIELD_ERRORS)
      .map(([key, value]) => [key, toMessages(value)] as const)
      .filter(([, messages]) => messages.length > 0),
  );
}

/** Messages that are not tied to a field (business rules, list errors). */
export function apiNonFieldErrors(err: unknown): string[] {
  const body = bodyOf(err);

  if (Array.isArray(body)) return toMessages(body);
  if (!isObject(body)) return [];

  const source = isStandardBody(body) ? body.errors : body;
  return toMessages(source[NON_FIELD_ERRORS]);
}
