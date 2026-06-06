export function efficiencyTextColor(
  value: number | null | undefined,
  highLimit: number,
  lowLimit: number,
  active = true,
): string {
  if (!active || value == null) return 'text-gray-400';
  if (value >= highLimit) return 'text-green-600';
  if (value <= lowLimit) return 'text-red-600';
  return 'text-amber-500';
}
