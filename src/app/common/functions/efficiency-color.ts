export type EfficiencyTier = 'high' | 'mid' | 'low' | 'inactive';

export function efficiencyTier(
  value: number | null | undefined,
  highLimit: number,
  lowLimit: number,
  active = true,
): EfficiencyTier {
  if (!active || value == null) return 'inactive';
  if (value >= highLimit) return 'high';
  if (value <= lowLimit) return 'low';
  return 'mid';
}

const TEXT_COLORS: Record<EfficiencyTier, string> = {
  high: 'text-green-600',
  mid: 'text-amber-500',
  low: 'text-red-600',
  inactive: 'text-gray-400',
};

const STROKE_COLORS: Record<EfficiencyTier, string> = {
  high: 'stroke-green-600',
  mid: 'stroke-amber-500',
  low: 'stroke-red-600',
  inactive: 'stroke-gray-300',
};

export function efficiencyTextColor(
  value: number | null | undefined,
  highLimit: number,
  lowLimit: number,
  active = true,
): string {
  return TEXT_COLORS[efficiencyTier(value, highLimit, lowLimit, active)];
}

export function efficiencyStrokeColor(
  value: number | null | undefined,
  highLimit: number,
  lowLimit: number,
  active = true,
): string {
  return STROKE_COLORS[efficiencyTier(value, highLimit, lowLimit, active)];
}
