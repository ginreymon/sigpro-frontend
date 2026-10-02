export interface OriginBadge {
  text: string;
  dot: string;
}

// Clases completas (no armadas por partes) para que Tailwind las detecte.
const ORIGIN_BADGES: OriginBadge[] = [
  { text: 'text-brand-700', dot: 'bg-brand-500' },
  { text: 'text-green-700', dot: 'bg-green-500' },
  { text: 'text-amber-700', dot: 'bg-amber-500' },
  { text: 'text-sky-700', dot: 'bg-sky-500' },
  { text: 'text-purple-700', dot: 'bg-purple-500' },
  { text: 'text-rose-700', dot: 'bg-rose-500' },
  { text: 'text-teal-700', dot: 'bg-teal-500' },
  { text: 'text-orange-700', dot: 'bg-orange-500' },
];

const NO_ORIGIN_BADGE: OriginBadge = { text: 'text-gray-600', dot: 'bg-gray-400' };

// Un color fijo por origin_id; si hay más orígenes que colores, la paleta se repite.
export function originBadge(originId: number | null | undefined): OriginBadge {
  if (originId == null) return NO_ORIGIN_BADGE;
  const size = ORIGIN_BADGES.length;
  return ORIGIN_BADGES[(((originId - 1) % size) + size) % size];
}
