export function translateSessionError(m: string): string {
  const modMatch = m.match(/Module '(.+)' is already active in another session/);
  if (modMatch) return `El módulo '${modMatch[1]}' ya está activo en otra sesión.`;
  const empMatch = m.match(/(.+) is already assigned to module '(.+)'/);
  if (empMatch) return `${empMatch[1]} ya está asignado al módulo '${empMatch[2]}'.`;
  if (m === 'Session expired') return 'La sesión ha expirado.';
  return m;
}

export function parseSessionErrors(err: unknown, fallback: string): string[] {
  const error = (err as any)?.error;
  return Array.isArray(error) ? error.map(translateSessionError) : [fallback];
}
