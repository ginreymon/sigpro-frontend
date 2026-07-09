export function parseSessionErrors(err: unknown, fallback: string): string[] {
  const error = (err as any)?.error;
  return Array.isArray(error) ? error : [fallback];
}
