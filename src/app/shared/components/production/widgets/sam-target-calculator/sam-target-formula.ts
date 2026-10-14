export function calcSamTarget(
  samValue: string | number | null | undefined,
  intervalo: number,
  operarios: number,
): string | null {
  const sam = Number(samValue);
  if (!sam || sam <= 0) return null;
  if (intervalo <= 0) return '0';
  return Math.round((intervalo * operarios) / sam).toString();
}

// Inverses of calcSamTarget (meta = intervalo * operarios / sam): solve for one of the
// other two values given the target. null when the inputs cannot produce a result.
function roundTo(value: number, decimals: number): string {
  return Number(value.toFixed(decimals)).toString();
}

export function calcSamIntervalo(
  samValue: string | number | null | undefined,
  meta: number,
  operarios: number,
): string | null {
  const sam = Number(samValue);
  if (!sam || sam <= 0 || meta <= 0 || operarios <= 0) return null;
  return roundTo((meta * sam) / operarios, 1);
}

export function calcSamOperarios(
  samValue: string | number | null | undefined,
  meta: number,
  intervalo: number,
): string | null {
  const sam = Number(samValue);
  if (!sam || sam <= 0 || meta <= 0 || intervalo <= 0) return null;
  return roundTo((meta * sam) / intervalo, 2);
}
