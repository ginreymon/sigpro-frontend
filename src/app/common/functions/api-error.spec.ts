import {
  apiErrorCode,
  apiErrorDetail,
  apiFieldErrors,
  apiNonFieldErrors,
} from './api-error';
import { extractFieldErrorMessage, parseSessionErrors } from './session-errors';

const http = (status: number, error: unknown) => ({ status, error });

describe('api-error (standard envelope)', () => {
  const validation = http(400, {
    detail: 'Este campo es requerido.',
    code: 'validation_error',
    errors: { color: ['Este campo es requerido.'], non_field_errors: ['Revisa el formulario.'] },
  });

  it('reads detail, code and errors from the envelope', () => {
    expect(apiErrorDetail(validation)).toBe('Este campo es requerido.');
    expect(apiErrorCode(validation)).toBe('validation_error');
    expect(apiFieldErrors(validation)).toEqual({ color: ['Este campo es requerido.'] });
    expect(apiNonFieldErrors(validation)).toEqual(['Revisa el formulario.']);
  });

  it('keeps a form field called "code" apart from the envelope code', () => {
    const err = http(400, {
      detail: 'Ya existe un registro con este valor.',
      code: 'validation_error',
      errors: { code: ['Ya existe un registro con este valor.'] },
      // legacy mirror must not be read as field errors when the envelope exists
      name: ['x'],
    });

    expect(apiFieldErrors(err)).toEqual({ code: ['Ya existe un registro con este valor.'] });
  });

  it('keeps the detail of a specific 5xx (e.g. SIESA unreachable)', () => {
    const err = http(502, { detail: 'Timeout al conectar con SIESA', code: 'siesa_unreachable', errors: {} });
    expect(apiErrorDetail(err, 'No se pudo enviar el TEP.')).toBe('Timeout al conectar con SIESA');
  });

  it('reads register_ids errors of a rejected TEP and keeps ok / error_type', () => {
    const err = http(400, {
      detail: 'register_ids invalidos',
      code: 'invalid_register_ids',
      errors: { register_ids: ['El registro 5 no existe'] },
      ok: false,
    });
    expect(apiFieldErrors(err)['register_ids']).toEqual(['El registro 5 no existe']);
  });

  it('uses the fallback for server errors (5xx)', () => {
    const err = http(500, { detail: 'Error interno del servidor.', code: 'server_error', errors: {} });
    expect(apiErrorDetail(err, 'No se pudo guardar')).toBe('No se pudo guardar');
    expect(extractFieldErrorMessage(err)).toBeNull();
  });
});

describe('api-error (previous shapes, for an old backend)', () => {
  it('reads a field dict', () => {
    const err = http(400, { op_number: ['Debe ser un número entero.'], op_type: 'Obligatorio' });
    expect(apiFieldErrors(err)).toEqual({
      op_number: ['Debe ser un número entero.'],
      op_type: ['Obligatorio'],
    });
    expect(extractFieldErrorMessage(err)).toBe('Debe ser un número entero.');
  });

  it('reads a list body as non-field errors', () => {
    const err = http(400, ['Juan ya está asignado al módulo X', 'Ana ya está asignada']);
    expect(apiNonFieldErrors(err)).toEqual([
      'Juan ya está asignado al módulo X',
      'Ana ya está asignada',
    ]);
    expect(parseSessionErrors(err, 'fallback')).toHaveLength(2);
  });

  it('reads detail / error / message', () => {
    expect(apiErrorDetail(http(400, { detail: 'a' }))).toBe('a');
    expect(apiErrorDetail(http(401, { error: 'Credenciales inválidas' }))).toBe('Credenciales inválidas');
    expect(apiErrorDetail(http(400, { message: 'm' }))).toBe('m');
  });

  it('uses the fallback for a 5xx with no standard body (e.g. an HTML page)', () => {
    expect(apiErrorDetail(http(500, '<html></html>'), 'fallback')).toBe('fallback');
  });

  it('reads non_field_errors at the top level', () => {
    expect(apiNonFieldErrors(http(400, { non_field_errors: ['x'] }))).toEqual(['x']);
  });
});

describe('api-error (no useful body)', () => {
  it('falls back when there is nothing to read', () => {
    expect(apiErrorDetail(http(0, null), 'sin conexión')).toBe('sin conexión');
    expect(apiFieldErrors(http(400, '<html></html>'))).toEqual({});
    expect(parseSessionErrors(http(400, { detail: 'x', code: 'c', errors: {} }), 'fallback')).toEqual([
      'fallback',
    ]);
    expect(extractFieldErrorMessage(http(0, null))).toBeNull();
  });
});