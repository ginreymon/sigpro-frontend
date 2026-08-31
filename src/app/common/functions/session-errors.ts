export function parseSessionErrors(err: unknown, fallback: string): string[] {
  const error = (err as any)?.error;
  return Array.isArray(error) ? error : [fallback];
}

// DRF ValidationError({ campo: "mensaje" }) responde el body como un dict
// { campo: "mensaje" | ["mensaje", ...] } — toma el primer mensaje de campo
// en vez de un genérico. Devuelve null si el body no trae ese shape.
export function extractFieldErrorMessage(err: unknown): string | null {
  const body = (err as any)?.error;
  if (!body || typeof body !== 'object') return null;
  const firstValue = Object.values(body)[0];
  return Array.isArray(firstValue) ? (firstValue[0] ?? null) : ((firstValue as string) ?? null);
}
