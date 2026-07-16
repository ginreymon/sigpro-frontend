export function calcSamTarget(
  samValue: string | number | null | undefined,
  intervalo: number,
  operarios: number,
): string | null {
  const sam = Number(samValue);
  if (!sam || sam <= 0) return null;
  if (intervalo <= 0) return '0';
  return ((intervalo * operarios) / sam).toFixed(1);
}
